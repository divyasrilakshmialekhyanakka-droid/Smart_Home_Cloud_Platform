import {
  users,
  houses,
  devices,
  alerts,
  automationRules,
  sensorData,
  surveillanceFeeds,
  userConfigLogs,
  type User,
  type UpsertUser,
  type House,
  type InsertHouse,
  type Device,
  type InsertDevice,
  type Alert,
  type InsertAlert,
  type AutomationRule,
  type InsertAutomationRule,
  type SensorData,
  type SurveillanceFeed,
  type UserConfigLog,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  getUsersByRole(role: string): Promise<User[]>;
  getAllUsers(): Promise<User[]>;
  
  // House operations
  createHouse(house: InsertHouse): Promise<House>;
  getHousesByOwner(ownerId: string): Promise<House[]>;
  getAllHouses(): Promise<House[]>;
  getHouseById(id: string): Promise<House | undefined>;
  
  // Device operations
  createDevice(device: InsertDevice): Promise<Device>;
  getDevicesByHouse(houseId: string): Promise<Device[]>;
  getAllDevices(): Promise<Device[]>;
  getDevice(id: string): Promise<Device | undefined>;
  updateDevice(id: string, device: Partial<Device>): Promise<Device>;
  deleteDevice(id: string): Promise<void>;
  getDevicesByType(type: string): Promise<Device[]>;
  
  // Alert operations
  createAlert(alert: InsertAlert): Promise<Alert>;
  getAlertsByHouse(houseId: string): Promise<Alert[]>;
  getAllAlerts(): Promise<Alert[]>;
  getRecentAlerts(limit?: number): Promise<Alert[]>;
  getAlert(id: string): Promise<Alert | undefined>;
  updateAlertStatus(id: string, status: string, userId: string): Promise<Alert>;
  
  // Automation rules
  createAutomationRule(rule: InsertAutomationRule): Promise<AutomationRule>;
  getAutomationRulesByHouse(houseId: string): Promise<AutomationRule[]>;
  
  // Sensor data
  createSensorData(data: Omit<SensorData, "id">): Promise<SensorData>;
  
  // Surveillance feeds
  getSurveillanceFeedsByHouse(houseId: string): Promise<SurveillanceFeed[]>;
  
  // User config logs
  createUserConfigLog(log: Omit<UserConfigLog, "id">): Promise<UserConfigLog>;
  getUserConfigLogs(limit?: number): Promise<UserConfigLog[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations (mandatory for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async getUsersByRole(role: string): Promise<User[]> {
    return await db.select().from(users).where(eq(users.role, role));
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  // House operations
  async createHouse(houseData: InsertHouse): Promise<House> {
    const [house] = await db.insert(houses).values(houseData).returning();
    return house;
  }

  async getHousesByOwner(ownerId: string): Promise<House[]> {
    return await db.select().from(houses).where(eq(houses.ownerId, ownerId));
  }

  async getAllHouses(): Promise<House[]> {
    return await db.select().from(houses);
  }

  async getHouseById(id: string): Promise<House | undefined> {
    const [house] = await db.select().from(houses).where(eq(houses.id, id));
    return house;
  }

  // Device operations
  async createDevice(deviceData: InsertDevice): Promise<Device> {
    const [device] = await db.insert(devices).values(deviceData).returning();
    return device;
  }

  async getDevicesByHouse(houseId: string): Promise<Device[]> {
    return await db.select().from(devices).where(eq(devices.houseId, houseId));
  }

  async getAllDevices(): Promise<Device[]> {
    return await db.select().from(devices).orderBy(desc(devices.createdAt));
  }

  async getDevice(id: string): Promise<Device | undefined> {
    const [device] = await db.select().from(devices).where(eq(devices.id, id));
    return device;
  }

  async updateDevice(id: string, deviceData: Partial<Device>): Promise<Device> {
    const [device] = await db
      .update(devices)
      .set({ ...deviceData, updatedAt: new Date() })
      .where(eq(devices.id, id))
      .returning();
    return device;
  }

  async deleteDevice(id: string): Promise<void> {
    await db.delete(devices).where(eq(devices.id, id));
  }

  async getDevicesByType(type: string): Promise<Device[]> {
    return await db.select().from(devices).where(eq(devices.type, type));
  }

  // Alert operations
  async createAlert(alertData: InsertAlert): Promise<Alert> {
    const [alert] = await db.insert(alerts).values(alertData).returning();
    return alert;
  }

  async getAlertsByHouse(houseId: string): Promise<Alert[]> {
    return await db
      .select()
      .from(alerts)
      .where(eq(alerts.houseId, houseId))
      .orderBy(desc(alerts.createdAt));
  }

  async getAllAlerts(): Promise<Alert[]> {
    return await db.select().from(alerts).orderBy(desc(alerts.createdAt));
  }

  async getRecentAlerts(limit: number = 10): Promise<Alert[]> {
    return await db
      .select()
      .from(alerts)
      .orderBy(desc(alerts.createdAt))
      .limit(limit);
  }

  async getAlert(id: string): Promise<Alert | undefined> {
    const [alert] = await db.select().from(alerts).where(eq(alerts.id, id));
    return alert;
  }

  async updateAlertStatus(id: string, status: string, userId: string): Promise<Alert> {
    const updateData: any = {
      status,
      updatedAt: new Date(),
    };

    if (status === "acknowledged") {
      updateData.acknowledgedBy = userId;
      updateData.acknowledgedAt = new Date();
    } else if (status === "resolved") {
      updateData.resolvedBy = userId;
      updateData.resolvedAt = new Date();
    }

    const [alert] = await db
      .update(alerts)
      .set(updateData)
      .where(eq(alerts.id, id))
      .returning();
    return alert;
  }

  // Automation rules
  async createAutomationRule(ruleData: InsertAutomationRule): Promise<AutomationRule> {
    const [rule] = await db.insert(automationRules).values(ruleData).returning();
    return rule;
  }

  async getAutomationRulesByHouse(houseId: string): Promise<AutomationRule[]> {
    return await db
      .select()
      .from(automationRules)
      .where(eq(automationRules.houseId, houseId));
  }

  // Sensor data
  async createSensorData(sensorDataInput: Omit<SensorData, "id">): Promise<SensorData> {
    const [data] = await db.insert(sensorData).values(sensorDataInput).returning();
    return data;
  }

  // Surveillance feeds
  async getSurveillanceFeedsByHouse(houseId: string): Promise<SurveillanceFeed[]> {
    return await db
      .select()
      .from(surveillanceFeeds)
      .innerJoin(devices, eq(surveillanceFeeds.deviceId, devices.id))
      .where(eq(devices.houseId, houseId))
      .then(results => results.map(r => r.surveillance_feeds));
  }

  // User config logs
  async createUserConfigLog(logData: Omit<UserConfigLog, "id">): Promise<UserConfigLog> {
    const [log] = await db.insert(userConfigLogs).values(logData).returning();
    return log;
  }

  async getUserConfigLogs(limit: number = 50): Promise<UserConfigLog[]> {
    return await db
      .select()
      .from(userConfigLogs)
      .orderBy(desc(userConfigLogs.timestamp))
      .limit(limit);
  }
}

export const storage = new DatabaseStorage();

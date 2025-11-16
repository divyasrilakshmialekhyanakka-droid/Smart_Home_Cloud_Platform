import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  boolean,
  real,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// ===== SESSION STORAGE =====
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// ===== USERS TABLE =====
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique().notNull(),
  password: varchar("password"), // Hashed password for email/password auth (null for OAuth users)
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role", { enum: ["homeowner", "iot_team", "cloud_staff"] }).notNull().default("homeowner"),
  authProvider: varchar("auth_provider"), // 'local', 'google', 'github', 'twitter', 'apple'
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  email: z.string().email("Must be a valid email address"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  role: z.enum(["homeowner", "iot_team", "cloud_staff"]),
  password: z.string().min(6, "Password must be at least 6 characters").optional(),
  authProvider: z.enum(["local", "google", "github", "twitter", "apple"]).optional(),
});

export const updateUserSchema = z.object({
  email: z.string().email("Must be a valid email address").optional(),
  firstName: z.string().min(1, "First name is required").optional(),
  lastName: z.string().min(1, "Last name is required").optional(),
  role: z.enum(["homeowner", "iot_team", "cloud_staff"]).optional(),
  password: z.string().min(6, "Password must be at least 6 characters").optional(),
  profileImageUrl: z.string().url().optional().nullable(),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpdateUser = z.infer<typeof updateUserSchema>;
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// ===== HOUSES TABLE =====
export const houses = pgTable("houses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ownerId: varchar("owner_id").references(() => users.id),
  name: text("name").notNull(),
  address: text("address").notNull(),
  squareFeet: integer("square_feet"),
  bedrooms: integer("bedrooms"),
  bathrooms: integer("bathrooms"),
  timezone: varchar("timezone").default("UTC-05:00"),
  latitude: real("latitude"),
  longitude: real("longitude"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertHouseSchema = createInsertSchema(houses).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertHouse = z.infer<typeof insertHouseSchema>;
export type House = typeof houses.$inferSelect;

// ===== DEVICES TABLE =====
export const devices = pgTable("devices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  houseId: varchar("house_id").notNull().references(() => houses.id, { onDelete: "cascade" }),
  serialNumber: varchar("serial_number").unique(),
  name: text("name").notNull(),
  type: varchar("type", { 
    enum: ["camera", "microphone", "motion_sensor", "thermostat", "lock", "light", "smoke_detector"] 
  }).notNull(),
  room: text("room").notNull(),
  status: varchar("status", { enum: ["online", "offline", "warning"] }).notNull().default("offline"),
  firmwareVersion: varchar("firmware_version"),
  batteryLevel: integer("battery_level"), // 0-100
  lastSeen: timestamp("last_seen"),
  config: jsonb("config"), // Device-specific configuration
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertDeviceSchema = createInsertSchema(devices).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertDevice = z.infer<typeof insertDeviceSchema>;
export type Device = typeof devices.$inferSelect;

// ===== ALERTS TABLE =====
export const alerts = pgTable("alerts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  houseId: varchar("house_id").notNull().references(() => houses.id, { onDelete: "cascade" }),
  deviceId: varchar("device_id").references(() => devices.id, { onDelete: "set null" }),
  type: varchar("type", {
    enum: [
      "motion_detected",
      "sound_detected",
      "glass_break",
      "fall_detected",
      "scream_detected",
      "device_offline",
      "low_battery",
      "temperature_anomaly",
      "system_anomaly",
      "intrusion",
    ]
  }).notNull(),
  severity: varchar("severity", { enum: ["low", "medium", "high", "critical"] }).notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  location: text("location"), // e.g., "Living Room", "Main Hall - Res. 123"
  aiConfidence: real("ai_confidence"), // 0.0 - 1.0
  aiDetails: jsonb("ai_details"), // Additional AI analysis data
  status: varchar("status", { enum: ["new", "acknowledged", "resolved", "dismissed"] }).notNull().default("new"),
  acknowledgedBy: varchar("acknowledged_by").references(() => users.id),
  acknowledgedAt: timestamp("acknowledged_at"),
  resolvedBy: varchar("resolved_by").references(() => users.id),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertAlertSchema = createInsertSchema(alerts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertAlert = z.infer<typeof insertAlertSchema>;
export type Alert = typeof alerts.$inferSelect;

// ===== AUTOMATION RULES TABLE =====
export const automationRules = pgTable("automation_rules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  houseId: varchar("house_id").notNull().references(() => houses.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  trigger: text("trigger").notNull(), // e.g., "Motion in Yard", "Night time"
  action: text("action").notNull(), // e.g., "Turn on Light", "Lock All Doors"
  status: varchar("status", { enum: ["active", "inactive"] }).notNull().default("active"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertAutomationRuleSchema = createInsertSchema(automationRules).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertAutomationRule = z.infer<typeof insertAutomationRuleSchema>;
export type AutomationRule = typeof automationRules.$inferSelect;

// ===== SENSOR DATA TABLE =====
export const sensorData = pgTable("sensor_data", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  deviceId: varchar("device_id").notNull().references(() => devices.id, { onDelete: "cascade" }),
  dataType: varchar("data_type", { 
    enum: ["temperature", "motion", "audio_level", "video_frame", "power_consumption"] 
  }).notNull(),
  value: real("value"),
  metadata: jsonb("metadata"), // Additional sensor-specific data
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

export type SensorData = typeof sensorData.$inferSelect;

// ===== USER CONFIGURATION LOGS TABLE =====
export const userConfigLogs = pgTable("user_config_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  configKey: text("config_key").notNull(),
  oldValue: text("old_value"),
  newValue: text("new_value"),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

export type UserConfigLog = typeof userConfigLogs.$inferSelect;

// ===== SURVEILLANCE FEEDS TABLE =====
export const surveillanceFeeds = pgTable("surveillance_feeds", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  deviceId: varchar("device_id").notNull().references(() => devices.id, { onDelete: "cascade" }),
  feedUrl: text("feed_url").notNull(), // Mock URL for video feed
  thumbnailUrl: text("thumbnail_url"),
  isLive: boolean("is_live").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export type SurveillanceFeed = typeof surveillanceFeeds.$inferSelect;

// ===== MAINTENANCE RECORDS TABLE =====
export const maintenanceRecords = pgTable("maintenance_records", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  task: text("task").notNull(),
  scheduledDate: varchar("scheduled_date").notNull(), // YYYY-MM-DD format
  scheduledTime: varchar("scheduled_time").notNull().default("08:00"), // HH:MM format
  status: varchar("status", { enum: ["scheduled", "in_progress", "completed", "cancelled"] }).notNull().default("scheduled"),
  category: varchar("category", { enum: ["database", "server", "network", "security", "hardware", "software", "other"] }).notNull().default("other"),
  priority: varchar("priority", { enum: ["low", "medium", "high", "critical"] }).notNull().default("medium"),
  description: text("description"),
  assignedTo: varchar("assigned_to"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const insertMaintenanceRecordSchema = createInsertSchema(maintenanceRecords).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertMaintenanceRecord = z.infer<typeof insertMaintenanceRecordSchema>;
export type MaintenanceRecord = typeof maintenanceRecords.$inferSelect;

// ===== AUDIO DETECTIONS TABLE =====
export const audioDetections = pgTable("audio_detections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  deviceId: varchar("device_id").notNull().references(() => devices.id, { onDelete: "cascade" }),
  houseId: varchar("house_id").notNull().references(() => houses.id),
  fileName: text("file_name").notNull(),
  fileSize: integer("file_size"),
  duration: real("duration"),
  modelUsed: varchar("model_used", { enum: ["yamnet", "hubert", "both"] }).notNull().default("both"),
  detectedClass: text("detected_class").notNull(), // e.g., "dog", "human scream", "glass breaking"
  confidence: real("confidence").notNull(), // 0.0 to 1.0
  predictions: jsonb("predictions"), // Full prediction results from models
  alertGenerated: boolean("alert_generated").notNull().default(false),
  alertId: varchar("alert_id").references(() => alerts.id),
  processedAt: timestamp("processed_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAudioDetectionSchema = createInsertSchema(audioDetections).omit({
  id: true,
  createdAt: true,
  processedAt: true,
});

export type InsertAudioDetection = z.infer<typeof insertAudioDetectionSchema>;
export type AudioDetection = typeof audioDetections.$inferSelect;

// ===== RELATIONS =====
export const usersRelations = relations(users, ({ many }) => ({
  houses: many(houses),
  acknowledgedAlerts: many(alerts, { relationName: "acknowledged_by" }),
  resolvedAlerts: many(alerts, { relationName: "resolved_by" }),
}));

export const housesRelations = relations(houses, ({ one, many }) => ({
  owner: one(users, {
    fields: [houses.ownerId],
    references: [users.id],
  }),
  devices: many(devices),
  alerts: many(alerts),
  automationRules: many(automationRules),
}));

export const devicesRelations = relations(devices, ({ one, many }) => ({
  house: one(houses, {
    fields: [devices.houseId],
    references: [houses.id],
  }),
  alerts: many(alerts),
  sensorData: many(sensorData),
  surveillanceFeeds: many(surveillanceFeeds),
}));

export const alertsRelations = relations(alerts, ({ one }) => ({
  house: one(houses, {
    fields: [alerts.houseId],
    references: [houses.id],
  }),
  device: one(devices, {
    fields: [alerts.deviceId],
    references: [devices.id],
  }),
  acknowledgedByUser: one(users, {
    fields: [alerts.acknowledgedBy],
    references: [users.id],
    relationName: "acknowledged_by",
  }),
  resolvedByUser: one(users, {
    fields: [alerts.resolvedBy],
    references: [users.id],
    relationName: "resolved_by",
  }),
}));

export const automationRulesRelations = relations(automationRules, ({ one }) => ({
  house: one(houses, {
    fields: [automationRules.houseId],
    references: [houses.id],
  }),
}));

export const sensorDataRelations = relations(sensorData, ({ one }) => ({
  device: one(devices, {
    fields: [sensorData.deviceId],
    references: [devices.id],
  }),
}));

export const surveillanceFeedsRelations = relations(surveillanceFeeds, ({ one }) => ({
  device: one(devices, {
    fields: [surveillanceFeeds.deviceId],
    references: [devices.id],
  }),
}));

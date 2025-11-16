import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { requireRole, canAccessHouse } from "./middleware";
import { 
  insertDeviceSchema, 
  insertAlertSchema, 
  insertHouseSchema,
  maintenanceRecords,
  insertMaintenanceRecordSchema,
  insertUserSchema,
  audioDetections,
  alerts,
  houses,
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import { ZodError } from "zod";
import multer from "multer";
import { analyzeAudio, generateAlertDescription } from "./audioDetectionService";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // ===== AUTH ROUTES =====
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // ===== USER MANAGEMENT ROUTES (Cloud Staff Only) =====
  app.get('/api/users', isAuthenticated, requireRole('cloud_staff'), async (req: any, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.get('/api/users/active', isAuthenticated, requireRole('cloud_staff'), async (req: any, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users.slice(0, 5));
    } catch (error) {
      console.error("Error fetching active users:", error);
      res.status(500).json({ message: "Failed to fetch active users" });
    }
  });

  app.post('/api/users', isAuthenticated, requireRole('cloud_staff'), async (req: any, res) => {
    try {
      // Validate request body using drizzle-zod schema
      const validatedData = insertUserSchema.parse(req.body);

      // Check if user with this email already exists
      const existingUser = await storage.getUserByEmail(validatedData.email);
      if (existingUser) {
        return res.status(409).json({ message: "User with this email already exists" });
      }

      // Create user with a collision-safe UUID (will be replaced on OIDC login)
      const userId = `pre-${randomUUID()}`;
      const user = await storage.upsertUser({
        id: userId,
        ...validatedData,
      });

      res.status(201).json(user);
    } catch (error) {
      console.error("Error creating user:", error);
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          message: "Validation failed", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  // ===== HOUSE ROUTES =====
  app.post('/api/houses', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertHouseSchema.parse({
        ...req.body,
        ownerId: userId,
      });
      const house = await storage.createHouse(validatedData);
      res.status(201).json(house);
    } catch (error) {
      console.error("Error creating house:", error);
      res.status(400).json({ message: "Failed to create house" });
    }
  });

  app.get('/api/houses', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role === 'cloud_staff' || user?.role === 'iot_team') {
        const houses = await storage.getAllHouses();
        res.json(houses);
      } else {
        const houses = await storage.getHousesByOwner(userId);
        res.json(houses);
      }
    } catch (error) {
      console.error("Error fetching houses:", error);
      res.status(500).json({ message: "Failed to fetch houses" });
    }
  });

  // ===== DEVICE ROUTES =====
  app.post('/api/devices', isAuthenticated, requireRole('iot_team', 'cloud_staff'), async (req: any, res) => {
    try {
      const validatedData = insertDeviceSchema.parse(req.body);
      
      // Verify the house exists
      const house = await storage.getHouseById(validatedData.houseId);
      if (!house) {
        return res.status(404).json({ message: "House not found" });
      }

      const device = await storage.createDevice(validatedData);
      res.status(201).json(device);
    } catch (error) {
      console.error("Error creating device:", error);
      res.status(400).json({ message: "Failed to create device" });
    }
  });

  app.get('/api/devices', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      if (user.role === 'cloud_staff' || user.role === 'iot_team') {
        const devices = await storage.getAllDevices();
        res.json(devices);
      } else {
        // Homeowners see only devices from their houses
        const houses = await storage.getHousesByOwner(userId);
        const houseIds = houses.map(h => h.id);
        const allDevices = await storage.getAllDevices();
        const userDevices = allDevices.filter(d => houseIds.includes(d.houseId));
        res.json(userDevices);
      }
    } catch (error) {
      console.error("Error fetching devices:", error);
      res.status(500).json({ message: "Failed to fetch devices" });
    }
  });

  app.get('/api/devices/cameras', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      if (user.role === 'cloud_staff' || user.role === 'iot_team') {
        const cameras = await storage.getDevicesByType('camera');
        res.json(cameras);
      } else {
        // Homeowners see only cameras from their houses
        const houses = await storage.getHousesByOwner(userId);
        const houseIds = houses.map(h => h.id);
        const allCameras = await storage.getDevicesByType('camera');
        const userCameras = allCameras.filter(c => houseIds.includes(c.houseId));
        res.json(userCameras);
      }
    } catch (error) {
      console.error("Error fetching cameras:", error);
      res.status(500).json({ message: "Failed to fetch cameras" });
    }
  });

  app.get('/api/devices/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const device = await storage.getDevice(req.params.id);

      if (!device) {
        return res.status(404).json({ message: "Device not found" });
      }

      // Check authorization
      if (user?.role === 'homeowner') {
        const hasAccess = await canAccessHouse(userId, device.houseId, user.role);
        if (!hasAccess) {
          return res.status(403).json({ message: "Access denied to this device" });
        }
      }

      res.json(device);
    } catch (error) {
      console.error("Error fetching device:", error);
      res.status(500).json({ message: "Failed to fetch device" });
    }
  });

  app.patch('/api/devices/:id', isAuthenticated, requireRole('iot_team', 'cloud_staff'), async (req: any, res) => {
    try {
      const device = await storage.updateDevice(req.params.id, req.body);
      res.json(device);
    } catch (error) {
      console.error("Error updating device:", error);
      res.status(400).json({ message: "Failed to update device" });
    }
  });

  app.delete('/api/devices/:id', isAuthenticated, requireRole('iot_team', 'cloud_staff'), async (req: any, res) => {
    try {
      await storage.deleteDevice(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting device:", error);
      res.status(500).json({ message: "Failed to delete device" });
    }
  });

  // ===== ALERT ROUTES =====
  app.post('/api/alerts', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const validatedData = insertAlertSchema.parse(req.body);

      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      // Verify homeowners can only create alerts for their own houses
      if (user.role === 'homeowner') {
        const hasAccess = await canAccessHouse(userId, validatedData.houseId, user.role);
        if (!hasAccess) {
          return res.status(403).json({ message: "Cannot create alerts for houses you don't own" });
        }
      }

      const alert = await storage.createAlert(validatedData);
      res.status(201).json(alert);
    } catch (error) {
      console.error("Error creating alert:", error);
      res.status(400).json({ message: "Failed to create alert" });
    }
  });

  app.get('/api/alerts', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      if (user.role === 'cloud_staff' || user.role === 'iot_team') {
        const alerts = await storage.getAllAlerts();
        res.json(alerts);
      } else {
        // Homeowners see only alerts from their houses
        const houses = await storage.getHousesByOwner(userId);
        const houseIds = houses.map(h => h.id);
        const allAlerts = await storage.getAllAlerts();
        const userAlerts = allAlerts.filter(a => houseIds.includes(a.houseId));
        res.json(userAlerts);
      }
    } catch (error) {
      console.error("Error fetching alerts:", error);
      res.status(500).json({ message: "Failed to fetch alerts" });
    }
  });

  app.get('/api/alerts/recent', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const limit = parseInt(req.query.limit as string) || 10;

      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      if (user.role === 'cloud_staff' || user.role === 'iot_team') {
        const alerts = await storage.getRecentAlerts(limit);
        res.json(alerts);
      } else {
        // Homeowners see only recent alerts from their houses
        const houses = await storage.getHousesByOwner(userId);
        const houseIds = houses.map(h => h.id);
        const allAlerts = await storage.getRecentAlerts(limit * 2); // Get more to filter
        const userAlerts = allAlerts.filter(a => houseIds.includes(a.houseId)).slice(0, limit);
        res.json(userAlerts);
      }
    } catch (error) {
      console.error("Error fetching recent alerts:", error);
      res.status(500).json({ message: "Failed to fetch recent alerts" });
    }
  });

  app.post('/api/alerts/:id/acknowledge', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const alert = await storage.getAlert(req.params.id);

      if (!alert) {
        return res.status(404).json({ message: "Alert not found" });
      }

      // Check authorization for homeowners
      if (user?.role === 'homeowner') {
        const hasAccess = await canAccessHouse(userId, alert.houseId, user.role);
        if (!hasAccess) {
          return res.status(403).json({ message: "Access denied to this alert" });
        }
      }

      const updatedAlert = await storage.updateAlertStatus(req.params.id, 'acknowledged', userId);
      res.json(updatedAlert);
    } catch (error) {
      console.error("Error acknowledging alert:", error);
      res.status(500).json({ message: "Failed to acknowledge alert" });
    }
  });

  app.post('/api/alerts/:id/resolve', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const alert = await storage.getAlert(req.params.id);

      if (!alert) {
        return res.status(404).json({ message: "Alert not found" });
      }

      // Check authorization for homeowners
      if (user?.role === 'homeowner') {
        const hasAccess = await canAccessHouse(userId, alert.houseId, user.role);
        if (!hasAccess) {
          return res.status(403).json({ message: "Access denied to this alert" });
        }
      }

      const updatedAlert = await storage.updateAlertStatus(req.params.id, 'resolved', userId);
      res.json(updatedAlert);
    } catch (error) {
      console.error("Error resolving alert:", error);
      res.status(500).json({ message: "Failed to resolve alert" });
    }
  });

  app.post('/api/alerts/:id/dismiss', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const alert = await storage.getAlert(req.params.id);

      if (!alert) {
        return res.status(404).json({ message: "Alert not found" });
      }

      // Check authorization for homeowners
      if (user?.role === 'homeowner') {
        const hasAccess = await canAccessHouse(userId, alert.houseId, user.role);
        if (!hasAccess) {
          return res.status(403).json({ message: "Access denied to this alert" });
        }
      }

      const updatedAlert = await storage.updateAlertStatus(req.params.id, 'dismissed', userId);
      res.json(updatedAlert);
    } catch (error) {
      console.error("Error dismissing alert:", error);
      res.status(500).json({ message: "Failed to dismiss alert" });
    }
  });

  // ===== DATABASE MANAGEMENT ROUTES (Staff Only) =====
  app.get('/api/database/config-logs', isAuthenticated, requireRole('cloud_staff', 'iot_team'), async (req: any, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const logs = await storage.getUserConfigLogs(limit);
      res.json(logs);
    } catch (error) {
      console.error("Error fetching config logs:", error);
      res.status(500).json({ message: "Failed to fetch config logs" });
    }
  });

  // ===== MAINTENANCE ROUTES (Staff Only) =====
  app.get('/api/maintenance', isAuthenticated, requireRole('cloud_staff'), async (req: any, res) => {
    try {
      const records = await db.select().from(maintenanceRecords).orderBy(maintenanceRecords.scheduledDate);
      res.json(records);
    } catch (error) {
      console.error("Error fetching maintenance records:", error);
      res.status(500).json({ message: "Failed to fetch maintenance records" });
    }
  });

  app.post('/api/maintenance', isAuthenticated, requireRole('cloud_staff'), async (req: any, res) => {
    try {
      const validatedData = insertMaintenanceRecordSchema.parse(req.body);
      const [record] = await db.insert(maintenanceRecords).values(validatedData).returning();
      res.status(201).json(record);
    } catch (error) {
      console.error("Error creating maintenance record:", error);
      res.status(500).json({ message: "Failed to create maintenance record" });
    }
  });

  app.patch('/api/maintenance/:id', isAuthenticated, requireRole('cloud_staff'), async (req: any, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      const [updated] = await db.update(maintenanceRecords)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(maintenanceRecords.id, id))
        .returning();
      
      if (!updated) {
        return res.status(404).json({ message: "Maintenance record not found" });
      }
      
      res.json(updated);
    } catch (error) {
      console.error("Error updating maintenance record:", error);
      res.status(500).json({ message: "Failed to update maintenance record" });
    }
  });

  app.delete('/api/maintenance/:id', isAuthenticated, requireRole('cloud_staff'), async (req: any, res) => {
    try {
      const { id } = req.params;
      
      const [deleted] = await db.delete(maintenanceRecords)
        .where(eq(maintenanceRecords.id, id))
        .returning();
      
      if (!deleted) {
        return res.status(404).json({ message: "Maintenance record not found" });
      }
      
      res.json({ message: "Maintenance record deleted successfully" });
    } catch (error) {
      console.error("Error deleting maintenance record:", error);
      res.status(500).json({ message: "Failed to delete maintenance record" });
    }
  });

  // ===== AUDIO DETECTION ROUTES (IoT Team & Cloud Staff) =====
  
  // Configure multer for audio file uploads (in-memory storage)
  const audioUpload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB max file size
    },
    fileFilter: (req, file, cb) => {
      // Accept common audio formats
      const allowedMimeTypes = [
        'audio/wav',
        'audio/wave',
        'audio/x-wav',
        'audio/mpeg',
        'audio/mp3',
        'audio/ogg',
        'audio/webm',
        'audio/flac',
      ];
      
      if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Invalid file type. Only audio files are allowed.'));
      }
    },
  });

  // Get all audio detections (with pagination)
  app.get('/api/audio/detections', isAuthenticated, requireRole('cloud_staff', 'iot_team'), async (req: any, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const detections = await db.select()
        .from(audioDetections)
        .orderBy(audioDetections.createdAt)
        .limit(limit);
      
      res.json(detections);
    } catch (error) {
      console.error("Error fetching audio detections:", error);
      res.status(500).json({ message: "Failed to fetch audio detections" });
    }
  });

  // Get audio detections for a specific device (Staff & IoT Team only - no homeowner access to prevent cross-tenant data leakage)
  app.get('/api/audio/detections/device/:deviceId', isAuthenticated, requireRole('cloud_staff', 'iot_team'), async (req: any, res) => {
    try {
      const { deviceId } = req.params;
      const limit = parseInt(req.query.limit as string) || 20;
      
      // Verify device exists (role check already done by requireRole middleware)
      const device = await storage.getDevice(deviceId);
      if (!device) {
        return res.status(404).json({ message: "Device not found" });
      }
      
      const detections = await db.select()
        .from(audioDetections)
        .where(eq(audioDetections.deviceId, deviceId))
        .orderBy(audioDetections.createdAt)
        .limit(limit);
      
      res.json(detections);
    } catch (error) {
      console.error("Error fetching device audio detections:", error);
      res.status(500).json({ message: "Failed to fetch device audio detections" });
    }
  });

  // Analyze audio file and potentially generate alert
  app.post('/api/audio/analyze', isAuthenticated, requireRole('cloud_staff', 'iot_team'), audioUpload.single('audio'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No audio file provided" });
      }

      const { deviceId } = req.body;
      
      if (!deviceId) {
        return res.status(400).json({ message: "Device ID is required" });
      }

      // Get device details
      const device = await storage.getDevice(deviceId);
      if (!device) {
        return res.status(404).json({ message: "Device not found" });
      }

      // Get house details for location context
      const [house] = await db.select().from(houses).where(eq(houses.id, device.houseId));
      const deviceLocation = `${device.room || 'Unknown Room'} - ${house?.name || 'Unknown House'}`;

      // Analyze audio using simulated YAMNet and HuBERT models
      const analysisResult = analyzeAudio(
        req.file.originalname,
        req.file.buffer,
        deviceLocation
      );

      // Create audio detection record
      const [detection] = await db.insert(audioDetections).values({
        deviceId: device.id,
        houseId: device.houseId,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        modelUsed: analysisResult.primaryDetection.model,
        detectedClass: analysisResult.primaryDetection.class,
        confidence: analysisResult.primaryDetection.confidence,
        predictions: analysisResult.allPredictions,
        alertGenerated: analysisResult.shouldGenerateAlert,
      }).returning();

      // Generate alert if necessary
      let generatedAlert = null;
      if (analysisResult.shouldGenerateAlert) {
        const alertDescription = generateAlertDescription(
          analysisResult.primaryDetection.class,
          analysisResult.primaryDetection.confidence,
          device.name,
          deviceLocation
        );

        // Map audio detection alert type to existing alert type enum
        const alertTypeMapping: Record<string, typeof alerts.$inferInsert.type> = {
          'emergency': 'sound_detected',
          'safety': 'sound_detected',
          'security': 'intrusion',
          'maintenance': 'system_anomaly',
          'health': 'scream_detected',
        };

        const alertType = alertTypeMapping[analysisResult.alertType!] || 'sound_detected';

        const [newAlert] = await db.insert(alerts).values({
          houseId: device.houseId,
          deviceId: device.id,
          type: alertType,
          severity: analysisResult.alertSeverity!,
          title: analysisResult.alertMessage!,
          description: alertDescription,
          location: deviceLocation,
          aiConfidence: analysisResult.primaryDetection.confidence,
          aiDetails: analysisResult.allPredictions,
          status: 'new',
        }).returning();

        generatedAlert = newAlert;

        // Update detection record with alert ID
        await db.update(audioDetections)
          .set({ alertId: newAlert.id })
          .where(eq(audioDetections.id, detection.id));
      }

      res.status(201).json({
        detection: {
          ...detection,
          alertId: generatedAlert?.id || null,
        },
        analysis: analysisResult,
        alert: generatedAlert,
      });

    } catch (error) {
      console.error("Error analyzing audio:", error);
      if (error instanceof Error && error.message.includes('Invalid file type')) {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({ message: "Failed to analyze audio" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

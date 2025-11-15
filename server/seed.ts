import { db } from "./db";
import { users, houses, devices, alerts, automationRules, surveillanceFeeds } from "@shared/schema";

async function seed() {
  console.log("🌱 Starting database seed...");

  // Clear existing data
  console.log("Clearing existing data...");
  await db.delete(surveillanceFeeds);
  await db.delete(automationRules);
  await db.delete(alerts);
  await db.delete(devices);
  await db.delete(houses);
  // Don't delete users - they're created by auth

  // Create sample houses (without owners - will be assigned when users log in)
  console.log("Creating houses...");
  const [house1, house2, house3] = await db.insert(houses).values([
    {
      id: "house-001",
      ownerId: null,
      name: "Johnson Residence",
      address: "123 Oak Street, San Francisco, CA 94102",
      squareFeet: 2400,
      bedrooms: 3,
      bathrooms: 2,
    },
    {
      id: "house-002",
      ownerId: null,
      name: "Smith Family Home",
      address: "456 Maple Avenue, San Jose, CA 95112",
      squareFeet: 3200,
      bedrooms: 4,
      bathrooms: 3,
    },
    {
      id: "house-003",
      ownerId: null,
      name: "Anderson Senior Living",
      address: "789 Pine Road, Oakland, CA 94601",
      squareFeet: 1800,
      bedrooms: 2,
      bathrooms: 2,
    },
  ]).returning();

  // Create devices for house 1
  console.log("Creating devices...");
  await db.insert(devices).values([
    // Smart lights
    {
      id: "dev-light-001",
      houseId: house1.id,
      name: "Living Room Light",
      type: "light",
      room: "Living Room",
      status: "online",
      batteryLevel: null,
      configuration: { brightness: 80, color: "warm white" },
    },
    {
      id: "dev-light-002",
      houseId: house1.id,
      name: "Bedroom Light",
      type: "light",
      room: "Master Bedroom",
      status: "online",
      batteryLevel: null,
      configuration: { brightness: 60, color: "soft white" },
    },
    {
      id: "dev-light-003",
      houseId: house1.id,
      name: "Kitchen Light",
      type: "light",
      room: "Kitchen",
      status: "online",
      batteryLevel: null,
      configuration: { brightness: 100, color: "daylight" },
    },
    // Thermostat
    {
      id: "dev-thermo-001",
      houseId: house1.id,
      name: "Main Thermostat",
      type: "thermostat",
      room: "Hallway",
      status: "online",
      batteryLevel: null,
      configuration: { targetTemp: 72, mode: "auto", humidity: 45 },
    },
    // Smart locks
    {
      id: "dev-lock-001",
      houseId: house1.id,
      name: "Front Door Lock",
      type: "lock",
      room: "Entrance",
      status: "online",
      batteryLevel: 85,
      configuration: { locked: true, autoLock: true },
    },
    {
      id: "dev-lock-002",
      houseId: house1.id,
      name: "Back Door Lock",
      type: "lock",
      room: "Back Porch",
      status: "online",
      batteryLevel: 92,
      configuration: { locked: true, autoLock: true },
    },
    // Motion sensors
    {
      id: "dev-motion-001",
      houseId: house1.id,
      name: "Living Room Sensor",
      type: "motion_sensor",
      room: "Living Room",
      status: "online",
      batteryLevel: 78,
      configuration: { sensitivity: "medium", armed: true },
    },
    {
      id: "dev-motion-002",
      houseId: house1.id,
      name: "Bedroom Sensor",
      type: "motion_sensor",
      room: "Master Bedroom",
      status: "online",
      batteryLevel: 68,
      configuration: { sensitivity: "high", armed: true },
    },
    // Cameras
    {
      id: "dev-cam-001",
      houseId: house1.id,
      name: "Front Yard Camera",
      type: "camera",
      room: "Front Yard",
      status: "online",
      batteryLevel: null,
      configuration: { resolution: "1080p", nightVision: true, recording: true },
    },
    {
      id: "dev-cam-002",
      houseId: house1.id,
      name: "Living Room Camera",
      type: "camera",
      room: "Living Room",
      status: "online",
      batteryLevel: null,
      configuration: { resolution: "1080p", nightVision: false, recording: true },
    },
    {
      id: "dev-cam-003",
      houseId: house1.id,
      name: "Backyard Camera",
      type: "camera",
      room: "Backyard",
      status: "online",
      batteryLevel: null,
      configuration: { resolution: "1080p", nightVision: true, recording: true },
    },
    {
      id: "dev-cam-004",
      houseId: house1.id,
      name: "Kitchen Camera",
      type: "camera",
      room: "Kitchen",
      status: "online",
      batteryLevel: null,
      configuration: { resolution: "720p", nightVision: false, recording: true },
    },
  ]);

  // Create devices for house 2
  await db.insert(devices).values([
    {
      id: "dev-light-101",
      houseId: house2.id,
      name: "Main Living Light",
      type: "light",
      room: "Living Room",
      status: "online",
      batteryLevel: null,
      configuration: { brightness: 75, color: "warm white" },
    },
    {
      id: "dev-thermo-101",
      houseId: house2.id,
      name: "Nest Thermostat",
      type: "thermostat",
      room: "Main Floor",
      status: "online",
      batteryLevel: null,
      configuration: { targetTemp: 70, mode: "cool", humidity: 42 },
    },
    {
      id: "dev-cam-101",
      houseId: house2.id,
      name: "Entrance Camera",
      type: "camera",
      room: "Front Door",
      status: "online",
      batteryLevel: null,
      configuration: { resolution: "4K", nightVision: true, recording: true },
    },
  ]);

  // Create devices for house 3
  await db.insert(devices).values([
    {
      id: "dev-motion-201",
      houseId: house3.id,
      name: "Fall Detection Sensor",
      type: "motion_sensor",
      room: "Bedroom",
      status: "online",
      batteryLevel: 95,
      configuration: { sensitivity: "high", armed: true, fallDetection: true },
    },
    {
      id: "dev-cam-201",
      houseId: house3.id,
      name: "Senior Care Camera",
      type: "camera",
      room: "Living Room",
      status: "online",
      batteryLevel: null,
      configuration: { resolution: "1080p", nightVision: true, recording: true, aiDetection: true },
    },
  ]);

  // Create alerts
  console.log("Creating alerts...");
  const now = new Date();
  await db.insert(alerts).values([
    {
      id: "alert-001",
      houseId: house1.id,
      deviceId: "dev-motion-001",
      type: "motion_detected",
      severity: "medium",
      title: "Motion Detected - Living Room",
      description: "Unexpected motion detected in living room at 2:30 AM",
      location: "Living Room",
      status: "new",
      aiConfidence: 0.87,
      aiDetails: {
        anomaly: "unusual_time",
        pattern: "No movement typically detected at this hour"
      },
      createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000), // 2 hours ago
    },
    {
      id: "alert-002",
      houseId: house3.id,
      deviceId: "dev-motion-201",
      type: "fall_detected",
      severity: "critical",
      title: "Fall Detected - Senior Resident",
      description: "AI detected potential fall in bedroom. Immediate attention required.",
      location: "Bedroom",
      status: "acknowledged",
      acknowledgedBy: null,
      acknowledgedAt: new Date(now.getTime() - 30 * 60 * 1000),
      aiConfidence: 0.94,
      aiDetails: {
        anomaly: "fall_pattern",
        pattern: "Sudden vertical movement followed by prolonged stillness"
      },
      createdAt: new Date(now.getTime() - 45 * 60 * 1000), // 45 minutes ago
    },
    {
      id: "alert-003",
      houseId: house1.id,
      deviceId: "dev-lock-001",
      type: "device_offline",
      severity: "high",
      title: "Front Door Lock Offline",
      description: "Smart lock lost connection. Battery may be low.",
      location: "Entrance",
      status: "resolved",
      resolvedBy: null,
      resolvedAt: new Date(now.getTime() - 1 * 60 * 60 * 1000),
      createdAt: new Date(now.getTime() - 4 * 60 * 60 * 1000), // 4 hours ago
    },
    {
      id: "alert-004",
      houseId: house2.id,
      deviceId: "dev-thermo-101",
      type: "temperature_anomaly",
      severity: "medium",
      title: "Temperature Spike Detected",
      description: "Living room temperature rose to 85°F unexpectedly",
      location: "Main Floor",
      status: "new",
      aiConfidence: 0.76,
      aiDetails: {
        anomaly: "temperature_spike",
        pattern: "15°F increase in 30 minutes"
      },
      createdAt: new Date(now.getTime() - 1 * 60 * 60 * 1000), // 1 hour ago
    },
    {
      id: "alert-005",
      houseId: house1.id,
      deviceId: "dev-cam-001",
      type: "intrusion",
      severity: "critical",
      title: "Unrecognized Person Detected",
      description: "AI detected unknown individual approaching front door",
      location: "Front Yard",
      status: "new",
      aiConfidence: 0.91,
      aiDetails: {
        anomaly: "unknown_face",
        pattern: "Face not in resident database"
      },
      createdAt: new Date(now.getTime() - 15 * 60 * 1000), // 15 minutes ago
    },
    {
      id: "alert-006",
      houseId: house3.id,
      deviceId: "dev-cam-201",
      type: "scream_detected",
      severity: "high",
      title: "Distress Audio Detected",
      description: "AI audio analysis detected possible distress vocalization",
      location: "Living Room",
      status: "acknowledged",
      acknowledgedBy: null,
      acknowledgedAt: new Date(now.getTime() - 5 * 60 * 1000),
      aiConfidence: 0.83,
      aiDetails: {
        anomaly: "distress_sound",
        pattern: "High-frequency vocalization with irregular pattern"
      },
      createdAt: new Date(now.getTime() - 20 * 60 * 1000), // 20 minutes ago
    },
    {
      id: "alert-007",
      houseId: house1.id,
      deviceId: "dev-motion-002",
      type: "system_anomaly",
      severity: "low",
      title: "Sensor Connection Unstable",
      description: "Bedroom sensor experiencing intermittent connectivity",
      location: "Master Bedroom",
      status: "new",
      createdAt: new Date(now.getTime() - 30 * 60 * 1000), // 30 minutes ago
    },
  ]);

  // Create automation rules
  console.log("Creating automation rules...");
  await db.insert(automationRules).values([
    {
      id: "rule-001",
      houseId: house1.id,
      name: "Night Mode",
      trigger: "Time-based: 22:00",
      action: "Dim lights to 20%, Lock front door",
      status: "active",
    },
    {
      id: "rule-002",
      houseId: house1.id,
      name: "Away Mode",
      trigger: "Manual activation",
      action: "Turn off all lights, Set thermostat to 68°F",
      status: "active",
    },
    {
      id: "rule-003",
      houseId: house3.id,
      name: "Fall Detection Alert",
      trigger: "Fall detected by bedroom sensor",
      action: "Send emergency notification, Start camera recording",
      status: "active",
    },
  ]);

  // Create surveillance feeds
  console.log("Creating surveillance feeds...");
  await db.insert(surveillanceFeeds).values([
    {
      id: "feed-001",
      deviceId: "dev-cam-001",
      feedUrl: "rtsp://mock-stream/front-yard",
      thumbnailUrl: "https://via.placeholder.com/320x240?text=Front+Yard",
      isLive: true,
    },
    {
      id: "feed-002",
      deviceId: "dev-cam-002",
      feedUrl: "rtsp://mock-stream/living-room",
      thumbnailUrl: "https://via.placeholder.com/320x240?text=Living+Room",
      isLive: true,
    },
    {
      id: "feed-003",
      deviceId: "dev-cam-003",
      feedUrl: "rtsp://mock-stream/backyard",
      thumbnailUrl: "https://via.placeholder.com/320x240?text=Backyard",
      isLive: true,
    },
    {
      id: "feed-004",
      deviceId: "dev-cam-004",
      feedUrl: "rtsp://mock-stream/kitchen",
      thumbnailUrl: "https://via.placeholder.com/320x240?text=Kitchen",
      isLive: false,
    },
    {
      id: "feed-101",
      deviceId: "dev-cam-101",
      feedUrl: "rtsp://mock-stream/entrance",
      thumbnailUrl: "https://via.placeholder.com/320x240?text=Entrance",
      isLive: true,
    },
    {
      id: "feed-201",
      deviceId: "dev-cam-201",
      feedUrl: "rtsp://mock-stream/senior-care",
      thumbnailUrl: "https://via.placeholder.com/320x240?text=Senior+Care",
      isLive: true,
    },
  ]);

  console.log("✅ Database seeded successfully!");
  console.log(`Created ${3} houses`);
  console.log(`Created ${17} devices`);
  console.log(`Created ${7} alerts`);
  console.log(`Created ${3} automation rules`);
  console.log(`Created ${6} surveillance feeds`);
}

seed()
  .catch((error) => {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });

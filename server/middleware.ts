import type { RequestHandler } from "express";

// Role-based authorization middleware
export function requireRole(...allowedRoles: string[]): RequestHandler {
  return async (req: any, res, next) => {
    try {
      if (!req.user || !req.user.claims) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const userId = req.user.claims.sub;
      
      // Get user from storage to check role
      const { storage } = await import("./storage");
      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      if (!allowedRoles.includes(user.role)) {
        return res.status(403).json({ 
          message: "Forbidden: Insufficient permissions",
          required: allowedRoles,
          current: user.role
        });
      }

      // Attach user to request for downstream use
      req.currentUser = user;
      next();
    } catch (error) {
      console.error("Role check error:", error);
      res.status(500).json({ message: "Authorization check failed" });
    }
  };
}

// Check if user owns a house or has staff privileges
export async function canAccessHouse(userId: string, houseId: string, userRole: string): Promise<boolean> {
  if (userRole === "cloud_staff" || userRole === "iot_team") {
    return true; // Staff can access all houses
  }

  const { storage } = await import("./storage");
  const house = await storage.getHouseById(houseId);
  return house?.ownerId === userId;
}

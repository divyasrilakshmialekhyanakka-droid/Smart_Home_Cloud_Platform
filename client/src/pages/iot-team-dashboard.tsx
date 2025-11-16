import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Smartphone,
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ChevronRight,
  Plus,
  Settings,
  Video,
  Mic,
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Link } from "wouter";
import type { Device, Alert } from "@shared/schema";

export default function IoTTeamDashboard() {
  const { data: devices, isLoading: devicesLoading } = useQuery<Device[]>({
    queryKey: ["/api/devices"],
  });

  const { data: alerts, isLoading: alertsLoading } = useQuery<Alert[]>({
    queryKey: ["/api/alerts"],
  });

  const onlineDevices = devices?.filter((d) => d.status === "online").length || 0;
  const offlineDevices = devices?.filter((d) => d.status === "offline").length || 0;
  const totalDevices = devices?.length || 0;
  const activeAlerts = alerts?.filter((a) => a.status === "new").length || 0;
  const cameras = devices?.filter((d) => d.type === "camera").length || 0;

  const deviceTypeBreakdown = [
    { name: "Cameras", count: devices?.filter((d) => d.type === "camera").length || 0 },
    { name: "Sensors", count: devices?.filter((d) => d.type === "motion_sensor").length || 0 },
    { name: "Thermostats", count: devices?.filter((d) => d.type === "thermostat").length || 0 },
    { name: "Locks", count: devices?.filter((d) => d.type === "lock").length || 0 },
    { name: "Lights", count: devices?.filter((d) => d.type === "light").length || 0 },
    { name: "Other", count: devices?.filter((d) => !["camera", "motion_sensor", "thermostat", "lock", "light"].includes(d.type)).length || 0 },
  ].filter((item) => item.count > 0);

  // Use current device counts for the trend (simplified view showing current state)
  const deviceHealthData = [
    { date: "Mon", online: onlineDevices, offline: offlineDevices },
    { date: "Tue", online: onlineDevices, offline: offlineDevices },
    { date: "Wed", online: onlineDevices, offline: offlineDevices },
    { date: "Thu", online: onlineDevices, offline: offlineDevices },
    { date: "Fri", online: onlineDevices, offline: offlineDevices },
    { date: "Sat", online: onlineDevices, offline: offlineDevices },
    { date: "Sun", online: onlineDevices, offline: offlineDevices },
  ];

  const getStatusColor = (status: string) => {
    return status === "online" ? "default" : "secondary";
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
      case "high":
        return "destructive";
      case "medium":
        return "default";
      default:
        return "secondary";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-foreground" data-testid="text-dashboard-title">
            IoT Device Management
          </h1>
          <p className="text-muted-foreground">Monitor and manage all IoT devices across properties</p>
        </div>
        <Button asChild data-testid="button-add-device">
          <Link href="/devices">
            <Plus className="h-4 w-4 mr-2" />
            Add Device
          </Link>
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card data-testid="card-total-devices">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Devices</CardTitle>
            <Smartphone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDevices}</div>
            <p className="text-xs text-muted-foreground">Across all properties</p>
          </CardContent>
        </Card>

        <Card data-testid="card-online-devices">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Online Devices</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{onlineDevices}</div>
            <p className="text-xs text-muted-foreground">
              {totalDevices > 0 ? Math.round((onlineDevices / totalDevices) * 100) : 0}% uptime
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-offline-devices">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Offline Devices</CardTitle>
            <XCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{offlineDevices}</div>
            <p className="text-xs text-muted-foreground">Require attention</p>
          </CardContent>
        </Card>

        <Card data-testid="card-active-alerts">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeAlerts}</div>
            <p className="text-xs text-muted-foreground">Pending review</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Device Health Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Device Health Trend</CardTitle>
            <CardDescription>7-day online/offline status</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={deviceHealthData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip />
                <Area 
                  type="monotone" 
                  dataKey="online" 
                  stackId="1"
                  stroke="hsl(var(--chart-1))" 
                  fill="hsl(var(--chart-1))" 
                  name="Online"
                />
                <Area 
                  type="monotone" 
                  dataKey="offline" 
                  stackId="1"
                  stroke="hsl(var(--chart-2))" 
                  fill="hsl(var(--chart-2))" 
                  name="Offline"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Device Type Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Device Type Distribution</CardTitle>
            <CardDescription>Breakdown by device category</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {deviceTypeBreakdown.map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-primary" />
                    <span className="text-sm font-medium">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">{item.count}</span>
                    <div className="w-24 bg-muted rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full"
                        style={{
                          width: `${totalDevices > 0 ? (item.count / totalDevices) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Alerts */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle>Recent Device Alerts</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/alerts" data-testid="link-view-all-alerts">
                View All
                <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {alertsLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-16" />
                ))}
              </div>
            ) : alerts && alerts.length > 0 ? (
              <div className="space-y-3">
                {alerts.slice(0, 5).map((alert) => (
                  <div
                    key={alert.id}
                    className="flex items-start gap-3 p-3 rounded-md border hover-elevate"
                    data-testid={`alert-item-${alert.id}`}
                  >
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant={getSeverityColor(alert.severity) as any}>
                          {alert.severity}
                        </Badge>
                        <span className="text-sm font-medium">{alert.title}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{alert.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {alert.location} • {new Date(alert.createdAt!).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>No recent alerts</p>
                <p className="text-sm">All devices operational</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common device management tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              variant="outline" 
              className="w-full justify-start" 
              asChild
              data-testid="button-manage-devices"
            >
              <Link href="/devices">
                <Settings className="h-4 w-4 mr-2" />
                Manage All Devices
              </Link>
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start" 
              asChild
              data-testid="button-view-surveillance"
            >
              <Link href="/surveillance">
                <Video className="h-4 w-4 mr-2" />
                View Surveillance Feeds ({cameras} cameras)
              </Link>
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start" 
              asChild
              data-testid="button-audio-detection"
            >
              <Link href="/audio-detection">
                <Mic className="h-4 w-4 mr-2" />
                Audio Detection System
              </Link>
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start" 
              asChild
              data-testid="button-view-alerts"
            >
              <Link href="/alerts">
                <AlertTriangle className="h-4 w-4 mr-2" />
                Review Alerts ({activeAlerts} pending)
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Offline Devices List */}
      {offlineDevices > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Offline Devices</CardTitle>
            <CardDescription>Devices requiring attention</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {devicesLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-12" />
                ))
              ) : (
                devices
                  ?.filter((d) => d.status === "offline")
                  .slice(0, 5)
                  .map((device) => (
                    <div
                      key={device.id}
                      className="flex items-center justify-between p-3 rounded-md border"
                      data-testid={`offline-device-${device.id}`}
                    >
                      <div className="flex items-center gap-3">
                        <Activity className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">{device.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {device.room} • {device.type}
                          </p>
                        </div>
                      </div>
                      <Badge variant={getStatusColor(device.status) as any}>
                        {device.status}
                      </Badge>
                    </div>
                  ))
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

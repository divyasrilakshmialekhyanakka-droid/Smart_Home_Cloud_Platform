import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Lightbulb,
  Thermometer,
  Lock,
  Activity,
  Power,
  Zap,
  Eye,
  ChevronRight,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Link } from "wouter";
import type { Device, Alert } from "@shared/schema";

export default function HomeownerDashboard() {
  const { data: devices, isLoading: devicesLoading } = useQuery<Device[]>({
    queryKey: ["/api/devices"],
  });

  const { data: alerts, isLoading: alertsLoading } = useQuery<Alert[]>({
    queryKey: ["/api/alerts/recent"],
  });

  const onlineDevices = devices?.filter((d) => d.status === "online").length || 0;
  const totalDevices = devices?.length || 0;
  const activeAlerts = alerts?.filter((a) => a.status === "new").length || 0;

  const deviceHealthData = [
    { month: "Jan", online: 28, offline: 4 },
    { month: "Feb", online: 30, offline: 2 },
    { month: "Mar", online: 29, offline: 3 },
    { month: "Apr", online: 31, offline: 1 },
    { month: "May", online: 30, offline: 2 },
    { month: "Jun", online: 32, offline: 0 },
  ];

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case "light":
        return Lightbulb;
      case "thermostat":
        return Thermometer;
      case "lock":
        return Lock;
      case "motion_sensor":
        return Activity;
      default:
        return Power;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "destructive";
      case "high":
        return "destructive";
      case "medium":
        return "default";
      case "low":
        return "secondary";
      default:
        return "secondary";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-foreground" data-testid="text-dashboard-title">
          Homeowner Dashboard
        </h1>
        <p className="text-muted-foreground">Monitor and control your smart home devices</p>
      </div>

      {/* Device Control Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {devicesLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-32" />
              </CardContent>
            </Card>
          ))
        ) : (
          devices?.slice(0, 6).map((device) => {
            const Icon = getDeviceIcon(device.type);
            return (
              <Card key={device.id} className="hover-elevate" data-testid={`card-device-${device.id}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className="h-5 w-5 text-muted-foreground" />
                      <CardTitle className="text-base font-medium">{device.name}</CardTitle>
                    </div>
                    <Badge
                      variant={device.status === "online" ? "default" : "secondary"}
                      data-testid={`badge-device-status-${device.id}`}
                    >
                      {device.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {device.type === "light" && (
                    <p className="text-sm text-muted-foreground">
                      Brightness: {device.config?.brightness || 75}%
                    </p>
                  )}
                  {device.type === "thermostat" && (
                    <p className="text-sm text-muted-foreground">
                      Heating to {device.config?.temperature || 24}°C
                    </p>
                  )}
                  {device.type === "lock" && (
                    <p className="text-sm text-muted-foreground">
                      {device.config?.locked ? "Secured" : "Unlocked"}
                    </p>
                  )}
                  {device.type === "motion_sensor" && (
                    <p className="text-sm text-muted-foreground">
                      Last detected: {device.lastSeen ? "5 mins ago" : "Never"}
                    </p>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-2"
                    data-testid={`button-device-action-${device.id}`}
                  >
                    {device.type === "light" && "Turn Off"}
                    {device.type === "thermostat" && "Adjust"}
                    {device.type === "lock" && "Unlock"}
                    {device.type === "motion_sensor" && "View Activity"}
                  </Button>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Alerts */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle>Recent Alerts</CardTitle>
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
                {alerts.slice(0, 3).map((alert) => (
                  <div
                    key={alert.id}
                    className="flex items-start gap-3 p-3 rounded-md border"
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
                <p className="text-sm">All systems operational</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Device Health Overview */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Device Health Overview</CardTitle>
            <p className="text-sm text-muted-foreground">Monthly device online/offline status</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={deviceHealthData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip />
                <Bar dataKey="online" fill="hsl(var(--chart-1))" name="Online Devices" />
                <Bar dataKey="offline" fill="hsl(var(--chart-2))" name="Offline Devices" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Live Surveillance Feeds Preview */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle>Live Surveillance Feeds</CardTitle>
            <p className="text-sm text-muted-foreground">Real-time camera feeds</p>
          </div>
          <Button variant="outline" asChild data-testid="button-view-surveillance">
            <Link href="/surveillance">
              <Eye className="h-4 w-4 mr-2" />
              View All Cameras
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {["Front Yard Camera", "Living Room Camera"].map((camera, i) => (
              <div
                key={i}
                className="relative aspect-video bg-muted rounded-md overflow-hidden"
                data-testid={`camera-preview-${i}`}
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">{camera}</p>
                  </div>
                </div>
                <Badge className="absolute top-2 left-2" variant="destructive">
                  LIVE
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Automation Rules */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Automation Rules</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { name: "Motion in Yard: Turn on Light", status: "active" },
              { name: "Night: Lock All Doors", status: "active" },
              { name: "Away Mode: Adjust Thermostat", status: "inactive" },
            ].map((rule, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 rounded-md border"
                data-testid={`automation-rule-${i}`}
              >
                <span className="text-sm font-medium">{rule.name}</span>
                <Badge variant={rule.status === "active" ? "default" : "secondary"}>
                  {rule.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

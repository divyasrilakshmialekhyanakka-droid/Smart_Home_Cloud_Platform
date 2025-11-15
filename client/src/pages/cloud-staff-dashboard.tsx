import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Home,
  AlertTriangle,
  Eye,
  Server,
  Cpu,
  HardDrive,
  Network,
  Clock,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import type { Alert, User } from "@shared/schema";

export default function CloudStaffDashboard() {
  const { data: alerts, isLoading: alertsLoading } = useQuery<Alert[]>({
    queryKey: ["/api/alerts/recent"],
  });

  const { data: activeUsers, isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/users/active"],
  });

  const devicePerformanceData = [
    { time: "00:00", active: 280, uptime: 95 },
    { time: "04:00", active: 320, uptime: 96 },
    { time: "08:00", active: 380, uptime: 97 },
    { time: "12:00", active: 450, uptime: 98 },
    { time: "16:00", active: 420, uptime: 97 },
    { time: "20:00", active: 350, uptime: 96 },
    { time: "23:59", active: 290, uptime: 98 },
  ];

  const criticalAlerts = alerts?.filter((a) => a.severity === "critical").length || 0;
  const totalActive = alerts?.filter((a) => a.status === "new").length || 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-foreground" data-testid="text-cloud-dashboard-title">
          Cloud Employee Dashboard
        </h1>
        <p className="text-muted-foreground">Monitoring 120+ locations globally</p>
      </div>

      {/* Live Facility Map */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle>Live Facility Map</CardTitle>
          <p className="text-sm text-muted-foreground">
            Monitoring 120+ Locations Globally
          </p>
        </CardHeader>
        <CardContent>
          <div className="relative aspect-[2/1] bg-gradient-to-br from-accent/20 to-background rounded-lg overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center">
              {/* Mock facility icons */}
              <div className="grid grid-cols-5 gap-8">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className="relative group">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-card border-2 border-primary hover-elevate cursor-pointer">
                      <Home className="h-6 w-6 text-primary" />
                    </div>
                    {i === 2 && (
                      <div className="absolute -top-1 -right-1">
                        <span className="flex h-4 w-4">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-4 w-4 bg-destructive"></span>
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className="absolute top-4 left-4 space-y-2">
              <Badge variant="destructive" className="gap-1">
                <AlertTriangle className="h-3 w-3" />
                {criticalAlerts} Critical Alerts
              </Badge>
              <Badge variant="default" className="gap-1">
                <Home className="h-3 w-3" />
                12 Active Facilities
              </Badge>
              <Button variant="outline" size="sm" className="gap-1" data-testid="button-view-surveillance">
                <Eye className="h-3 w-3" />
                View Surveillance
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* System Health Metrics */}
        <Card data-testid="card-uptime">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Uptime</CardTitle>
              <Server className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className="text-3xl font-bold">99.99%</div>
              <Badge variant="default">Operational</Badge>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-cpu">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">CPU Usage</CardTitle>
              <Cpu className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className="text-3xl font-bold">35%</div>
              <Badge variant="secondary">Normal</Badge>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-memory">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
              <HardDrive className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className="text-3xl font-bold">62%</div>
              <Badge variant="default">High</Badge>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-network">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Network Latency</CardTitle>
              <Network className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className="text-3xl font-bold">23ms</div>
              <Badge variant="secondary">Stable</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Alerts */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Recent Alerts</CardTitle>
            <p className="text-sm text-muted-foreground">
              AI detected anomalies requiring attention
            </p>
          </CardHeader>
          <CardContent>
            {alertsLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-20" />
                ))}
              </div>
            ) : alerts && alerts.length > 0 ? (
              <div className="space-y-2">
                <div className="grid grid-cols-6 gap-2 text-xs font-medium text-muted-foreground pb-2 border-b">
                  <div className="col-span-1">Alert ID</div>
                  <div className="col-span-1">Type</div>
                  <div className="col-span-1">Severity</div>
                  <div className="col-span-2">Location</div>
                  <div className="col-span-1 text-right">Actions</div>
                </div>
                {alerts.slice(0, 3).map((alert) => (
                  <div
                    key={alert.id}
                    className="grid grid-cols-6 gap-2 text-sm items-center py-2 border-b last:border-0"
                    data-testid={`alert-row-${alert.id}`}
                  >
                    <div className="col-span-1 font-mono text-xs">
                      {alert.id.slice(0, 8)}...
                    </div>
                    <div className="col-span-1 capitalize">{alert.type.replace(/_/g, " ")}</div>
                    <div className="col-span-1">
                      <Badge
                        variant={
                          alert.severity === "critical" || alert.severity === "high"
                            ? "destructive"
                            : "secondary"
                        }
                      >
                        {alert.severity}
                      </Badge>
                    </div>
                    <div className="col-span-2 text-muted-foreground">{alert.location}</div>
                    <div className="col-span-1 text-right">
                      <Button variant="outline" size="sm" data-testid={`button-view-details-${alert.id}`}>
                        View Details
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No recent alerts
              </div>
            )}
          </CardContent>
        </Card>

        {/* Active Users */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Active Users</CardTitle>
            <p className="text-sm text-muted-foreground">
              Currently logged in and active
            </p>
          </CardHeader>
          <CardContent>
            {usersLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-14" />
                ))}
              </div>
            ) : (
              <>
                <div className="mb-4">
                  <div className="text-2xl font-bold" data-testid="text-total-active">
                    {activeUsers?.length || 0}
                  </div>
                  <p className="text-sm text-muted-foreground">Total Active Now</p>
                </div>
                <div className="space-y-3">
                  <p className="text-sm font-medium">Recent Activity:</p>
                  {(activeUsers || []).slice(0, 3).map((user, i) => (
                    <div
                      key={user.id}
                      className="flex items-center gap-3"
                      data-testid={`active-user-${i}`}
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user.profileImageUrl || undefined} />
                        <AvatarFallback>
                          {user.firstName?.[0]}{user.lastName?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {user.firstName} {user.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {user.role?.replace(/_/g, " ")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Device Performance */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Device Performance</CardTitle>
          <p className="text-sm text-muted-foreground">Metrics over the last 24 hours</p>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={devicePerformanceData}>
              <defs>
                <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorUptime" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="time" className="text-xs" />
              <YAxis className="text-xs" />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="active"
                stroke="hsl(var(--chart-1))"
                fillOpacity={1}
                fill="url(#colorActive)"
                name="Active Devices"
              />
              <Area
                type="monotone"
                dataKey="uptime"
                stroke="hsl(var(--chart-2))"
                fillOpacity={1}
                fill="url(#colorUptime)"
                name="Uptime %"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Upcoming Maintenance */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Upcoming Maintenance</CardTitle>
          <p className="text-sm text-muted-foreground">Scheduled system tasks</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              {
                task: "Database Optimization",
                date: "2024-08-01",
                status: "Scheduled",
              },
              {
                task: "Cloud Server Patching",
                date: "2024-08-03",
                status: "Scheduled",
              },
              {
                task: "Network Hardware Check",
                date: "2024-08-10",
                status: "Planned",
              },
            ].map((item, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 rounded-md border"
                data-testid={`maintenance-item-${i}`}
              >
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{item.task}</p>
                    <p className="text-xs text-muted-foreground">{item.date}</p>
                  </div>
                </div>
                <Badge variant="secondary">{item.status}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

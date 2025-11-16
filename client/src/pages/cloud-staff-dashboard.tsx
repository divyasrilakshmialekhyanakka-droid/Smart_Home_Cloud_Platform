import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Home,
  AlertTriangle,
  Eye,
  Server,
  Cpu,
  HardDrive,
  Network,
  Clock,
  Camera,
  MapPin,
  Video,
  Plus,
  Pencil,
  Trash2,
  Calendar,
  Mic,
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
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Alert, User, House, Device, MaintenanceRecord, AudioDetection } from "@shared/schema";

const maintenanceFormSchema = z.object({
  task: z.string().min(1, "Task is required"),
  scheduledDate: z.string().min(1, "Date is required"),
  scheduledTime: z.string().min(1, "Time is required"),
  category: z.enum(["database", "server", "network", "security", "hardware", "software", "other"]),
  priority: z.enum(["low", "medium", "high", "critical"]),
  status: z.enum(["scheduled", "in_progress", "completed", "cancelled"]).default("scheduled"),
  description: z.string().optional(),
  assignedTo: z.string().optional(),
});

type MaintenanceFormValues = z.infer<typeof maintenanceFormSchema>;

export default function CloudStaffDashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedHouse, setSelectedHouse] = useState<House | null>(null);
  const [isHouseDialogOpen, setIsHouseDialogOpen] = useState(false);
  const [isMaintenanceDialogOpen, setIsMaintenanceDialogOpen] = useState(false);
  
  const { data: alerts, isLoading: alertsLoading } = useQuery<Alert[]>({
    queryKey: ["/api/alerts/recent"],
  });

  const { data: activeUsers, isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/users/active"],
  });

  const { data: houses, isLoading: housesLoading } = useQuery<House[]>({
    queryKey: ["/api/houses"],
  });

  const { data: devices } = useQuery<Device[]>({
    queryKey: ["/api/devices"],
  });

  const { data: maintenanceRecords, isLoading: maintenanceLoading } = useQuery<MaintenanceRecord[]>({
    queryKey: ["/api/maintenance"],
  });

  const { data: audioDetections, isLoading: audioDetectionsLoading } = useQuery<AudioDetection[]>({
    queryKey: ["/api/audio/detections"],
    refetchInterval: 10000,
  });

  const maintenanceForm = useForm<MaintenanceFormValues>({
    resolver: zodResolver(maintenanceFormSchema),
    defaultValues: {
      task: "",
      scheduledDate: new Date().toISOString().split('T')[0],
      scheduledTime: "08:00",
      category: "other",
      priority: "medium",
      status: "scheduled",
      description: "",
      assignedTo: "",
    },
  });

  const createMaintenance = useMutation({
    mutationFn: async (data: MaintenanceFormValues) => {
      return await apiRequest("POST", "/api/maintenance", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/maintenance"] });
      setIsMaintenanceDialogOpen(false);
      maintenanceForm.reset();
      toast({
        title: "Maintenance Scheduled",
        description: "New maintenance task has been added",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create maintenance record",
        variant: "destructive",
      });
    },
  });

  const deleteMaintenance = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/maintenance/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/maintenance"] });
      toast({
        title: "Maintenance Deleted",
        description: "Maintenance task has been removed",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete maintenance record",
        variant: "destructive",
      });
    },
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

  // Helper to get cameras for a specific house
  const getCamerasForHouse = (houseId: string) => {
    return devices?.filter((d) => d.houseId === houseId && d.type === "camera") || [];
  };

  // Helper to check if house has critical alerts
  const hasHouseCriticalAlerts = (houseId: string) => {
    return alerts?.some((a) => a.houseId === houseId && a.severity === "critical") || false;
  };

  // Generate scattered map positions for houses (handles any number of houses)
  // Uses grid-based layout with random jitter for natural scattered appearance
  const getHouseMapPosition = (index: number, total: number) => {
    // Calculate grid dimensions that can accommodate all houses
    const cols = Math.ceil(Math.sqrt(total * 1.5)); // Wider than tall for aspect ratio
    const rows = Math.ceil(total / cols);
    
    // Calculate this house's grid cell
    const col = index % cols;
    const row = Math.floor(index / cols);
    
    // Base grid spacing (leave margins)
    const marginX = 8; // 8% margin on each side
    const marginY = 12; // 12% margin top/bottom  
    const gridWidth = 100 - (2 * marginX);
    const gridHeight = 100 - (2 * marginY);
    const cellWidth = gridWidth / cols;
    const cellHeight = gridHeight / rows;
    
    // Center position in cell
    const baseLeft = marginX + (col * cellWidth) + (cellWidth / 2);
    const baseTop = marginY + (row * cellHeight) + (cellHeight / 2);
    
    // Add deterministic jitter based on house ID for natural scatter
    // Use index to create pseudo-random but consistent offsets
    const jitterX = ((index * 37) % 20) - 10; // -10% to +10%
    const jitterY = ((index * 47) % 20) - 10; // -10% to +10%
    const jitterAmount = Math.min(cellWidth, cellHeight) * 0.3; // 30% of cell size
    
    const finalLeft = Math.max(marginX, Math.min(100 - marginX, 
      baseLeft + (jitterX / 100) * jitterAmount));
    const finalTop = Math.max(marginY, Math.min(100 - marginY,
      baseTop + (jitterY / 100) * jitterAmount));
    
    return {
      left: `${finalLeft}%`,
      top: `${finalTop}%`,
    };
  };

  const handleHouseClick = (house: House) => {
    setSelectedHouse(house);
    setIsHouseDialogOpen(true);
  };

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
            Real-time monitoring of {houses?.length || 0} facilities
          </p>
        </CardHeader>
        <CardContent>
          <div className="relative aspect-[2/1] bg-gradient-to-br from-accent/20 to-background rounded-lg overflow-hidden border">
            {housesLoading ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <Skeleton className="h-full w-full" />
              </div>
            ) : houses && houses.length > 0 ? (
              <div className="absolute inset-0">
                {/* Scattered house icons mimicking facility layout */}
                {houses.map((house, i) => {
                  const position = getHouseMapPosition(i, houses.length);
                  const hasCriticalAlert = hasHouseCriticalAlerts(house.id);
                  const cameras = getCamerasForHouse(house.id);
                  
                  return (
                    <div
                      key={house.id}
                      className="absolute group"
                      style={{ left: position.left, top: position.top }}
                      data-testid={`house-icon-${i}`}
                    >
                      <div
                        onClick={() => handleHouseClick(house)}
                        className="flex h-14 w-14 items-center justify-center rounded-full bg-card border-2 border-primary hover-elevate cursor-pointer transition-all"
                        title={house.address}
                      >
                        <Home className="h-7 w-7 text-primary" />
                      </div>
                      
                      {/* Critical alert indicator */}
                      {hasCriticalAlert && (
                        <div className="absolute -top-1 -right-1">
                          <span className="flex h-5 w-5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-5 w-5 bg-destructive"></span>
                          </span>
                        </div>
                      )}
                      
                      {/* Tooltip on hover */}
                      <div className="absolute top-16 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        <div className="bg-popover text-popover-foreground px-3 py-2 rounded-md shadow-lg text-xs whitespace-nowrap border">
                          <p className="font-medium">{house.address}</p>
                          <p className="text-muted-foreground">{cameras.length} camera{cameras.length !== 1 ? 's' : ''}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                No houses available
              </div>
            )}
            
            {/* Map legend */}
            <div className="absolute top-4 left-4 space-y-2">
              <Badge variant="destructive" className="gap-1">
                <AlertTriangle className="h-3 w-3" />
                {criticalAlerts} Critical Alerts
              </Badge>
              <Badge variant="default" className="gap-1">
                <Home className="h-3 w-3" />
                {houses?.length || 0} Facilities
              </Badge>
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-1" 
                data-testid="button-view-surveillance"
                onClick={() => setLocation("/surveillance")}
              >
                <Eye className="h-3 w-3" />
                View All Cameras
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* House Detail Dialog */}
      <Dialog open={isHouseDialogOpen} onOpenChange={setIsHouseDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              {selectedHouse?.address}
            </DialogTitle>
            <DialogDescription>
              View cameras and devices for this facility
            </DialogDescription>
          </DialogHeader>
          
          {selectedHouse && (
            <div className="space-y-4">
              {/* House Info */}
              <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="text-xs text-muted-foreground">Square Feet</p>
                  <p className="font-medium">{selectedHouse.squareFeet?.toLocaleString() || 'N/A'} sq ft</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Bedrooms</p>
                  <p className="font-medium">{selectedHouse.bedrooms || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Bathrooms</p>
                  <p className="font-medium">{selectedHouse.bathrooms || 'N/A'}</p>
                </div>
              </div>

              {/* Cameras List */}
              <div>
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Camera className="h-4 w-4" />
                  Cameras ({getCamerasForHouse(selectedHouse.id).length})
                </h4>
                <div className="space-y-2">
                  {getCamerasForHouse(selectedHouse.id).length > 0 ? (
                    getCamerasForHouse(selectedHouse.id).map((camera) => (
                      <div
                        key={camera.id}
                        className="flex items-center justify-between p-3 bg-muted/30 rounded-md"
                        data-testid={`camera-item-${camera.id}`}
                      >
                        <div className="flex items-center gap-3">
                          <Video className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium text-sm">{camera.name}</p>
                            <p className="text-xs text-muted-foreground">{camera.room}</p>
                          </div>
                        </div>
                        <Badge variant={camera.status === "online" ? "default" : "secondary"}>
                          {camera.status}
                        </Badge>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No cameras installed
                    </p>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2 pt-4 border-t">
                <Button
                  className="flex-1"
                  onClick={() => {
                    setIsHouseDialogOpen(false);
                    setLocation("/surveillance");
                  }}
                  data-testid="button-view-house-surveillance"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View Live Feeds
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setIsHouseDialogOpen(false);
                    setLocation("/devices");
                  }}
                  data-testid="button-manage-house-devices"
                >
                  Manage Devices
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

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
                      <Button 
                        variant="outline" 
                        size="sm" 
                        data-testid={`button-view-details-${alert.id}`}
                        onClick={() => setLocation("/alerts")}
                      >
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

      {/* Audio Detections */}
      <Card>
        <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Mic className="h-5 w-5" />
              Audio AI Detections
            </CardTitle>
            <p className="text-sm text-muted-foreground">YAMNet & HuBERT model results</p>
          </div>
          <Button variant="outline" size="sm" asChild>
            <a href="/audio-detection">View All</a>
          </Button>
        </CardHeader>
        <CardContent>
          {audioDetectionsLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          ) : audioDetections && audioDetections.length > 0 ? (
            <div className="space-y-2">
              {audioDetections.slice(0, 5).map((detection) => {
                const device = devices?.find(d => d.id === detection.deviceId);
                return (
                  <div 
                    key={detection.id} 
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                    data-testid={`audio-detection-${detection.id}`}
                  >
                    <div className="flex-1">
                      <p className="font-medium text-sm">{detection.detectedClass}</p>
                      <p className="text-xs text-muted-foreground">
                        {device?.name} • {detection.fileName}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="text-xs">
                        {detection.modelUsed.toUpperCase()}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {(detection.confidence * 100).toFixed(1)}%
                      </span>
                      {detection.alertGenerated && (
                        <Badge variant="destructive" className="text-xs">
                          Alert
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Mic className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No audio detections yet</p>
              <p className="text-sm mt-1">Upload audio files to test AI models</p>
            </div>
          )}
        </CardContent>
      </Card>

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
        <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Upcoming Maintenance</CardTitle>
            <p className="text-sm text-muted-foreground">Scheduled system tasks</p>
          </div>
          <Dialog open={isMaintenanceDialogOpen} onOpenChange={setIsMaintenanceDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" data-testid="button-schedule-maintenance">
                <Plus className="h-4 w-4 mr-2" />
                Schedule
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Schedule Maintenance</DialogTitle>
                <DialogDescription>Add a new maintenance task</DialogDescription>
              </DialogHeader>
              <Form {...maintenanceForm}>
                <form onSubmit={maintenanceForm.handleSubmit((data) => createMaintenance.mutate(data))} className="space-y-4">
                  <FormField
                    control={maintenanceForm.control}
                    name="task"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Task</FormLabel>
                        <FormControl>
                          <Input placeholder="Database Optimization" {...field} data-testid="input-task" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={maintenanceForm.control}
                    name="scheduledDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Scheduled Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} data-testid="input-date" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={maintenanceForm.control}
                    name="scheduledTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Scheduled Time</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} data-testid="input-time" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={maintenanceForm.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-category">
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="database">Database</SelectItem>
                            <SelectItem value="server">Server</SelectItem>
                            <SelectItem value="network">Network</SelectItem>
                            <SelectItem value="security">Security</SelectItem>
                            <SelectItem value="hardware">Hardware</SelectItem>
                            <SelectItem value="software">Software</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={maintenanceForm.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Priority</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-priority">
                              <SelectValue placeholder="Select priority" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="critical">Critical</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex gap-2 pt-4">
                    <Button type="submit" className="flex-1" disabled={createMaintenance.isPending} data-testid="button-submit-maintenance">
                      {createMaintenance.isPending ? "Scheduling..." : "Schedule Maintenance"}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setIsMaintenanceDialogOpen(false)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {maintenanceLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          ) : maintenanceRecords && maintenanceRecords.length > 0 ? (
            <div className="space-y-3">
              {maintenanceRecords.map((item, i) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-md border"
                  data-testid={`maintenance-item-${i}`}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{item.task}</p>
                      <p className="text-xs text-muted-foreground">{item.scheduledDate}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="capitalize">{item.status}</Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => deleteMaintenance.mutate(item.id)}
                      data-testid={`button-delete-maintenance-${i}`}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No maintenance scheduled</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => setIsMaintenanceDialogOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Schedule First Task
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

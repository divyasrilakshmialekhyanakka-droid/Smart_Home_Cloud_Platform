import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Smartphone,
  Plus,
  Search,
  MoreVertical,
  Power,
  RefreshCw,
  Trash2,
  Settings as SettingsIcon,
} from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Device, InsertDevice } from "@shared/schema";

export default function DeviceManagement() {
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [newDevice, setNewDevice] = useState<Partial<InsertDevice>>({
    name: "",
    type: "camera",
    room: "",
    status: "offline",
  });

  const { data: devices, isLoading } = useQuery<Device[]>({
    queryKey: ["/api/devices"],
  });

  const addDeviceMutation = useMutation({
    mutationFn: async (device: Partial<InsertDevice>) => {
      await apiRequest("POST", "/api/devices", device);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/devices"] });
      setIsAddDialogOpen(false);
      setNewDevice({ name: "", type: "camera", room: "", status: "offline" });
      toast({
        title: "Device Added",
        description: "The device has been successfully registered.",
      });
    },
  });

  const deleteDeviceMutation = useMutation({
    mutationFn: async (deviceId: string) => {
      await apiRequest("DELETE", `/api/devices/${deviceId}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/devices"] });
      toast({
        title: "Device Deleted",
        description: "The device has been removed from the system.",
      });
    },
  });

  const filteredDevices = devices?.filter((device) =>
    device.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    device.room.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online":
        return "default";
      case "offline":
        return "secondary";
      case "warning":
        return "destructive";
      default:
        return "secondary";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-foreground" data-testid="text-device-management-title">
            Device Management
          </h1>
          <p className="text-muted-foreground">
            Add, update, and control IoT devices across all locations
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-device">
              <Plus className="h-4 w-4 mr-2" />
              Add Device
            </Button>
          </DialogTrigger>
          <DialogContent data-testid="dialog-add-device">
            <DialogHeader>
              <DialogTitle>Register New Device</DialogTitle>
              <DialogDescription>
                Add a new IoT device to your smart home network
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="device-name">Device Name</Label>
                <Input
                  id="device-name"
                  placeholder="e.g., Front Door Camera"
                  value={newDevice.name}
                  onChange={(e) => setNewDevice({ ...newDevice, name: e.target.value })}
                  data-testid="input-device-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="device-type">Device Type</Label>
                <Select
                  value={newDevice.type}
                  onValueChange={(value) => setNewDevice({ ...newDevice, type: value as any })}
                >
                  <SelectTrigger id="device-type" data-testid="select-device-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="camera">Camera</SelectItem>
                    <SelectItem value="microphone">Microphone</SelectItem>
                    <SelectItem value="motion_sensor">Motion Sensor</SelectItem>
                    <SelectItem value="thermostat">Thermostat</SelectItem>
                    <SelectItem value="lock">Lock</SelectItem>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="smoke_detector">Smoke Detector</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="device-room">Room/Location</Label>
                <Input
                  id="device-room"
                  placeholder="e.g., Living Room"
                  value={newDevice.room}
                  onChange={(e) => setNewDevice({ ...newDevice, room: e.target.value })}
                  data-testid="input-device-room"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="serial-number">Serial Number (Optional)</Label>
                <Input
                  id="serial-number"
                  placeholder="e.g., SN123456789"
                  value={newDevice.serialNumber || ""}
                  onChange={(e) => setNewDevice({ ...newDevice, serialNumber: e.target.value })}
                  data-testid="input-serial-number"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsAddDialogOpen(false)}
                data-testid="button-cancel-add"
              >
                Cancel
              </Button>
              <Button
                onClick={() => addDeviceMutation.mutate(newDevice)}
                disabled={!newDevice.name || !newDevice.room || addDeviceMutation.isPending}
                data-testid="button-save-device"
              >
                {addDeviceMutation.isPending ? "Adding..." : "Add Device"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search devices by name or location..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                data-testid="input-search-devices"
              />
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/devices"] })}
              data-testid="button-refresh-devices"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Devices Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Devices</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          ) : filteredDevices && filteredDevices.length > 0 ? (
            <div className="space-y-2">
              {/* Table Header */}
              <div className="grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground pb-2 border-b">
                <div className="col-span-3">Name</div>
                <div className="col-span-2">Type</div>
                <div className="col-span-2">Location</div>
                <div className="col-span-1">Status</div>
                <div className="col-span-2">Last Seen</div>
                <div className="col-span-1">Battery</div>
                <div className="col-span-1 text-right">Actions</div>
              </div>

              {/* Table Rows */}
              {filteredDevices.map((device) => (
                <div
                  key={device.id}
                  className="grid grid-cols-12 gap-2 text-sm items-center py-3 border-b last:border-0 hover-elevate rounded-md px-2"
                  data-testid={`device-row-${device.id}`}
                >
                  <div className="col-span-3 font-medium">{device.name}</div>
                  <div className="col-span-2 capitalize">
                    {device.type.replace(/_/g, " ")}
                  </div>
                  <div className="col-span-2">{device.room}</div>
                  <div className="col-span-1">
                    <Badge variant={getStatusColor(device.status) as any}>
                      {device.status}
                    </Badge>
                  </div>
                  <div className="col-span-2 text-xs text-muted-foreground">
                    {device.lastSeen
                      ? new Date(device.lastSeen).toLocaleString()
                      : "Never"}
                  </div>
                  <div className="col-span-1">
                    {device.batteryLevel !== null && device.batteryLevel !== undefined ? (
                      <span className="text-xs">{device.batteryLevel}%</span>
                    ) : (
                      <span className="text-xs text-muted-foreground">N/A</span>
                    )}
                  </div>
                  <div className="col-span-1 flex gap-1 justify-end">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      data-testid={`button-configure-${device.id}`}
                    >
                      <SettingsIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => deleteDeviceMutation.mutate(device.id)}
                      data-testid={`button-delete-${device.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Smartphone className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium">No devices found</p>
              <p className="text-sm text-muted-foreground mb-4">
                Start by adding your first IoT device
              </p>
              <Button onClick={() => setIsAddDialogOpen(true)} data-testid="button-add-first-device">
                <Plus className="h-4 w-4 mr-2" />
                Add Device
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

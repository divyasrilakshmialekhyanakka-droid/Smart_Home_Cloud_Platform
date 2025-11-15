import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  Download,
  Filter,
  RefreshCw,
  Search,
  X,
} from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Alert } from "@shared/schema";

export default function AlertsPage() {
  const { toast } = useToast();
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: alerts, isLoading } = useQuery<Alert[]>({
    queryKey: ["/api/alerts"],
  });

  const acknowledgeMutation = useMutation({
    mutationFn: async (alertId: string) => {
      await apiRequest("POST", `/api/alerts/${alertId}/acknowledge`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/alerts"] });
      toast({
        title: "Alert Acknowledged",
        description: "The alert has been acknowledged successfully.",
      });
    },
  });

  const resolveMutation = useMutation({
    mutationFn: async (alertId: string) => {
      await apiRequest("POST", `/api/alerts/${alertId}/resolve`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/alerts"] });
      toast({
        title: "Alert Resolved",
        description: "The alert has been marked as resolved.",
      });
    },
  });

  const dismissMutation = useMutation({
    mutationFn: async (alertId: string) => {
      await apiRequest("POST", `/api/alerts/${alertId}/dismiss`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/alerts"] });
      toast({
        title: "Alert Dismissed",
        description: "The alert has been dismissed.",
      });
    },
  });

  const filteredAlerts = alerts?.filter((alert) => {
    if (severityFilter !== "all" && alert.severity !== severityFilter) return false;
    if (typeFilter !== "all" && alert.type !== typeFilter) return false;
    if (statusFilter !== "all" && alert.status !== statusFilter) return false;
    if (
      searchQuery &&
      !alert.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !alert.description.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const totalActive = alerts?.filter((a) => a.status === "new").length || 0;
  const highSeverity = alerts?.filter((a) => a.severity === "high" || a.severity === "critical").length || 0;
  const resolvedLast24h = alerts?.filter((a) => a.status === "resolved").length || 0;

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "new":
        return "destructive";
      case "acknowledged":
        return "default";
      case "resolved":
        return "secondary";
      case "dismissed":
        return "secondary";
      default:
        return "secondary";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-foreground" data-testid="text-alerts-title">
          Alert Notifications
        </h1>
        <p className="text-muted-foreground">Monitor and manage AI-powered alerts</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card data-testid="card-total-active">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Total Active Alerts</CardTitle>
              <Bell className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalActive}</div>
          </CardContent>
        </Card>

        <Card data-testid="card-high-severity">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">High Severity</CardTitle>
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{highSeverity}</div>
          </CardContent>
        </Card>

        <Card data-testid="card-recently-resolved">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Recently Resolved</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{resolvedLast24h}</div>
            <p className="text-xs text-muted-foreground mt-1">Past 24 hours</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" data-testid="button-export-alerts">
                <Download className="h-4 w-4 mr-2" />
                Export Alerts
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/alerts"] })}
                data-testid="button-mark-all-read"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Mark All Read
              </Button>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Select value={severityFilter} onValueChange={setSeverityFilter}>
                <SelectTrigger className="w-[140px]" data-testid="select-severity-filter">
                  <SelectValue placeholder="Severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Severity: All</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[140px]" data-testid="select-type-filter">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Type: All</SelectItem>
                  <SelectItem value="motion_detected">Motion</SelectItem>
                  <SelectItem value="sound_detected">Sound</SelectItem>
                  <SelectItem value="device_offline">Device Offline</SelectItem>
                  <SelectItem value="temperature_anomaly">Temperature</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]" data-testid="select-status-filter">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Status: All</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="acknowledged">Acknowledged</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/alerts"] })}
                data-testid="button-refresh"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Alerts Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-24" />
              ))}
            </div>
          ) : filteredAlerts && filteredAlerts.length > 0 ? (
            <div className="space-y-2">
              {/* Table Header */}
              <div className="grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground pb-2 border-b">
                <div className="col-span-2">Timestamp</div>
                <div className="col-span-1">Severity</div>
                <div className="col-span-2">Type</div>
                <div className="col-span-1">Device ID</div>
                <div className="col-span-2">Location</div>
                <div className="col-span-2">AI Anomaly Details</div>
                <div className="col-span-1">Status</div>
                <div className="col-span-1 text-right">Actions</div>
              </div>

              {/* Table Rows */}
              {filteredAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="grid grid-cols-12 gap-2 text-sm items-center py-3 border-b last:border-0 hover-elevate rounded-md px-2"
                  data-testid={`alert-row-${alert.id}`}
                >
                  <div className="col-span-2 text-xs">
                    {new Date(alert.createdAt!).toLocaleString()}
                  </div>
                  <div className="col-span-1">
                    <Badge variant={getSeverityColor(alert.severity) as any}>
                      {alert.severity}
                    </Badge>
                  </div>
                  <div className="col-span-2 capitalize">
                    {alert.type.replace(/_/g, " ")}
                  </div>
                  <div className="col-span-1 font-mono text-xs">
                    {alert.deviceId ? alert.deviceId.slice(0, 8) : "-"}
                  </div>
                  <div className="col-span-2">{alert.location}</div>
                  <div className="col-span-2 text-xs text-muted-foreground">
                    {alert.aiDetails
                      ? JSON.stringify(alert.aiDetails).slice(0, 30) + "..."
                      : alert.description.slice(0, 40)}
                  </div>
                  <div className="col-span-1">
                    <Badge variant={getStatusColor(alert.status) as any} className="capitalize">
                      {alert.status}
                    </Badge>
                  </div>
                  <div className="col-span-1 flex gap-1 justify-end">
                    {alert.status === "new" && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => acknowledgeMutation.mutate(alert.id)}
                          data-testid={`button-acknowledge-${alert.id}`}
                        >
                          Acknowledge
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => dismissMutation.mutate(alert.id)}
                          data-testid={`button-dismiss-${alert.id}`}
                        >
                          Dismiss
                        </Button>
                      </>
                    )}
                    {alert.status === "acknowledged" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => resolveMutation.mutate(alert.id)}
                        data-testid={`button-resolve-${alert.id}`}
                      >
                        Resolve
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium">No alerts found</p>
              <p className="text-sm text-muted-foreground">
                All systems are operating normally
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

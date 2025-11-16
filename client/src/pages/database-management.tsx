import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Database, Download, Search } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import type { UserConfigLog } from "@shared/schema";

interface DatabaseStats {
  totalRecords: number;
  databaseSize: string;
  tables: {
    users: number;
    houses: number;
    devices: number;
    alerts: number;
    maintenance: number;
    configLogs: number;
    audioDetections: number;
  };
}

export default function DatabaseManagement() {
  const [filterType, setFilterType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLog, setSelectedLog] = useState<UserConfigLog | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const { toast } = useToast();

  const { data: configLogs, isLoading } = useQuery<UserConfigLog[]>({
    queryKey: ["/api/database/config-logs"],
  });

  const { data: stats } = useQuery<DatabaseStats>({
    queryKey: ["/api/database/stats"],
  });

  const filteredLogs = configLogs?.filter((log) => {
    if (searchQuery && !log.configKey.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

  const handleExportAll = async () => {
    try {
      const response = await fetch(`/api/database/export?type=${filterType}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Export failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `database-export-${filterType}-${new Date().toISOString()}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Export Successful",
        description: `Database export (${filterType}) downloaded successfully`,
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export database",
        variant: "destructive",
      });
    }
  };

  const handleExportUserConfigs = async () => {
    try {
      const response = await fetch('/api/database/export?type=config', {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Export failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `user-configs-export-${new Date().toISOString()}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Export Successful",
        description: "User configurations exported successfully",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export user configurations",
        variant: "destructive",
      });
    }
  };

  const handleViewLog = (log: UserConfigLog) => {
    setSelectedLog(log);
    setIsViewDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-foreground" data-testid="text-database-title">
          Database Management
        </h1>
        <p className="text-muted-foreground">
          Comprehensive oversight of system data, alerts, and configurations
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Data Export</CardTitle>
            <div className="flex gap-2">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[180px]" data-testid="select-filter-type">
                  <SelectValue placeholder="Filter by Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Data</SelectItem>
                  <SelectItem value="users">Users</SelectItem>
                  <SelectItem value="devices">Devices</SelectItem>
                  <SelectItem value="alerts">Alerts</SelectItem>
                  <SelectItem value="config">Configurations</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleExportAll} data-testid="button-export-all">
                <Download className="h-4 w-4 mr-2" />
                Export All Data
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>User Configurations Logs</CardTitle>
              <p className="text-sm text-muted-foreground">
                Detailed records of all user-specific settings and preference changes
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={handleExportUserConfigs} data-testid="button-export-user-configs">
              Export User Configs
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search user configs by ID, username, or key..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                data-testid="input-search-configs"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          ) : filteredLogs && filteredLogs.length > 0 ? (
            <div className="space-y-2">
              {/* Table Header */}
              <div className="grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground pb-2 border-b">
                <div className="col-span-1">Log ID</div>
                <div className="col-span-1">User ID</div>
                <div className="col-span-3">Configuration Key</div>
                <div className="col-span-2">Old Value</div>
                <div className="col-span-2">New Value</div>
                <div className="col-span-2">Timestamp</div>
                <div className="col-span-1 text-right">Action</div>
              </div>

              {/* Table Rows */}
              {filteredLogs.slice(0, 10).map((log) => (
                <div
                  key={log.id}
                  className="grid grid-cols-12 gap-2 text-sm items-center py-3 border-b last:border-0 hover-elevate rounded-md px-2"
                  data-testid={`config-log-${log.id}`}
                >
                  <div className="col-span-1 font-mono text-xs">
                    {log.id.slice(0, 8)}...
                  </div>
                  <div className="col-span-1 font-mono text-xs">
                    {log.userId.slice(0, 8)}...
                  </div>
                  <div className="col-span-3">{log.configKey}</div>
                  <div className="col-span-2 text-xs">
                    {log.oldValue ? (
                      log.oldValue.length > 20 ? (
                        <span title={log.oldValue}>{log.oldValue.slice(0, 20)}...</span>
                      ) : (
                        log.oldValue
                      )
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </div>
                  <div className="col-span-2 text-xs">
                    {log.newValue ? (
                      log.newValue.length > 20 ? (
                        <span title={log.newValue}>{log.newValue.slice(0, 20)}...</span>
                      ) : (
                        log.newValue
                      )
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </div>
                  <div className="col-span-2 text-xs">
                    {new Date(log.timestamp).toLocaleString()}
                  </div>
                  <div className="col-span-1 text-right">
                    <Button variant="ghost" size="sm" onClick={() => handleViewLog(log)} data-testid={`button-view-${log.id}`}>
                      View
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Database className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium">No configuration logs found</p>
              <p className="text-sm text-muted-foreground">
                User configuration changes will appear here
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Database Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Records</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold" data-testid="text-total-records">
              {stats?.totalRecords?.toLocaleString() || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Across all tables</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Database Size</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold" data-testid="text-database-size">
              {stats?.databaseSize || "Loading..."}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Current usage</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Last Backup</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">Real-time</div>
            <p className="text-xs text-muted-foreground mt-1">Neon auto-backup enabled</p>
          </CardContent>
        </Card>
      </div>

      {/* View Config Log Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Configuration Log Details</DialogTitle>
            <DialogDescription>
              Complete details of configuration change
            </DialogDescription>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Log ID</p>
                  <p className="font-mono text-sm">{selectedLog.id}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">User ID</p>
                  <p className="font-mono text-sm">{selectedLog.userId}</p>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Configuration Key</p>
                <p className="text-sm">{selectedLog.configKey}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Old Value</p>
                <pre className="text-sm bg-muted p-3 rounded-md overflow-auto">
                  {selectedLog.oldValue || "null"}
                </pre>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">New Value</p>
                <pre className="text-sm bg-muted p-3 rounded-md overflow-auto">
                  {selectedLog.newValue || "null"}
                </pre>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Timestamp</p>
                <p className="text-sm">{new Date(selectedLog.timestamp).toLocaleString()}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

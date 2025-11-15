import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Shield, Users, Building2 } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function SystemConfiguration() {
  const { toast } = useToast();
  const [platformName, setPlatformName] = useState("SmartHomeCloud");
  const [timezone, setTimezone] = useState("UTC-05:00");
  const [locale, setLocale] = useState("en-US");
  const [sessionTimeout, setSessionTimeout] = useState("60");
  const [dataRetention, setDataRetention] = useState(true);

  const handleSave = () => {
    toast({
      title: "Settings Saved",
      description: "Platform configuration has been updated successfully.",
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-foreground" data-testid="text-configuration-title">
          System Configuration
        </h1>
        <p className="text-muted-foreground">
          Manage core platform settings, security, user access levels, and multi-tenancy configurations
        </p>
      </div>

      <Tabs defaultValue="platform" className="space-y-4">
        <TabsList data-testid="tabs-configuration">
          <TabsTrigger value="platform" data-testid="tab-platform-settings">
            <Settings className="h-4 w-4 mr-2" />
            Platform Settings
          </TabsTrigger>
          <TabsTrigger value="security" data-testid="tab-security-controls">
            <Shield className="h-4 w-4 mr-2" />
            Security Controls
          </TabsTrigger>
          <TabsTrigger value="access" data-testid="tab-user-access">
            <Users className="h-4 w-4 mr-2" />
            User Access & Roles
          </TabsTrigger>
          <TabsTrigger value="tenancy" data-testid="tab-tenancy-management">
            <Building2 className="h-4 w-4 mr-2" />
            Tenancy Management
          </TabsTrigger>
        </TabsList>

        <TabsContent value="platform" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>General Platform Settings</CardTitle>
              <p className="text-sm text-muted-foreground">
                Configure the fundamental operational parameters and global behavior of the SmartHome Cloud platform
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="platform-name">Platform Name</Label>
                  <Input
                    id="platform-name"
                    value={platformName}
                    onChange={(e) => setPlatformName(e.target.value)}
                    data-testid="input-platform-name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="default-locale">Default Locale</Label>
                  <Select value={locale} onValueChange={setLocale}>
                    <SelectTrigger id="default-locale" data-testid="select-locale">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en-US">English (United States)</SelectItem>
                      <SelectItem value="en-GB">English (United Kingdom)</SelectItem>
                      <SelectItem value="es-ES">Spanish (Spain)</SelectItem>
                      <SelectItem value="fr-FR">French (France)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="default-timezone">Default Timezone</Label>
                  <Select value={timezone} onValueChange={setTimezone}>
                    <SelectTrigger id="default-timezone" data-testid="select-timezone">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UTC-05:00">UTC-05:00 (Eastern Time)</SelectItem>
                      <SelectItem value="UTC-06:00">UTC-06:00 (Central Time)</SelectItem>
                      <SelectItem value="UTC-07:00">UTC-07:00 (Mountain Time)</SelectItem>
                      <SelectItem value="UTC-08:00">UTC-08:00 (Pacific Time)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="session-timeout">Session Timeout (minutes)</Label>
                  <Input
                    id="session-timeout"
                    type="number"
                    value={sessionTimeout}
                    onChange={(e) => setSessionTimeout(e.target.value)}
                    data-testid="input-session-timeout"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-md">
                <div className="space-y-1">
                  <Label>Enable Data Retention Policy</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically archive or delete old sensor data and logs
                  </p>
                </div>
                <Switch
                  checked={dataRetention}
                  onCheckedChange={setDataRetention}
                  data-testid="switch-data-retention"
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" data-testid="button-cancel-platform">
                  Cancel
                </Button>
                <Button onClick={handleSave} data-testid="button-save-changes">
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Controls</CardTitle>
              <p className="text-sm text-muted-foreground">
                Configure security policies and access controls
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-md">
                <div className="space-y-1">
                  <Label>Two-Factor Authentication</Label>
                  <p className="text-sm text-muted-foreground">
                    Require 2FA for all admin users
                  </p>
                </div>
                <Switch data-testid="switch-2fa" />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-md">
                <div className="space-y-1">
                  <Label>API Rate Limiting</Label>
                  <p className="text-sm text-muted-foreground">
                    Limit API requests per user (30-60 requests/min)
                  </p>
                </div>
                <Switch defaultChecked data-testid="switch-rate-limiting" />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-md">
                <div className="space-y-1">
                  <Label>Audit Logging</Label>
                  <p className="text-sm text-muted-foreground">
                    Log all user actions and system events
                  </p>
                </div>
                <Switch defaultChecked data-testid="switch-audit-logging" />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-md">
                <div className="space-y-1">
                  <Label>Encryption at Rest</Label>
                  <p className="text-sm text-muted-foreground">
                    AES-256 encryption for all stored data
                  </p>
                </div>
                <Switch defaultChecked disabled />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="access" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Access & Roles</CardTitle>
              <p className="text-sm text-muted-foreground">
                Manage role-based access control and permissions
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                {[
                  {
                    role: "Homeowner",
                    description: "Can view devices, alerts, and surveillance for their own house",
                    count: 45,
                  },
                  {
                    role: "IoT Device Team",
                    description: "Can manage and configure all IoT devices across houses",
                    count: 8,
                  },
                  {
                    role: "Cloud Staff",
                    description: "Full system access including configuration and user management",
                    count: 3,
                  },
                ].map((roleInfo, i) => (
                  <div key={i} className="flex items-start justify-between p-4 border rounded-md">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <Label>{roleInfo.role}</Label>
                        <span className="text-xs text-muted-foreground">
                          ({roleInfo.count} users)
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{roleInfo.description}</p>
                    </div>
                    <Button variant="outline" size="sm" data-testid={`button-edit-role-${i}`}>
                      Edit
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tenancy" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Multi-Tenancy Configuration</CardTitle>
              <p className="text-sm text-muted-foreground">
                Configure tenant isolation and resource allocation
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-md">
                <div className="space-y-1">
                  <Label>Tenant Isolation</Label>
                  <p className="text-sm text-muted-foreground">
                    Strict data separation between tenants
                  </p>
                </div>
                <Switch defaultChecked disabled />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-md">
                <div className="space-y-1">
                  <Label>Cross-Tenant Analytics</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow aggregated analytics across multiple houses
                  </p>
                </div>
                <Switch data-testid="switch-cross-tenant" />
              </div>

              <div className="space-y-2">
                <Label>Default Storage Quota (per tenant)</Label>
                <Input placeholder="e.g., 100GB" data-testid="input-storage-quota" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

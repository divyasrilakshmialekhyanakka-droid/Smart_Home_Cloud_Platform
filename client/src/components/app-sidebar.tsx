import {
  Home,
  Bell,
  Video,
  Settings,
  Database,
  Users,
  LayoutDashboard,
  Smartphone,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
} from "@/components/ui/sidebar";

export function AppSidebar() {
  const [location] = useLocation();
  const { user } = useAuth();

  const homeownerItems = [
    {
      title: "Dashboard",
      url: "/",
      icon: Home,
      testId: "link-dashboard",
    },
    {
      title: "Alerts",
      url: "/alerts",
      icon: Bell,
      testId: "link-alerts",
    },
    {
      title: "Surveillance",
      url: "/surveillance",
      icon: Video,
      testId: "link-surveillance",
    },
  ];

  const cloudStaffItems = [
    {
      title: "System Dashboard",
      url: "/",
      icon: LayoutDashboard,
      testId: "link-system-dashboard",
    },
    {
      title: "User Management",
      url: "/users",
      icon: Users,
      testId: "link-users",
    },
    {
      title: "Alert Logs",
      url: "/alerts",
      icon: Bell,
      testId: "link-alert-logs",
    },
    {
      title: "System Configuration",
      url: "/configuration",
      icon: Settings,
      testId: "link-configuration",
    },
    {
      title: "Database Management",
      url: "/database",
      icon: Database,
      testId: "link-database",
    },
  ];

  const iotTeamItems = [
    {
      title: "Dashboard",
      url: "/",
      icon: Home,
      testId: "link-dashboard",
    },
    {
      title: "Device Management",
      url: "/devices",
      icon: Smartphone,
      testId: "link-devices",
    },
    {
      title: "Surveillance",
      url: "/surveillance",
      icon: Video,
      testId: "link-surveillance",
    },
    {
      title: "Alerts",
      url: "/alerts",
      icon: Bell,
      testId: "link-alerts",
    },
  ];

  let menuItems = homeownerItems;
  if (user?.role === "cloud_staff") {
    menuItems = cloudStaffItems;
  } else if (user?.role === "iot_team") {
    menuItems = iotTeamItems;
  }

  return (
    <Sidebar data-testid="sidebar-navigation">
      <SidebarHeader className="p-6">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
            <Home className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-foreground">SmartHomeCloud</span>
            <span className="text-xs text-muted-foreground">
              {user?.role === "cloud_staff" && "Cloud Employee"}
              {user?.role === "iot_team" && "Device Team"}
              {user?.role === "homeowner" && "Homeowner"}
            </span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location === item.url}
                    data-testid={item.testId}
                  >
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

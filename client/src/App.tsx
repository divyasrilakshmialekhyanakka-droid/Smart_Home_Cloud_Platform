import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/useAuth";
import { AppSidebar } from "@/components/app-sidebar";
import { Header } from "@/components/header";
import NotFound from "@/pages/not-found";
import LoginPage from "@/pages/login";
import HomeownerDashboard from "@/pages/homeowner-dashboard";
import CloudStaffDashboard from "@/pages/cloud-staff-dashboard";
import IoTTeamDashboard from "@/pages/iot-team-dashboard";
import AlertsPage from "@/pages/alerts";
import SurveillancePage from "@/pages/surveillance";
import DeviceManagement from "@/pages/device-management";
import UserManagement from "@/pages/user-management";
import SystemConfiguration from "@/pages/system-configuration";
import DatabaseManagement from "@/pages/database-management";
import ProfilePage from "@/pages/profile";
import AudioDetection from "@/pages/audio-detection";

function Router() {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center space-y-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Switch>
        <Route path="/" component={LoginPage} />
        <Route component={LoginPage} />
      </Switch>
    );
  }

  // Determine dashboard based on role
  const DashboardComponent =
    user?.role === "cloud_staff"
      ? CloudStaffDashboard
      : user?.role === "iot_team"
      ? IoTTeamDashboard
      : HomeownerDashboard;

  return (
    <Switch>
      <Route path="/" component={DashboardComponent} />
      <Route path="/alerts" component={AlertsPage} />
      <Route path="/surveillance" component={SurveillancePage} />
      <Route path="/devices" component={DeviceManagement} />
      <Route path="/audio-detection" component={AudioDetection} />
      <Route path="/users" component={UserManagement} />
      <Route path="/configuration" component={SystemConfiguration} />
      <Route path="/database" component={DatabaseManagement} />
      <Route path="/profile" component={ProfilePage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AuthenticatedApp() {
  const { isAuthenticated, isLoading } = useAuth();

  const sidebarStyle = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  if (isLoading || !isAuthenticated) {
    return (
      <>
        <Toaster />
        <Router />
      </>
    );
  }

  return (
    <SidebarProvider style={sidebarStyle as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <Header />
          <main className="flex-1 overflow-auto p-6">
            <div className="mx-auto max-w-7xl">
              <Router />
            </div>
          </main>
        </div>
      </div>
      <Toaster />
    </SidebarProvider>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthenticatedApp />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

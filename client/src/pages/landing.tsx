import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Home, Shield, Activity, Bell } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary">
              <Home className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-semibold text-foreground">SmartHomeCloud</span>
          </div>
          <Button asChild data-testid="button-login">
            <a href="/api/login">Log In</a>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-16">
        <div className="text-center space-y-6 mb-16">
          <h1 className="text-5xl font-bold text-foreground">
            Intelligent Cloud Platform
            <br />
            <span className="text-primary">for Smart Homes & Senior Care</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            AI-powered monitoring platform with real-time surveillance, IoT device management,
            and emergency detection for safer senior living
          </p>
          <Button size="lg" asChild data-testid="button-get-started">
            <a href="/api/login" className="text-lg px-8 py-6">
              Get Started
            </a>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6 space-y-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-md bg-accent">
                <Activity className="h-6 w-6 text-accent-foreground" />
              </div>
              <h3 className="text-lg font-semibold">Real-Time Monitoring</h3>
              <p className="text-sm text-muted-foreground">
                24/7 surveillance with live audio/video feeds from all connected devices
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 space-y-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-md bg-accent">
                <Bell className="h-6 w-6 text-accent-foreground" />
              </div>
              <h3 className="text-lg font-semibold">AI-Powered Alerts</h3>
              <p className="text-sm text-muted-foreground">
                Intelligent detection of falls, emergencies, and safety concerns with instant notifications
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 space-y-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-md bg-accent">
                <Home className="h-6 w-6 text-accent-foreground" />
              </div>
              <h3 className="text-lg font-semibold">IoT Device Control</h3>
              <p className="text-sm text-muted-foreground">
                Manage cameras, sensors, thermostats, and locks from a single dashboard
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 space-y-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-md bg-accent">
                <Shield className="h-6 w-6 text-accent-foreground" />
              </div>
              <h3 className="text-lg font-semibold">Secure & Compliant</h3>
              <p className="text-sm text-muted-foreground">
                Enterprise-grade security with encrypted data and role-based access control
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

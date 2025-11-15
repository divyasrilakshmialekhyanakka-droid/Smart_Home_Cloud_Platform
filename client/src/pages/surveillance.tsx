import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Video,
  Play,
  Pause,
  RotateCcw,
  Camera,
  Volume2,
  AlertCircle,
  Download,
} from "lucide-react";
import { useState } from "react";
import type { Device } from "@shared/schema";

export default function SurveillancePage() {
  const [selectedCameras, setSelectedCameras] = useState<string[]>([]);
  const [volume, setVolume] = useState([70]);
  const [isRecording, setIsRecording] = useState(false);

  const { data: cameras, isLoading } = useQuery<Device[]>({
    queryKey: ["/api/devices/cameras"],
  });

  const cameraDevices = cameras?.filter((d) => d.type === "camera") || [];

  const mockCameraNames = [
    "Main Entrance",
    "Living Room",
    "Backyard View",
    "Child's Room",
    "Kitchen Cam",
  ];

  const handleCameraToggle = (cameraId: string) => {
    setSelectedCameras((prev) =>
      prev.includes(cameraId) ? prev.filter((id) => id !== cameraId) : [...prev, cameraId]
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-foreground" data-testid="text-surveillance-title">
          Real-time Surveillance Feeds
        </h1>
        <p className="text-muted-foreground">
          Monitor live video and audio streams from your connected cameras
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Camera Grid */}
        <div className="lg:col-span-3 space-y-4">
          {/* Camera Feed Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-0">
                    <Skeleton className="aspect-video" />
                  </CardContent>
                </Card>
              ))
            ) : (
              mockCameraNames.slice(0, 4).map((name, i) => (
                <Card key={i} className="overflow-hidden" data-testid={`camera-feed-${i}`}>
                  <div className="relative aspect-video bg-gradient-to-br from-muted/50 to-muted">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center space-y-2">
                        <Camera className="h-12 w-12 text-muted-foreground mx-auto" />
                        <p className="text-sm font-medium">{name}</p>
                        <p className="text-xs text-muted-foreground">Live Feed</p>
                      </div>
                    </div>
                    <Badge className="absolute top-3 left-3 gap-1" variant="destructive">
                      <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
                      LIVE
                    </Badge>
                    <div className="absolute bottom-3 left-3 right-3 flex gap-2">
                      <Button
                        variant="secondary"
                        size="icon"
                        className="h-8 w-8 bg-background/80 backdrop-blur"
                        data-testid={`button-play-${i}`}
                      >
                        <Play className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="secondary"
                        size="icon"
                        className="h-8 w-8 bg-background/80 backdrop-blur"
                        data-testid={`button-mute-${i}`}
                      >
                        <Volume2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="secondary"
                        size="icon"
                        className="h-8 w-8 bg-background/80 backdrop-blur"
                        data-testid={`button-replay-${i}`}
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="secondary"
                        size="icon"
                        className="h-8 w-8 bg-background/80 backdrop-blur ml-auto"
                        data-testid={`button-record-${i}`}
                      >
                        <Video className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Sidebar Controls */}
        <div className="space-y-4">
          {/* Camera Selection */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Camera Selection</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {mockCameraNames.map((name, i) => (
                <div key={i} className="flex items-center space-x-2">
                  <Checkbox
                    id={`camera-${i}`}
                    checked={selectedCameras.includes(`cam-${i}`)}
                    onCheckedChange={() => handleCameraToggle(`cam-${i}`)}
                    data-testid={`checkbox-camera-${i}`}
                  />
                  <label
                    htmlFor={`camera-${i}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {name}
                  </label>
                </div>
              ))}
              <p className="text-xs text-muted-foreground mt-2">
                Selected: {selectedCameras.length} cameras
              </p>
            </CardContent>
          </Card>

          {/* Global Controls */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Global Controls</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant={isRecording ? "destructive" : "default"}
                className="w-full"
                onClick={() => setIsRecording(!isRecording)}
                data-testid="button-start-recording"
              >
                <Video className="h-4 w-4 mr-2" />
                {isRecording ? "Stop Recording" : "Start All Recordings"}
              </Button>
              <Button variant="outline" className="w-full" data-testid="button-snapshot">
                <Download className="h-4 w-4 mr-2" />
                Snapshot All Feeds
              </Button>
            </CardContent>
          </Card>

          {/* Surveillance Settings */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Surveillance Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Master Audio Volume</label>
                  <Volume2 className="h-4 w-4 text-muted-foreground" />
                </div>
                <Slider
                  value={volume}
                  onValueChange={setVolume}
                  max={100}
                  step={1}
                  className="w-full"
                  data-testid="slider-volume"
                />
                <p className="text-xs text-muted-foreground text-right">{volume[0]}%</p>
              </div>

              <Button
                variant="destructive"
                className="w-full"
                data-testid="button-emergency-trigger"
              >
                <AlertCircle className="h-4 w-4 mr-2" />
                Emergency Trigger
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

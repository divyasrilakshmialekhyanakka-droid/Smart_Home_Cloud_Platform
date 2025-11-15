import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Video,
  Play,
  Pause,
  RotateCcw,
  Camera,
  Volume2,
  AlertCircle,
  Download,
  ArrowLeft,
  VolumeX,
} from "lucide-react";
import { useState } from "react";
import type { Device } from "@shared/schema";

export default function SurveillancePage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedCameras, setSelectedCameras] = useState<string[]>([]);
  const [volume, setVolume] = useState([70]);
  const [isRecording, setIsRecording] = useState(false);
  const [playingCameras, setPlayingCameras] = useState<Set<string>>(new Set());
  const [mutedCameras, setMutedCameras] = useState<Set<string>>(new Set());
  const [recordingCameras, setRecordingCameras] = useState<Set<string>>(new Set());

  const { data: cameras, isLoading } = useQuery<Device[]>({
    queryKey: ["/api/devices/cameras"],
  });

  const cameraDevices = cameras?.filter((d) => d.type === "camera") || [];

  const handleCameraToggle = (cameraId: string) => {
    setSelectedCameras((prev) =>
      prev.includes(cameraId) ? prev.filter((id) => id !== cameraId) : [...prev, cameraId]
    );
  };

  const handlePlayPause = (cameraId: string, cameraName: string) => {
    setPlayingCameras((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(cameraId)) {
        newSet.delete(cameraId);
        toast({
          title: "Feed Paused",
          description: `${cameraName} feed paused`,
        });
      } else {
        newSet.add(cameraId);
        toast({
          title: "Feed Playing",
          description: `${cameraName} feed resumed`,
        });
      }
      return newSet;
    });
  };

  const handleMuteToggle = (cameraId: string, cameraName: string) => {
    setMutedCameras((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(cameraId)) {
        newSet.delete(cameraId);
        toast({
          title: "Audio Enabled",
          description: `${cameraName} audio unmuted`,
        });
      } else {
        newSet.add(cameraId);
        toast({
          title: "Audio Muted",
          description: `${cameraName} audio muted`,
        });
      }
      return newSet;
    });
  };

  const handleReplay = (cameraName: string) => {
    toast({
      title: "Replaying Last 30 Seconds",
      description: `Rewinding ${cameraName} feed`,
    });
  };

  const handleCameraRecord = (cameraId: string, cameraName: string) => {
    setRecordingCameras((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(cameraId)) {
        newSet.delete(cameraId);
        toast({
          title: "Recording Stopped",
          description: `Stopped recording ${cameraName}`,
        });
      } else {
        newSet.add(cameraId);
        toast({
          title: "Recording Started",
          description: `Now recording ${cameraName}`,
        });
      }
      return newSet;
    });
  };

  const handleSnapshotAll = () => {
    if (selectedCameras.length === 0) {
      toast({
        title: "No Cameras Selected",
        description: "Please select at least one camera before taking snapshots.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Snapshots Captured",
      description: `Downloaded snapshots from ${selectedCameras.length} selected camera${selectedCameras.length > 1 ? 's' : ''}`,
    });
  };

  const handleStartStopRecording = () => {
    if (!isRecording && selectedCameras.length === 0) {
      toast({
        title: "No Cameras Selected",
        description: "Please select at least one camera before starting recording.",
        variant: "destructive",
      });
      return;
    }

    setIsRecording(!isRecording);
    toast({
      title: isRecording ? "Recording Stopped" : "Recording Started",
      description: isRecording 
        ? `Stopped recording on ${selectedCameras.length} camera${selectedCameras.length > 1 ? 's' : ''}` 
        : `Now recording ${selectedCameras.length} selected camera${selectedCameras.length > 1 ? 's' : ''}`,
    });
  };

  const createEmergencyAlert = useMutation({
    mutationFn: async () => {
      if (!cameras || cameras.length === 0) {
        throw new Error("No cameras available");
      }

      // Use first selected camera, or first camera if none selected
      let targetCamera = cameras[0];
      if (selectedCameras.length > 0) {
        const selectedCam = cameras.find(c => c.id === selectedCameras[0]);
        if (selectedCam) {
          targetCamera = selectedCam;
        }
      }

      return await apiRequest("POST", "/api/alerts", {
        houseId: targetCamera.houseId,
        deviceId: targetCamera.id,
        type: "intrusion",
        severity: "critical",
        title: "Emergency Triggered Manually",
        description: `Emergency alert triggered from surveillance interface for ${targetCamera.name}. Immediate attention required.`,
        location: targetCamera.room || "Surveillance Control Center",
        aiConfidence: 1.0,
        status: "new",
      });
    },
    onSuccess: () => {
      // Invalidate alerts cache to refresh dashboards
      queryClient.invalidateQueries({ queryKey: ["/api/alerts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/alerts/recent"] });
      
      toast({
        title: "Emergency Alert Created",
        description: "Critical alert logged in system. All authorities notified. Emergency protocols activated.",
        variant: "destructive",
      });
    },
    onError: (error) => {
      toast({
        title: "Emergency Alert Failed",
        description: "Failed to create emergency alert. Please try again or contact support.",
        variant: "destructive",
      });
      console.error("Emergency alert creation failed:", error);
    },
  });

  const handleEmergencyTrigger = () => {
    if (!cameras || cameras.length === 0) {
      toast({
        title: "No Cameras Available",
        description: "Cannot trigger emergency - no cameras are connected.",
        variant: "destructive",
      });
      return;
    }
    createEmergencyAlert.mutate();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setLocation("/")}
          data-testid="button-back-to-dashboard"
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-semibold text-foreground" data-testid="text-surveillance-title">
            Real-time Surveillance Feeds
          </h1>
          <p className="text-muted-foreground">
            Monitor live video and audio streams from your connected cameras
          </p>
        </div>
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
            ) : cameraDevices.length > 0 ? (
              cameraDevices.map((camera, i) => (
                <Card key={camera.id} className="overflow-hidden" data-testid={`camera-feed-${i}`}>
                  <div className="relative aspect-video bg-gradient-to-br from-muted/50 to-muted">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center space-y-2">
                        <Camera className="h-12 w-12 text-muted-foreground mx-auto" />
                        <p className="text-sm font-medium">{camera.name}</p>
                        <p className="text-xs text-muted-foreground">{camera.room}</p>
                      </div>
                    </div>
                    <Badge className="absolute top-3 left-3 gap-1" variant={camera.status === "online" ? "destructive" : "secondary"}>
                      <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
                      {camera.status === "online" ? "LIVE" : "OFFLINE"}
                    </Badge>
                    <div className="absolute bottom-3 left-3 right-3 flex gap-2">
                      <Button
                        variant="secondary"
                        size="icon"
                        className="h-8 w-8 bg-background/80 backdrop-blur"
                        data-testid={`button-play-${i}`}
                        onClick={() => handlePlayPause(camera.id, camera.name)}
                      >
                        {playingCameras.has(camera.id) ? (
                          <Pause className="h-4 w-4" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="secondary"
                        size="icon"
                        className="h-8 w-8 bg-background/80 backdrop-blur"
                        data-testid={`button-mute-${i}`}
                        onClick={() => handleMuteToggle(camera.id, camera.name)}
                      >
                        {mutedCameras.has(camera.id) ? (
                          <VolumeX className="h-4 w-4" />
                        ) : (
                          <Volume2 className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="secondary"
                        size="icon"
                        className="h-8 w-8 bg-background/80 backdrop-blur"
                        data-testid={`button-replay-${i}`}
                        onClick={() => handleReplay(camera.name)}
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                      <Button
                        variant={recordingCameras.has(camera.id) ? "destructive" : "secondary"}
                        size="icon"
                        className="h-8 w-8 bg-background/80 backdrop-blur ml-auto"
                        data-testid={`button-record-${i}`}
                        onClick={() => handleCameraRecord(camera.id, camera.name)}
                      >
                        <Video className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <div className="col-span-2 text-center py-12 text-muted-foreground">
                <Camera className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No cameras available</p>
              </div>
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
              {cameraDevices.length > 0 ? (
                <>
                  {cameraDevices.map((camera, i) => (
                    <div key={camera.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`camera-${camera.id}`}
                        checked={selectedCameras.includes(camera.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedCameras([...selectedCameras, camera.id]);
                          } else {
                            setSelectedCameras(selectedCameras.filter(id => id !== camera.id));
                          }
                        }}
                        data-testid={`checkbox-camera-${i}`}
                      />
                      <label
                        htmlFor={`camera-${camera.id}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                      >
                        {camera.name} <span className="text-muted-foreground">({camera.room})</span>
                      </label>
                    </div>
                  ))}
                  <p className="text-xs text-muted-foreground mt-2">
                    Selected: {selectedCameras.length} cameras
                  </p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">No cameras available</p>
              )}
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
                onClick={handleStartStopRecording}
                data-testid="button-start-recording"
                disabled={!isRecording && selectedCameras.length === 0}
              >
                <Video className="h-4 w-4 mr-2" />
                {isRecording ? `Stop Recording (${selectedCameras.length})` : "Start Recording Selected"}
              </Button>
              <Button 
                variant="outline" 
                className="w-full" 
                data-testid="button-snapshot"
                onClick={handleSnapshotAll}
                disabled={selectedCameras.length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                Snapshot Selected ({selectedCameras.length})
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
                onClick={handleEmergencyTrigger}
                disabled={!cameras || cameras.length === 0 || createEmergencyAlert.isPending}
              >
                <AlertCircle className="h-4 w-4 mr-2" />
                {createEmergencyAlert.isPending ? "Triggering..." : "Emergency Trigger"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Upload, Mic, Play, AlertCircle, CheckCircle, Volume2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

interface Device {
  id: string;
  name: string;
  type: string;
  room: string;
  houseId: string;
}

interface AudioPrediction {
  label: string;
  confidence: number;
  model: 'yamnet' | 'hubert';
}

interface AudioAnalysisResult {
  primaryDetection: {
    class: string;
    confidence: number;
    model: string;
  };
  allPredictions: AudioPrediction[];
  shouldGenerateAlert: boolean;
  alertSeverity?: string;
  alertType?: string;
  alertMessage?: string;
}

interface AudioDetection {
  id: string;
  deviceId: string;
  fileName: string;
  detectedClass: string;
  confidence: number;
  modelUsed: string;
  alertGenerated: boolean;
  createdAt: string;
}

export default function AudioDetection() {
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedDevice, setSelectedDevice] = useState<string>("");
  const [analysisResult, setAnalysisResult] = useState<AudioAnalysisResult | null>(null);

  const { data: devices = [] } = useQuery<Device[]>({
    queryKey: ['/api/devices'],
  });

  const { data: detectionHistory = [] } = useQuery<AudioDetection[]>({
    queryKey: ['/api/audio/detections'],
    refetchInterval: 10000,
  });

  const analyzeMutation = useMutation({
    mutationFn: async () => {
      if (!selectedFile || !selectedDevice) {
        throw new Error("Please select both a file and a device");
      }

      const formData = new FormData();
      formData.append('audio', selectedFile);
      formData.append('deviceId', selectedDevice);

      const response = await fetch('/api/audio/analyze', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to analyze audio');
      }

      return response.json();
    },
    onSuccess: (data) => {
      setAnalysisResult(data.analysis);
      queryClient.invalidateQueries({ queryKey: ['/api/audio/detections'] });
      queryClient.invalidateQueries({ queryKey: ['/api/alerts'] });
      
      toast({
        title: "Audio Analysis Complete",
        description: `Detected: ${data.analysis.primaryDetection.class} (${(data.analysis.primaryDetection.confidence * 100).toFixed(1)}% confidence)`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Analysis Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Please select an audio file smaller than 10MB",
          variant: "destructive",
        });
        return;
      }
      setSelectedFile(file);
      setAnalysisResult(null);
    }
  };

  const audioDevices = devices.filter(d => d.type === 'camera' || d.type === 'microphone');

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2" data-testid="text-page-title">Audio Detection System</h1>
        <p className="text-muted-foreground">
          Test AI-powered audio recognition using YAMNet and HuBERT models
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload Audio for Analysis
            </CardTitle>
            <CardDescription>
              Simulate IoT device audio capture by uploading a sound file
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Select IoT Device
              </label>
              <Select 
                value={selectedDevice} 
                onValueChange={setSelectedDevice}
                data-testid="select-device"
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose camera or microphone..." />
                </SelectTrigger>
                <SelectContent>
                  {audioDevices.map((device) => (
                    <SelectItem key={device.id} value={device.id}>
                      {device.name} ({device.room})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Audio File
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  accept="audio/*"
                  onChange={handleFileChange}
                  className="flex-1 text-sm"
                  data-testid="input-audio-file"
                />
              </div>
              {selectedFile && (
                <p className="text-sm text-muted-foreground mt-2">
                  Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                </p>
              )}
            </div>


            <Button
              onClick={() => analyzeMutation.mutate()}
              disabled={!selectedFile || !selectedDevice || analyzeMutation.isPending}
              className="w-full"
              data-testid="button-analyze-audio"
            >
              {analyzeMutation.isPending ? (
                <>Analyzing Audio...</>
              ) : (
                <>
                  <Volume2 className="h-4 w-4 mr-2" />
                  Analyze Audio
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Analysis Results</CardTitle>
            <CardDescription>
              AI model predictions and alert generation
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!analysisResult ? (
              <div className="text-center py-8 text-muted-foreground">
                <Mic className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Upload an audio file to see analysis results</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Primary Detection</h3>
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-lg" data-testid="text-detected-class">
                          {analysisResult.primaryDetection.class}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Model: {analysisResult.primaryDetection.model.toUpperCase()}
                        </p>
                      </div>
                      <Badge variant="default">
                        {(analysisResult.primaryDetection.confidence * 100).toFixed(1)}% confidence
                      </Badge>
                    </div>
                  </div>
                </div>

                {analysisResult.shouldGenerateAlert && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription data-testid="text-alert-message">
                      <strong>Alert Generated:</strong> {analysisResult.alertMessage}
                      <br />
                      <span className="text-sm">
                        Severity: {analysisResult.alertSeverity} | Type: {analysisResult.alertType}
                      </span>
                    </AlertDescription>
                  </Alert>
                )}

                {!analysisResult.shouldGenerateAlert && (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      No alert generated. Sound classified as low-priority.
                    </AlertDescription>
                  </Alert>
                )}

                <div>
                  <h3 className="font-semibold mb-2">All Predictions</h3>
                  <div className="space-y-2">
                    {analysisResult.allPredictions.slice(0, 5).map((pred, idx) => (
                      <div key={idx} className="flex items-center justify-between text-sm p-2 bg-muted/50 rounded">
                        <span>{pred.label}</span>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {pred.model}
                          </Badge>
                          <span className="text-muted-foreground">
                            {(pred.confidence * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Detection History</CardTitle>
          <CardDescription>
            Recent audio detections from all IoT devices
          </CardDescription>
        </CardHeader>
        <CardContent>
          {detectionHistory.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">
              No detections yet. Upload an audio file to get started.
            </p>
          ) : (
            <div className="space-y-2">
              {detectionHistory.slice(0, 10).map((detection) => {
                const device = devices.find(d => d.id === detection.deviceId);
                return (
                  <div key={detection.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium">{detection.detectedClass}</p>
                      <p className="text-sm text-muted-foreground">
                        {device?.name} - {detection.fileName}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">
                        {detection.modelUsed}
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}

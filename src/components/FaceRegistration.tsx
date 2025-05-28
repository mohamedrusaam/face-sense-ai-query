
import { useState, useRef, useCallback, useEffect } from "react";
import Webcam from "react-webcam";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera, User, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import * as faceapi from 'face-api.js';

const FaceRegistration = () => {
  const [name, setName] = useState("");
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [faceDescriptor, setFaceDescriptor] = useState<Float32Array | null>(null);
  const webcamRef = useRef<Webcam>(null);
  const { toast } = useToast();

  // Load face-api.js models
  useEffect(() => {
    const loadModels = async () => {
      try {
        const MODEL_URL = '/models';
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ]);
        setModelsLoaded(true);
        console.log('Face-api.js models loaded successfully');
      } catch (error) {
        console.error('Error loading face-api.js models:', error);
        toast({
          title: "Model Loading Error",
          description: "Failed to load face recognition models. Some features may not work.",
          variant: "destructive",
        });
      }
    };

    loadModels();
  }, []);

  const detectFace = async (imageElement: HTMLImageElement) => {
    if (!modelsLoaded) {
      throw new Error('Face recognition models not loaded');
    }

    const detection = await faceapi
      .detectSingleFace(imageElement, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!detection) {
      throw new Error('No face detected in the image');
    }

    return detection.descriptor;
  };

  const capture = useCallback(async () => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      setCapturedImage(imageSrc);
      setIsCapturing(false);

      // Create image element for face detection
      const img = new Image();
      img.onload = async () => {
        try {
          const descriptor = await detectFace(img);
          setFaceDescriptor(descriptor);
          toast({
            title: "Face Detected",
            description: "Face successfully detected and encoded!",
          });
        } catch (error) {
          console.error('Face detection error:', error);
          toast({
            title: "Face Detection Failed",
            description: "No clear face detected. Please try again with better lighting.",
            variant: "destructive",
          });
        }
      };
      img.src = imageSrc;
    }
  }, [webcamRef, modelsLoaded]);

  const handleRegister = async () => {
    if (!name || !capturedImage || !faceDescriptor) {
      toast({
        title: "Missing Information",
        description: "Please enter a name and capture a clear photo with detected face",
        variant: "destructive",
      });
      return;
    }

    setIsRegistering(true);
    try {
      // Convert face descriptor to string for storage
      const faceEncoding = Array.from(faceDescriptor).join(',');
      
      const { error } = await supabase
        .from("face_registrations")
        .insert({
          name,
          face_encoding: faceEncoding,
        });

      if (error) throw error;

      toast({
        title: "Registration Successful",
        description: `${name} has been registered successfully with real face recognition!`,
      });

      // Reset form
      setName("");
      setCapturedImage(null);
      setFaceDescriptor(null);
    } catch (error) {
      console.error("Registration error:", error);
      toast({
        title: "Registration Failed",
        description: "Failed to register face. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card className="bg-gray-900/50 border-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <User className="w-5 h-5" />
            Face Registration {modelsLoaded ? "✓" : "⏳"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {!modelsLoaded && (
            <div className="bg-yellow-600/20 border border-yellow-600/50 rounded-lg p-4">
              <p className="text-yellow-200 text-sm">
                Loading face recognition models... This may take a moment on first load.
              </p>
            </div>
          )}

          {/* Name Input */}
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium text-gray-300">
              Full Name
            </label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your full name"
              className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
            />
          </div>

          {/* Camera Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Live Camera Feed */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Live Camera</h3>
              <div className="relative aspect-video bg-gray-800 rounded-lg overflow-hidden">
                {isCapturing ? (
                  <Webcam
                    ref={webcamRef}
                    audio={false}
                    screenshotFormat="image/jpeg"
                    className="w-full h-full object-cover"
                    videoConstraints={{
                      width: 640,
                      height: 480,
                      facingMode: "user"
                    }}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    <Camera className="w-12 h-12" />
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => setIsCapturing(!isCapturing)}
                  variant="outline"
                  className="flex-1 bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
                  disabled={!modelsLoaded}
                >
                  {isCapturing ? "Stop Camera" : "Start Camera"}
                </Button>
                {isCapturing && (
                  <Button
                    onClick={capture}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                    disabled={!modelsLoaded}
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    Capture & Detect
                  </Button>
                )}
              </div>
            </div>

            {/* Captured Image */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">
                Captured Photo {faceDescriptor ? "✓ Face Detected" : ""}
              </h3>
              <div className="relative aspect-video bg-gray-800 rounded-lg overflow-hidden">
                {capturedImage ? (
                  <img
                    src={capturedImage}
                    alt="Captured face"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    <span>No photo captured</span>
                  </div>
                )}
                {faceDescriptor && (
                  <div className="absolute top-2 right-2 bg-green-600 text-white px-2 py-1 rounded text-xs">
                    Face Encoded
                  </div>
                )}
              </div>
              <Button
                onClick={handleRegister}
                disabled={!name || !capturedImage || !faceDescriptor || isRegistering}
                className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50"
              >
                <Save className="w-4 h-4 mr-2" />
                {isRegistering ? "Registering..." : "Register Face"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FaceRegistration;

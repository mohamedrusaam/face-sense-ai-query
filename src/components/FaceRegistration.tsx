
import { useState, useRef, useCallback } from "react";
import Webcam from "react-webcam";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera, User, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const FaceRegistration = () => {
  const [name, setName] = useState("");
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const webcamRef = useRef<Webcam>(null);
  const { toast } = useToast();

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      setCapturedImage(imageSrc);
      setIsCapturing(false);
    }
  }, [webcamRef]);

  const handleRegister = async () => {
    if (!name || !capturedImage) {
      toast({
        title: "Missing Information",
        description: "Please enter a name and capture a photo",
        variant: "destructive",
      });
      return;
    }

    setIsRegistering(true);
    try {
      // In a real implementation, this would be sent to a face recognition API
      // For now, we'll store the base64 image as the "encoding"
      const { error } = await supabase
        .from("face_registrations")
        .insert({
          name,
          face_encoding: capturedImage,
        });

      if (error) throw error;

      toast({
        title: "Registration Successful",
        description: `${name} has been registered successfully!`,
      });

      // Reset form
      setName("");
      setCapturedImage(null);
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
            Face Registration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
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
                >
                  {isCapturing ? "Stop Camera" : "Start Camera"}
                </Button>
                {isCapturing && (
                  <Button
                    onClick={capture}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    Capture
                  </Button>
                )}
              </div>
            </div>

            {/* Captured Image */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Captured Photo</h3>
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
              </div>
              <Button
                onClick={handleRegister}
                disabled={!name || !capturedImage || isRegistering}
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


import { useState, useRef, useEffect } from "react";
import Webcam from "react-webcam";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera, Users, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

interface Recognition {
  name: string;
  confidence: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

const LiveRecognition = () => {
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [recognitions, setRecognitions] = useState<Recognition[]>([]);
  const webcamRef = useRef<Webcam>(null);

  // Fetch registered faces
  const { data: registeredFaces } = useQuery({
    queryKey: ["registeredFaces"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("face_registrations")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  // Simulate face recognition processing
  const simulateRecognition = () => {
    if (!registeredFaces || registeredFaces.length === 0) return;

    // Simulate detecting faces with random positions
    const mockRecognitions: Recognition[] = [];
    const numFaces = Math.floor(Math.random() * 3) + 1; // 1-3 faces

    for (let i = 0; i < Math.min(numFaces, registeredFaces.length); i++) {
      const randomFace = registeredFaces[Math.floor(Math.random() * registeredFaces.length)];
      mockRecognitions.push({
        name: randomFace.name,
        confidence: 0.8 + Math.random() * 0.2, // 80-100% confidence
        x: Math.random() * 400 + 50, // Random position
        y: Math.random() * 300 + 50,
        width: 120,
        height: 150,
      });
    }

    setRecognitions(mockRecognitions);
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRecognizing) {
      // Process frames every 2 seconds (as specified in requirements)
      interval = setInterval(simulateRecognition, 2000);
    } else {
      setRecognitions([]);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecognizing, registeredFaces]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card className="bg-gray-900/50 border-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Eye className="w-5 h-5" />
            Live Face Recognition
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Recognition Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-800/50 p-4 rounded-lg">
              <div className="flex items-center gap-2 text-blue-400">
                <Users className="w-5 h-5" />
                <span className="font-semibold">Registered Faces</span>
              </div>
              <p className="text-2xl font-bold text-white mt-1">
                {registeredFaces?.length || 0}
              </p>
            </div>
            <div className="bg-gray-800/50 p-4 rounded-lg">
              <div className="flex items-center gap-2 text-green-400">
                <Camera className="w-5 h-5" />
                <span className="font-semibold">Detected Faces</span>
              </div>
              <p className="text-2xl font-bold text-white mt-1">
                {recognitions.length}
              </p>
            </div>
          </div>

          {/* Live Video Feed with Overlays */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-white">Live Video Stream</h3>
              <Button
                onClick={() => setIsRecognizing(!isRecognizing)}
                className={`${
                  isRecognizing 
                    ? "bg-red-600 hover:bg-red-700" 
                    : "bg-green-600 hover:bg-green-700"
                }`}
              >
                {isRecognizing ? "Stop Recognition" : "Start Recognition"}
              </Button>
            </div>

            <div className="relative bg-gray-800 rounded-lg overflow-hidden">
              {isRecognizing ? (
                <>
                  <Webcam
                    ref={webcamRef}
                    audio={false}
                    className="w-full max-h-96 object-cover"
                    videoConstraints={{
                      width: 640,
                      height: 480,
                      facingMode: "user"
                    }}
                  />
                  
                  {/* Face Recognition Overlays */}
                  {recognitions.map((recognition, index) => (
                    <div
                      key={index}
                      className="absolute border-2 border-green-400"
                      style={{
                        left: `${recognition.x}px`,
                        top: `${recognition.y}px`,
                        width: `${recognition.width}px`,
                        height: `${recognition.height}px`,
                      }}
                    >
                      {/* Name Label */}
                      <div className="absolute -top-8 left-0 bg-green-400 text-black px-2 py-1 rounded text-sm font-semibold">
                        {recognition.name} ({Math.round(recognition.confidence * 100)}%)
                      </div>
                    </div>
                  ))}
                </>
              ) : (
                <div className="flex items-center justify-center h-64 text-gray-500">
                  <div className="text-center">
                    <Camera className="w-12 h-12 mx-auto mb-2" />
                    <p>Click "Start Recognition" to begin live face detection</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Recognition Results */}
          {recognitions.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-semibold text-white">Currently Detected:</h4>
              <div className="space-y-2">
                {recognitions.map((recognition, index) => (
                  <div key={index} className="bg-gray-800/50 p-3 rounded-lg flex justify-between items-center">
                    <span className="text-white font-medium">{recognition.name}</span>
                    <span className="text-green-400">
                      {Math.round(recognition.confidence * 100)}% confidence
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LiveRecognition;

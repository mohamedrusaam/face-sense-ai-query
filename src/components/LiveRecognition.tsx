
import { useState, useRef, useEffect, useCallback } from "react";
import Webcam from "react-webcam";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera, Users, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import * as faceapi from 'face-api.js';

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
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

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
        console.log('Face-api.js models loaded for recognition');
      } catch (error) {
        console.error('Error loading face-api.js models:', error);
      }
    };

    loadModels();
  }, []);

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

  // Convert stored face encodings back to Float32Array
  const getKnownFaceDescriptors = useCallback(() => {
    if (!registeredFaces) return [];
    
    return registeredFaces.map(face => {
      const descriptor = new Float32Array(
        face.face_encoding.split(',').map(Number)
      );
      return {
        name: face.name,
        descriptor
      };
    });
  }, [registeredFaces]);

  // Real-time face recognition
  const performRecognition = useCallback(async () => {
    if (!webcamRef.current?.video || !modelsLoaded || !registeredFaces) return;

    const video = webcamRef.current.video;
    const knownFaces = getKnownFaceDescriptors();
    
    if (knownFaces.length === 0) return;

    try {
      const detections = await faceapi
        .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptors();

      const newRecognitions: Recognition[] = [];

      for (const detection of detections) {
        let bestMatch = { name: 'Unknown', confidence: 0 };
        
        // Compare with known faces
        for (const knownFace of knownFaces) {
          const distance = faceapi.euclideanDistance(detection.descriptor, knownFace.descriptor);
          const confidence = Math.max(0, 1 - distance); // Convert distance to confidence
          
          if (confidence > 0.6 && confidence > bestMatch.confidence) { // Threshold of 0.6
            bestMatch = { name: knownFace.name, confidence };
          }
        }

        if (bestMatch.confidence > 0) {
          const box = detection.detection.box;
          newRecognitions.push({
            name: bestMatch.name,
            confidence: bestMatch.confidence,
            x: box.x,
            y: box.y,
            width: box.width,
            height: box.height,
          });
        }
      }

      setRecognitions(newRecognitions);
    } catch (error) {
      console.error('Recognition error:', error);
    }
  }, [modelsLoaded, registeredFaces, getKnownFaceDescriptors]);

  // Set up recognition interval
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRecognizing && modelsLoaded) {
      // Process frames every 1 second for real-time recognition
      interval = setInterval(performRecognition, 1000);
    } else {
      setRecognitions([]);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecognizing, modelsLoaded, performRecognition]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card className="bg-gray-900/50 border-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Eye className="w-5 h-5" />
            Live Face Recognition {modelsLoaded ? "✓" : "⏳"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {!modelsLoaded && (
            <div className="bg-yellow-600/20 border border-yellow-600/50 rounded-lg p-4">
              <p className="text-yellow-200 text-sm">
                Loading face recognition models for live detection...
              </p>
            </div>
          )}

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
                disabled={!modelsLoaded}
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
                  
                  {/* Real Face Recognition Overlays */}
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
                    {!modelsLoaded && (
                      <p className="text-sm mt-2">Waiting for models to load...</p>
                    )}
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

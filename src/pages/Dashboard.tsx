
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserPlus, Camera, MessageSquare } from "lucide-react";
import FaceRegistration from "@/components/FaceRegistration";
import LiveRecognition from "@/components/LiveRecognition";
import ChatBot from "@/components/ChatBot";

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState("registration");

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-gray-800 bg-black/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-center mb-2">
            Face Recognition Platform
          </h1>
          <p className="text-gray-400 text-center">
            Real-Time AI Q&A using RAG Technology
          </p>
          <p className="text-xs text-gray-500 text-center mt-2">
            This project is a part of a hackathon run by https://katomaran.com
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-gray-900/50 border border-gray-800">
            <TabsTrigger 
              value="registration" 
              className="flex items-center gap-2 data-[state=active]:bg-gray-800 data-[state=active]:text-white"
            >
              <UserPlus className="w-4 h-4" />
              Registration
            </TabsTrigger>
            <TabsTrigger 
              value="recognition" 
              className="flex items-center gap-2 data-[state=active]:bg-gray-800 data-[state=active]:text-white"
            >
              <Camera className="w-4 h-4" />
              Live Recognition
            </TabsTrigger>
            <TabsTrigger 
              value="chat" 
              className="flex items-center gap-2 data-[state=active]:bg-gray-800 data-[state=active]:text-white"
            >
              <MessageSquare className="w-4 h-4" />
              ChatBot Q&A
            </TabsTrigger>
          </TabsList>

          <TabsContent value="registration" className="mt-8">
            <FaceRegistration />
          </TabsContent>

          <TabsContent value="recognition" className="mt-8">
            <LiveRecognition />
          </TabsContent>

          <TabsContent value="chat" className="mt-8">
            <ChatBot />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;


import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, Send, Bot, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface ChatMessage {
  id: string;
  type: "user" | "bot";
  content: string;
  timestamp: Date;
}

const ChatBot = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      type: "bot",
      content: "Hello! I'm your Face Recognition AI assistant. I can answer questions about registered faces, recognition statistics, and more. Try asking me something like 'Who was the last person registered?' or 'How many people are currently registered?'",
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Fetch registered faces for RAG context
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

  // Simulate RAG-powered responses
  const generateResponse = (query: string): string => {
    const lowerQuery = query.toLowerCase();
    
    if (!registeredFaces || registeredFaces.length === 0) {
      return "Currently, there are no registered faces in the system. Please register some faces first using the Registration tab.";
    }

    // Question about count
    if (lowerQuery.includes("how many") || lowerQuery.includes("count")) {
      return `There are currently ${registeredFaces.length} people registered in the system.`;
    }

    // Question about latest registration
    if (lowerQuery.includes("last") || lowerQuery.includes("recent") || lowerQuery.includes("latest")) {
      const latest = registeredFaces[0];
      return `The last person registered was ${latest.name} on ${new Date(latest.created_at).toLocaleDateString()} at ${new Date(latest.created_at).toLocaleTimeString()}.`;
    }

    // Question about specific person
    const nameMatch = registeredFaces.find(face => 
      lowerQuery.includes(face.name.toLowerCase())
    );
    if (nameMatch) {
      return `${nameMatch.name} was registered on ${new Date(nameMatch.created_at).toLocaleDateString()} at ${new Date(nameMatch.created_at).toLocaleTimeString()}.`;
    }

    // Question about all registered people
    if (lowerQuery.includes("who") || lowerQuery.includes("list") || lowerQuery.includes("all")) {
      const names = registeredFaces.map(face => face.name).join(", ");
      return `The registered people are: ${names}.`;
    }

    // Question about time-related queries
    if (lowerQuery.includes("when") || lowerQuery.includes("time")) {
      const registrations = registeredFaces.map(face => 
        `${face.name} (${new Date(face.created_at).toLocaleDateString()})`
      ).join(", ");
      return `Registration times: ${registrations}.`;
    }

    // Default response
    return `I can help you with information about the ${registeredFaces.length} registered faces. You can ask me about registration counts, when someone was registered, who's in the system, or specific details about any registered person.`;
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: "user",
      content: inputMessage,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      // Generate response using simulated RAG
      const response = generateResponse(inputMessage);

      // Store chat interaction in database
      await supabase.from("chat_messages").insert({
        query: inputMessage,
        response: response,
      });

      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: "bot",
        content: response,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error("Chat error:", error);
      toast({
        title: "Chat Error",
        description: "Failed to get response. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="bg-gray-900/50 border-gray-800 h-[600px] flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <MessageSquare className="w-5 h-5" />
            Face Recognition AI Assistant
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col space-y-4">
          {/* Chat Messages */}
          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${
                    message.type === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {message.type === "bot" && (
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] p-3 rounded-lg ${
                      message.type === "user"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-800 text-gray-100"
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                  {message.type === "user" && (
                    <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-3 justify-start">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-gray-800 text-gray-100 p-3 rounded-lg">
                    <p className="text-sm">Thinking...</p>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Message Input */}
          <div className="flex gap-2">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me about registered faces, recognition stats, or anything else..."
              className="flex-1 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
              disabled={isLoading}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ChatBot;

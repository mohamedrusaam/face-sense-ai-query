
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query } = await req.json();
    console.log('Received query:', query);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch face registration data for RAG context
    const { data: faceData, error: faceError } = await supabase
      .from('face_registrations')
      .select('*')
      .order('created_at', { ascending: false });

    if (faceError) {
      console.error('Error fetching face data:', faceError);
      throw faceError;
    }

    console.log('Retrieved face data:', faceData?.length || 0, 'records');

    // Prepare context for RAG
    const contextData = faceData?.map(face => ({
      name: face.name,
      registered_at: face.created_at,
      timestamp: face.timestamp
    })) || [];

    // Create context string for the AI
    const contextString = contextData.length > 0 
      ? `Registered faces database contains ${contextData.length} people: ${contextData.map(face => 
          `${face.name} (registered on ${new Date(face.registered_at).toLocaleDateString()} at ${new Date(face.registered_at).toLocaleTimeString()})`
        ).join(', ')}.`
      : 'No faces are currently registered in the database.';

    console.log('Context prepared:', contextString);

    // Call OpenAI API
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are an AI assistant for a Face Recognition Platform. You help users get information about registered faces and recognition statistics. 

Current database context: ${contextString}

Guidelines:
- Answer questions about registered people, registration times, counts, and related statistics
- Be helpful and provide specific information when available
- If no data exists, politely explain that no faces are registered yet
- Keep responses concise but informative
- You can answer questions like "Who was registered last?", "How many people are registered?", "When was [name] registered?", etc.`
          },
          {
            role: 'user',
            content: query
          }
        ],
        temperature: 0.3,
        max_tokens: 300
      }),
    });

    if (!openAIResponse.ok) {
      const errorText = await openAIResponse.text();
      console.error('OpenAI API error:', errorText);
      throw new Error(`OpenAI API error: ${openAIResponse.status}`);
    }

    const aiResult = await openAIResponse.json();
    const aiResponse = aiResult.choices[0].message.content;

    console.log('AI response generated:', aiResponse);

    // Store the chat interaction
    const { error: chatError } = await supabase
      .from('chat_messages')
      .insert({
        query: query,
        response: aiResponse
      });

    if (chatError) {
      console.error('Error storing chat message:', chatError);
    }

    return new Response(
      JSON.stringify({ response: aiResponse }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in ai-chat function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to process chat request',
        details: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

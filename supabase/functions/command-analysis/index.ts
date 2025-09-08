import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import "https://deno.land/x/xhr@0.1.0/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { input, type, context = {} } = await req.json()
    
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')
    if (!OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured')
    }

    let systemPrompt = ''
    
    if (type === 'command-analysis') {
      systemPrompt = `You are a travel data assistant. Analyze user commands and extract structured information.

Available modules: travel-pins, people, journal, expenses, checklist, learning, food, gear
Available actions: add, get, search, update, delete, complete

Return JSON with this structure:
{
  "action": "add|get|search|update|delete|complete",
  "entity": "person|travel-pin|journal|expense|checklist|learning|food|gear|general",
  "data": {extracted data object},
  "query": "search query if applicable"
}

Examples:
Input: "add contact Ramesh 5454 at Delhi metro station, works in Pune as IT engineer"
Output: {
  "action": "add",
  "entity": "person", 
  "data": {
    "name": "Ramesh",
    "contact": "5454",
    "location": "Delhi metro station",
    "profession": "IT engineer",
    "workLocation": "Pune"
  }
}

Input: "get me people working in Delhi or Pune"
Output: {
  "action": "search",
  "entity": "people",
  "query": "Delhi Pune"
}

Input: "completed trip to Rishikesh"
Output: {
  "action": "complete",
  "entity": "travel-pin",
  "data": {
    "location": "Rishikesh",
    "status": "visited"
  }
}`
    } else {
      systemPrompt = `Analyze this travel-related input and provide helpful structured data extraction.`
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: `Input: "${input}"\nContext: ${JSON.stringify(context)}`
          }
        ],
        temperature: 0.3,
        max_tokens: 800
      }),
    })

    const aiResult = await response.json()
    let result = aiResult.choices[0].message.content

    // Try to parse as JSON, fallback to text processing
    try {
      result = JSON.parse(result)
    } catch {
      // If not JSON, create a basic structure
      const inputLower = input.toLowerCase()
      
      if (inputLower.includes('add contact') || inputLower.includes('add person')) {
        result = {
          action: 'add',
          entity: 'person',
          data: {},
          query: input
        }
      } else if (inputLower.includes('get people') || inputLower.includes('show people')) {
        result = {
          action: 'search',
          entity: 'people',
          query: input
        }
      } else {
        result = {
          action: 'general',
          entity: 'general',
          query: input
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        result,
        type
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Command Analysis Error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        fallback: {
          action: 'general',
          entity: 'general',
          query: 'general inquiry'
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})
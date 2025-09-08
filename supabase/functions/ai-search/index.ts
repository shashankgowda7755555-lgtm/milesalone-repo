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
    const { query, context = [] } = await req.json()
    
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')
    if (!OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured')
    }

    // Enhanced search with semantic understanding
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
            content: `You are an intelligent travel companion search assistant. Analyze the user's query and extract:
            1. Intent (what they're looking for)
            2. Entities (people, places, dates, amounts, categories)
            3. Relationships (connections between data)
            4. Temporal context (time-based queries)
            5. Suggestions (related searches they might want)
            
            Return JSON with:
            {
              "intent": "search_description",
              "entities": {
                "people": ["names"],
                "places": ["locations"], 
                "dates": ["time_references"],
                "amounts": ["monetary_values"],
                "categories": ["types"]
              },
              "filters": {
                "modules": ["travelPins", "people", etc],
                "timeRange": "specific_period",
                "conditions": ["search_conditions"]
              },
              "suggestions": ["related_queries"],
              "searchTerms": ["enhanced_keywords"]
            }`
          },
          {
            role: 'user',
            content: `Query: "${query}"\nContext: ${JSON.stringify(context.slice(0, 5))}`
          }
        ],
        temperature: 0.3,
        max_tokens: 1000
      }),
    })

    const aiResult = await response.json()
    const analysis = JSON.parse(aiResult.choices[0].message.content)

    return new Response(
      JSON.stringify({ 
        success: true, 
        analysis,
        searchTerms: analysis.searchTerms || [query],
        filters: analysis.filters || {},
        suggestions: analysis.suggestions || []
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('AI Search Error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        fallback: {
          searchTerms: [req.body?.query || ''],
          filters: {},
          suggestions: []
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})
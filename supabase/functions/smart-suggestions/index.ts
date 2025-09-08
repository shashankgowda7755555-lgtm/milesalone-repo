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

    const systemPrompts = {
      'auto-tag': `Extract relevant tags from this travel data. Return 3-5 specific, searchable tags as JSON array.`,
      'categorize': `Categorize this travel entry. Return the most appropriate category and confidence score.`,
      'suggestions': `Based on this travel data, suggest 3 related actions or insights the user might want. Be specific and actionable.`,
      'extract-entities': `Extract people, places, dates, and other entities from this text. Return structured data.`
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
            content: systemPrompts[type] || 'Analyze this travel data and provide helpful insights.'
          },
          {
            role: 'user',
            content: `Input: "${input}"\nContext: ${JSON.stringify(context)}`
          }
        ],
        temperature: 0.4,
        max_tokens: 500
      }),
    })

    const aiResult = await response.json()
    let result = aiResult.choices[0].message.content

    // Try to parse as JSON, fallback to text
    try {
      result = JSON.parse(result)
    } catch {
      // Keep as text if not valid JSON
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
    console.error('Smart Suggestions Error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        fallback: []
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.56.0";

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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    if (req.method === 'POST') {
      const { action, matchId, extraMinutes } = await req.json();
      
      console.log(`Match timer action: ${action} for match ${matchId}`, { extraMinutes });

      // Validate required parameters
      if (!action || !matchId) {
        return new Response(
          JSON.stringify({ error: 'Missing required parameters: action and matchId' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      // Call the database function to update match timer with correct parameter order
      const { data, error } = await supabase.rpc('update_match_timer', {
        _match_id: matchId,
        _action: action,
        _extra_minutes: extraMinutes || 0
      });

      if (error) {
        console.error('Error updating match timer:', error);
        return new Response(
          JSON.stringify({ error: error.message }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      console.log('Match timer updated successfully:', data);

      return new Response(
        JSON.stringify({ 
          success: true, 
          data: data?.[0] 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // GET request - increment all active match timers
    if (req.method === 'GET') {
      console.log('Incrementing match timers...');
      
      // Call the increment function
      const { error } = await supabase.rpc('increment_match_timer');

      if (error) {
        console.error('Error incrementing match timers:', error);
        return new Response(
          JSON.stringify({ error: error.message }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      // Get current active matches to return status
      const { data: activeMatches, error: fetchError } = await supabase
        .from('matches')
        .select('id, status, current_minute, extra_time, is_timer_active, home_team, away_team')
        .eq('status', 'live');

      if (fetchError) {
        console.error('Error fetching active matches:', fetchError);
      }

      console.log(`Timer incremented. Active matches: ${activeMatches?.length || 0}`);

      return new Response(
        JSON.stringify({ 
          success: true, 
          activeMatches: activeMatches || [],
          timestamp: new Date().toISOString()
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Match timer function error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
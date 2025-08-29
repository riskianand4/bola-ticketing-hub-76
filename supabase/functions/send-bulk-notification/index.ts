import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('=== Bulk Notification Function Started ===');
    
    const { title, message, notification_type, data, target_type, user_ids } = await req.json();

    // Validate required fields
    if (!title || !message) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Title and message are required' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const supabaseService = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    let targetUsers: string[] = [];
    let successCount = 0;

    if (target_type === 'all') {
      // Get all users from profiles table (most reliable approach)
      const { data: profileUsers, error: profileError } = await supabaseService
        .from('profiles')
        .select('user_id');
        
      if (profileError) {
        console.error('Error fetching from profiles:', profileError);
        throw new Error(`Failed to fetch users from profiles: ${profileError.message}`);
      }
      
      if (!profileUsers || profileUsers.length === 0) {
        console.log('No users found in profiles table, trying notification_preferences');
        // Fallback to notification_preferences
        const { data: prefUsers, error: prefError } = await supabaseService
          .from('notification_preferences')
          .select('user_id');
          
        if (prefError) {
          throw new Error(`Failed to fetch users: ${prefError.message}`);
        }
        
        targetUsers = prefUsers?.map(u => u.user_id) || [];
      } else {
        targetUsers = profileUsers.map(u => u.user_id);
      }

      console.log(`Found ${targetUsers.length} total users for notification`);
    } else if (target_type === 'specific' && user_ids) {
      targetUsers = Array.isArray(user_ids) ? user_ids : [user_ids];
      console.log(`Targeting specific users: ${targetUsers.length}`);
    } else {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid target configuration' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Create notifications in batch
    const notifications = targetUsers.map(userId => ({
      user_id: userId,
      title,
      message,
      notification_type: notification_type || 'general',
      data: data || {},
      created_at: new Date().toISOString()
    }));

    if (notifications.length > 0) {
      // Insert notifications in batches of 100 to avoid query size limits
      const batchSize = 100;
      for (let i = 0; i < notifications.length; i += batchSize) {
        const batch = notifications.slice(i, i + batchSize);
        
        const { error: insertError } = await supabaseService
          .from('notifications')
          .insert(batch);

        if (insertError) {
          console.error('Error inserting notification batch:', insertError);
          throw new Error(`Failed to insert notifications: ${insertError.message}`);
        }

        successCount += batch.length;
        console.log(`Inserted batch ${Math.floor(i/batchSize) + 1}, total: ${successCount}`);
      }
    }

    console.log(`Successfully sent ${successCount} notifications`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Notification sent to ${successCount} users`,
        sent_count: successCount
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Bulk notification error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Failed to send notifications' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
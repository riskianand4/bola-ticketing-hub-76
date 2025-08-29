import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

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
    const webhookData = await req.json();
    
    const supabaseService = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    console.log('Webhook received:', webhookData);

    // Handle invoice status updates
    if (webhookData.external_id && webhookData.status) {
      const paymentStatus = webhookData.status === 'PAID' ? 'completed' : 
                           webhookData.status === 'EXPIRED' ? 'failed' : 'pending';

      // Update ticket orders
      const { error: ticketError } = await supabaseService
        .from('ticket_orders')
        .update({ 
          payment_status: paymentStatus,
          updated_at: new Date().toISOString()
        })
        .eq('payment_reference', webhookData.external_id);

      if (ticketError) {
        console.error('Error updating ticket order:', ticketError);
      }

      // Update merchandise orders if applicable
      const { error: merchError } = await supabaseService
        .from('merchandise_orders')
        .update({ 
          payment_status: paymentStatus,
          updated_at: new Date().toISOString()
        })
        .eq('payment_reference', webhookData.external_id);

      if (merchError) {
        console.error('Error updating merchandise order:', merchError);
      }

      // If payment is successful, you can add logic here to:
      // - Send confirmation email
      // - Send WhatsApp message
      // - Update inventory
      // - Generate tickets/receipts
      
      if (paymentStatus === 'completed') {
        console.log('Payment successful for:', webhookData.external_id);
        // Add your success logic here
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Webhook processing error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
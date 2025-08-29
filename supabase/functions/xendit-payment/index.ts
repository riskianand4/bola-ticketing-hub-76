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
    console.log('=== Xendit Payment Function Started ===');
    
    // Parse request body first and handle any parsing errors
    let requestBody;
    try {
      requestBody = await req.json();
      console.log('Request body parsed successfully:', JSON.stringify(requestBody, null, 2));
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Invalid JSON in request body: ${parseError.message}` 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const { type, amount, description, customer_data, ticket_id, quantity, redirect_url } = requestBody;

    // Validate required fields
    if (!amount || !description || !customer_data) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing required fields: amount, description, or customer_data' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Get user from auth header with better error handling
    const authHeader = req.headers.get('Authorization');
    console.log('Auth header present:', !!authHeader);
    
    if (!authHeader) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Authorization header missing' 
        }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Authentication failed: ${authError.message}` 
        }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    if (!data.user) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'No user found in authentication data' 
        }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const user = data.user;
    console.log('Authenticated user ID:', user.id);

    // Check Xendit API key - MUST use secret key, not public key
    const xenditApiKey = Deno.env.get('XENDIT_SECRET_KEY');
    console.log('Xendit API key present:', !!xenditApiKey);
    console.log('Xendit API key type:', xenditApiKey ? (xenditApiKey.startsWith('xnd_development_') ? 'development' : xenditApiKey.startsWith('xnd_production_') ? 'production' : 'unknown') : 'not set');
    
    if (!xenditApiKey) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Xendit API key not configured in environment variables' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    // Verify it's a secret key (not public key)
    if (!xenditApiKey.startsWith('xnd_development_') && !xenditApiKey.startsWith('xnd_production_')) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid Xendit API key format. Must be a secret key starting with xnd_development_ or xnd_production_' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Generate unique external ID
    const externalId = `TICKET-${Date.now()}-${user.id.substring(0, 8)}`;
    console.log('Generated external ID:', externalId);

    const invoiceData = {
      external_id: externalId,
      amount: Number(amount),
      description: description,
      invoice_duration: 86400, // 24 hours
      customer: {
        given_names: customer_data.given_names,
        email: customer_data.email,
        mobile_number: customer_data.mobile_number
      },
      success_redirect_url: redirect_url?.success || `${req.headers.get('origin')}/payment-success`,
      failure_redirect_url: redirect_url?.failure || `${req.headers.get('origin')}/payment-failed`,
      currency: 'IDR',
      items: [{
        name: description,
        quantity: quantity || 1,
        price: Number(amount)
      }]
    };

    console.log('Creating Xendit invoice with data:', JSON.stringify(invoiceData, null, 2));

    const xenditResponse = await fetch('https://api.xendit.co/v1/invoices', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(xenditApiKey + ':')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(invoiceData),
    });

    console.log('Xendit response status:', xenditResponse.status);
    
    if (!xenditResponse.ok) {
      const errorBody = await xenditResponse.text();
      console.error('Xendit API error:', errorBody);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Xendit API error: ${xenditResponse.status} - ${errorBody}` 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const invoice = await xenditResponse.json();
    console.log('Xendit invoice created successfully:', invoice.id);

    // Save order to database
    const supabaseService = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    if (type === 'ticket' && ticket_id) {
      console.log('Saving ticket order to database');
      
      const orderData = {
        user_id: user.id,
        ticket_id: ticket_id,
        quantity: quantity || 1,
        total_amount: Number(amount),
        customer_name: customer_data.given_names,
        customer_email: customer_data.email,
        customer_phone: customer_data.mobile_number,
        payment_status: 'pending',
        payment_reference: externalId,
        order_date: new Date().toISOString()
      };

      const { error: insertError } = await supabaseService
        .from('ticket_orders')
        .insert(orderData);

      if (insertError) {
        console.error('Error saving ticket order:', insertError);
        // Don't throw error here, payment creation was successful
      } else {
        console.log('Ticket order saved successfully');
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        payment_url: invoice.invoice_url,
        external_id: invoice.external_id,
        invoice_id: invoice.id
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Payment creation error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Failed to create payment' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
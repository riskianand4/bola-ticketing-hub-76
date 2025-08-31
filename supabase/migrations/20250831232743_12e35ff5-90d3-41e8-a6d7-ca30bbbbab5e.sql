-- Create sample ticket data for testing scanner functionality
-- Get first available user_id from profiles table

DO $$
DECLARE
    test_user_id UUID;
BEGIN
    -- Get first available user from profiles
    SELECT user_id INTO test_user_id FROM public.profiles LIMIT 1;
    
    -- If no users exist, create test data with null user_id (for anonymous testing)
    IF test_user_id IS NULL THEN
        test_user_id := '00000000-0000-0000-0000-000000000001';
        
        -- Create a test profile first
        INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
        VALUES (test_user_id, 'test@scanner.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW())
        ON CONFLICT DO NOTHING;
        
        INSERT INTO public.profiles (user_id, full_name)
        VALUES (test_user_id, 'Test Scanner User')
        ON CONFLICT DO NOTHING;
    END IF;

    -- Create a sample match
    INSERT INTO public.matches (
      id,
      home_team,
      away_team,
      match_date,
      status,
      home_score,
      away_score,
      venue,
      competition
    ) VALUES (
      'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      'Persiraja Banda Aceh',
      'Persib Bandung', 
      '2024-12-31 19:00:00',
      'scheduled',
      0,
      0,
      'Stadion H. Dimurthala',
      'Liga 1 Indonesia'
    ) ON CONFLICT (id) DO NOTHING;

    -- Create sample tickets for the match
    INSERT INTO public.tickets (
      id,
      match_id,
      ticket_type,
      price,
      total_quantity,
      available_quantity,
      description
    ) VALUES 
    (
      'e47ac10b-58cc-4372-a567-0e02b2c3d479',
      'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      'VIP',
      150000,
      100,
      95,
      'Tiket VIP dengan akses lounge'
    ),
    (
      'd47ac10b-58cc-4372-a567-0e02b2c3d479', 
      'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      'Tribun Utama',
      75000,
      500,
      450,
      'Tiket tribun utama dengan view terbaik'
    ),
    (
      'c47ac10b-58cc-4372-a567-0e02b2c3d479',
      'f47ac10b-58cc-4372-a567-0e02b2c3d479', 
      'Tribun Umum',
      35000,
      1000,
      800,
      'Tiket tribun umum untuk supporter setia'
    ) ON CONFLICT (id) DO NOTHING;

    -- Create sample ticket orders with completed payment status for testing
    INSERT INTO public.ticket_orders (
      id,
      user_id,
      ticket_id,
      customer_name,
      customer_email,
      customer_phone,
      quantity,
      total_amount,
      payment_status,
      payment_method,
      payment_reference
    ) VALUES 
    -- Sample order 1 - VIP ticket, paid, ready for scanning
    (
      '12345678-1234-4372-a567-0e02b2c3d479',
      test_user_id,
      'e47ac10b-58cc-4372-a567-0e02b2c3d479',
      'Ahmad Ridwan',
      'ahmad.ridwan@example.com',
      '081234567890',
      2,
      300000,
      'completed',
      'bank_transfer',
      'PAY-TEST-001'
    ),
    -- Sample order 2 - Tribun Utama, paid, ready for scanning  
    (
      '22345678-1234-4372-a567-0e02b2c3d479',
      test_user_id,
      'd47ac10b-58cc-4372-a567-0e02b2c3d479',
      'Siti Nurhaliza',
      'siti.nurhaliza@example.com', 
      '081234567891',
      4,
      300000,
      'completed',
      'e_wallet',
      'PAY-TEST-002'
    ),
    -- Sample order 3 - Tribun Umum, paid, ready for scanning
    (
      '32345678-1234-4372-a567-0e02b2c3d479',
      test_user_id,
      'c47ac10b-58cc-4372-a567-0e02b2c3d479',
      'Budi Santoso',
      'budi.santoso@example.com',
      '081234567892', 
      1,
      35000,
      'completed',
      'cash',
      'PAY-TEST-003'
    ),
    -- Sample order 4 - Already scanned (for testing duplicate scan prevention)
    (
      '42345678-1234-4372-a567-0e02b2c3d479',
      test_user_id,
      'c47ac10b-58cc-4372-a567-0e02b2c3d479',
      'Diana Putri',
      'diana.putri@example.com',
      '081234567893',
      2,
      70000,
      'completed',
      'bank_transfer',
      'PAY-TEST-004'
    ),
    -- Sample order 5 - Pending payment (for testing invalid ticket)
    (
      '52345678-1234-4372-a567-0e02b2c3d479',
      test_user_id,
      'd47ac10b-58cc-4372-a567-0e02b2c3d479',
      'Eko Prabowo',
      'eko.prabowo@example.com',
      '081234567894',
      1,
      75000,
      'pending',
      'bank_transfer',
      'PAY-TEST-005'
    ) ON CONFLICT (id) DO NOTHING;

    -- Create a sample scan record for order 4 (to test duplicate detection)
    INSERT INTO public.ticket_scans (
      ticket_order_id,
      scanner_user_id,
      scanned_at
    ) VALUES (
      '42345678-1234-4372-a567-0e02b2c3d479',
      NULL,
      NOW() - INTERVAL '1 hour'
    ) ON CONFLICT DO NOTHING;
    
    RAISE NOTICE 'Test data created successfully with user_id: %', test_user_id;
END $$;

-- Add indexes for better performance on scanner queries
CREATE INDEX IF NOT EXISTS idx_ticket_orders_payment_status ON public.ticket_orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_ticket_scans_ticket_order_id ON public.ticket_scans(ticket_order_id);
CREATE INDEX IF NOT EXISTS idx_tickets_match_id ON public.tickets(match_id);
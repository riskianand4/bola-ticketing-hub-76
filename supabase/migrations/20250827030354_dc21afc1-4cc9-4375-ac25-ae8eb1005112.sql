-- Add live match timer fields to matches table
ALTER TABLE public.matches 
ADD COLUMN current_minute integer DEFAULT 0,
ADD COLUMN extra_time integer DEFAULT 0,
ADD COLUMN is_timer_active boolean DEFAULT false,
ADD COLUMN match_started_at timestamp with time zone,
ADD COLUMN match_ended_at timestamp with time zone,
ADD COLUMN half_time_break boolean DEFAULT false;

-- Create match events for live commentary
CREATE TYPE match_event_type AS ENUM ('goal', 'yellow_card', 'red_card', 'substitution', 'half_time', 'full_time', 'commentary');

-- Update match_events table to use the enum
ALTER TABLE public.match_events 
ALTER COLUMN event_type TYPE match_event_type USING event_type::match_event_type;

-- Function to update match timer
CREATE OR REPLACE FUNCTION public.update_match_timer(_match_id uuid, _action text, _extra_minutes integer DEFAULT 0)
RETURNS TABLE(success boolean, message text, match_data jsonb)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  match_record RECORD;
  new_minute integer;
  total_minutes integer;
BEGIN
  -- Check if caller is admin
  IF NOT (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role)) THEN
    RETURN QUERY SELECT false, 'Unauthorized'::text, NULL::jsonb;
    RETURN;
  END IF;

  -- Get current match data
  SELECT * INTO match_record FROM public.matches WHERE id = _match_id;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Match not found'::text, NULL::jsonb;
    RETURN;
  END IF;

  CASE _action
    WHEN 'start' THEN
      -- Start the match
      UPDATE public.matches 
      SET status = 'live',
          is_timer_active = true,
          match_started_at = now(),
          current_minute = 0,
          extra_time = 0,
          half_time_break = false,
          updated_at = now()
      WHERE id = _match_id;
      
    WHEN 'pause' THEN
      -- Pause the match timer
      UPDATE public.matches 
      SET is_timer_active = false,
          updated_at = now()
      WHERE id = _match_id;
      
    WHEN 'resume' THEN
      -- Resume the match timer
      UPDATE public.matches 
      SET is_timer_active = true,
          updated_at = now()
      WHERE id = _match_id;
      
    WHEN 'add_extra_time' THEN
      -- Add extra time
      UPDATE public.matches 
      SET extra_time = extra_time + _extra_minutes,
          updated_at = now()
      WHERE id = _match_id;
      
    WHEN 'half_time' THEN
      -- Start half time break
      UPDATE public.matches 
      SET half_time_break = true,
          is_timer_active = false,
          updated_at = now()
      WHERE id = _match_id;
      
      -- Add half time event
      INSERT INTO public.match_events (match_id, event_time, event_type, description)
      VALUES (_match_id, match_record.current_minute, 'half_time', 'Turun minum');
      
    WHEN 'second_half' THEN
      -- Start second half
      UPDATE public.matches 
      SET half_time_break = false,
          is_timer_active = true,
          current_minute = 45,
          updated_at = now()
      WHERE id = _match_id;
      
    WHEN 'finish' THEN
      -- Finish the match
      UPDATE public.matches 
      SET status = 'finished',
          is_timer_active = false,
          match_ended_at = now(),
          updated_at = now()
      WHERE id = _match_id;
      
      -- Add full time event
      INSERT INTO public.match_events (match_id, event_time, event_type, description)
      VALUES (_match_id, match_record.current_minute + match_record.extra_time, 'full_time', 'Pertandingan berakhir');
      
    ELSE
      RETURN QUERY SELECT false, 'Invalid action'::text, NULL::jsonb;
      RETURN;
  END CASE;

  -- Get updated match data
  SELECT * INTO match_record FROM public.matches WHERE id = _match_id;
  
  -- Calculate total minutes for auto-finish logic
  total_minutes := match_record.current_minute + match_record.extra_time;
  
  -- Auto finish if total minutes >= 97 (90 + 7 typical max extra time)
  IF total_minutes >= 97 AND match_record.status = 'live' AND NOT match_record.half_time_break THEN
    UPDATE public.matches 
    SET status = 'finished',
        is_timer_active = false,
        match_ended_at = now(),
        updated_at = now()
    WHERE id = _match_id;
    
    INSERT INTO public.match_events (match_id, event_time, event_type, description)
    VALUES (_match_id, total_minutes, 'full_time', 'Pertandingan berakhir (auto)');
    
    -- Get final updated data
    SELECT * INTO match_record FROM public.matches WHERE id = _match_id;
  END IF;

  RETURN QUERY SELECT true, 'Match timer updated successfully'::text, 
    jsonb_build_object(
      'id', match_record.id,
      'status', match_record.status,
      'current_minute', match_record.current_minute,
      'extra_time', match_record.extra_time,
      'is_timer_active', match_record.is_timer_active,
      'half_time_break', match_record.half_time_break,
      'home_team', match_record.home_team,
      'away_team', match_record.away_team,
      'home_score', match_record.home_score,
      'away_score', match_record.away_score
    );
END;
$$;

-- Function to increment match timer (called by edge function)
CREATE OR REPLACE FUNCTION public.increment_match_timer()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Increment timer for all active matches
  UPDATE public.matches 
  SET current_minute = current_minute + 1,
      updated_at = now()
  WHERE status = 'live' 
    AND is_timer_active = true 
    AND NOT half_time_break;
    
  -- Auto finish matches that reach 97 minutes total
  UPDATE public.matches 
  SET status = 'finished',
      is_timer_active = false,
      match_ended_at = now(),
      updated_at = now()
  WHERE status = 'live' 
    AND (current_minute + extra_time) >= 97;
    
  -- Insert full time events for auto-finished matches
  INSERT INTO public.match_events (match_id, event_time, event_type, description)
  SELECT id, (current_minute + extra_time), 'full_time', 'Pertandingan berakhir (auto)'
  FROM public.matches 
  WHERE status = 'finished' 
    AND match_ended_at >= now() - interval '1 minute'
    AND NOT EXISTS (
      SELECT 1 FROM public.match_events me 
      WHERE me.match_id = matches.id 
      AND me.event_type = 'full_time'
    );
END;
$$;
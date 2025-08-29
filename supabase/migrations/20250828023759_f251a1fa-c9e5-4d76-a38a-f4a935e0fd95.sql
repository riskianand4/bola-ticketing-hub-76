-- Update update_match_timer to persist elapsed minutes on pause/half_time/finish
CREATE OR REPLACE FUNCTION public.update_match_timer(
  _match_id uuid,
  _action text,
  _extra_minutes integer DEFAULT 0
)
RETURNS TABLE(success boolean, message text, match_data jsonb)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  match_record RECORD;
  total_minutes integer;
  is_service_role boolean;
  seconds_elapsed integer := 0;
  minutes_to_add integer := 0;
  baseline_ts timestamptz;
BEGIN
  -- Check if caller is admin, super_admin, or service role
  is_service_role := current_setting('request.jwt.claims', true)::jsonb ->> 'role' = 'service_role';
  IF NOT (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role) OR is_service_role) THEN
    RETURN QUERY SELECT false, 'Unauthorized'::text, NULL::jsonb;
    RETURN;
  END IF;

  -- Get current match data
  SELECT * INTO match_record FROM public.matches WHERE id = _match_id;
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Match not found'::text, NULL::jsonb;
    RETURN;
  END IF;

  -- Determine baseline for elapsed time calculation (last state change or start)
  baseline_ts := COALESCE(match_record.updated_at, match_record.match_started_at);

  -- For actions that stop or checkpoint time, accumulate elapsed minutes since last resume/update
  IF _action IN ('pause','half_time','finish') THEN
    IF match_record.status = 'live' AND match_record.is_timer_active = true AND NOT match_record.half_time_break AND baseline_ts IS NOT NULL THEN
      seconds_elapsed := GREATEST(0, FLOOR(EXTRACT(EPOCH FROM (now() - baseline_ts))));
      minutes_to_add := FLOOR(seconds_elapsed / 60);
    END IF;
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
      -- Pause: persist elapsed minutes since last update
      UPDATE public.matches 
      SET current_minute = current_minute + minutes_to_add,
          is_timer_active = false,
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
      -- Enter half time: persist elapsed minutes then stop timer
      UPDATE public.matches 
      SET current_minute = current_minute + minutes_to_add,
          half_time_break = true,
          is_timer_active = false,
          updated_at = now()
      WHERE id = _match_id;
      
      -- Add half time event at the accurate minute
      INSERT INTO public.match_events (match_id, event_time, event_type, description)
      VALUES (_match_id, match_record.current_minute + minutes_to_add, 'half_time', 'Turun minum');
      
    WHEN 'second_half' THEN
      -- Start second half
      UPDATE public.matches 
      SET half_time_break = false,
          is_timer_active = true,
          current_minute = 45,
          updated_at = now()
      WHERE id = _match_id;
      
    WHEN 'finish' THEN
      -- Finish: persist elapsed minutes then finalize
      UPDATE public.matches 
      SET current_minute = current_minute + minutes_to_add,
          status = 'finished',
          is_timer_active = false,
          match_ended_at = now(),
          updated_at = now()
      WHERE id = _match_id;
      
      -- Add full time event using total minute at finish (including extra time)
      INSERT INTO public.match_events (match_id, event_time, event_type, description)
      VALUES (
        _match_id,
        (match_record.current_minute + minutes_to_add + match_record.extra_time),
        'full_time',
        'Pertandingan berakhir'
      );
      
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
    VALUES (_match_id, total_minutes, 'full_time', 'Pertandingan berakhir (auto)')
    ON CONFLICT DO NOTHING;
    
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
      'away_score', match_record.away_score,
      'updated_at', match_record.updated_at,
      'match_started_at', match_record.match_started_at
    );
END;
$$;
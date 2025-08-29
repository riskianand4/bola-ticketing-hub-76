-- Add team logos to matches table
ALTER TABLE public.matches 
ADD COLUMN home_team_logo text,
ADD COLUMN away_team_logo text;

-- Enable realtime for matches table
ALTER TABLE public.matches REPLICA IDENTITY FULL;

-- Add to realtime publication if not already added
-- This allows real-time updates when match data changes
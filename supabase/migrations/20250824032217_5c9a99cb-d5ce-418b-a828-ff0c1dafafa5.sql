-- Create match_events table for live commentary
CREATE TABLE public.match_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id UUID NOT NULL,
  event_type TEXT NOT NULL, -- 'goal', 'card', 'substitution', 'kickoff', 'halftime', 'fulltime', 'comment'
  event_time INTEGER NOT NULL, -- minute of the match
  player_name TEXT, -- player involved in the event
  description TEXT NOT NULL, -- event description
  team TEXT, -- 'home' or 'away'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.match_events ENABLE ROW LEVEL SECURITY;

-- Create policies for match_events
CREATE POLICY "Anyone can view match events" 
ON public.match_events 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can insert match events" 
ON public.match_events 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Admins can update match events" 
ON public.match_events 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Admins can delete match events" 
ON public.match_events 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

-- Add foreign key constraint
ALTER TABLE public.match_events 
ADD CONSTRAINT match_events_match_id_fkey 
FOREIGN KEY (match_id) REFERENCES public.matches(id) ON DELETE CASCADE;

-- Create index for better performance
CREATE INDEX idx_match_events_match_id ON public.match_events(match_id);
CREATE INDEX idx_match_events_created_at ON public.match_events(created_at);

-- Enable realtime for match_events
ALTER PUBLICATION supabase_realtime ADD TABLE public.match_events;

-- Create trigger for updated_at
CREATE TRIGGER update_match_events_updated_at
BEFORE UPDATE ON public.match_events
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
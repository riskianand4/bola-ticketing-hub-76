-- Add player_type to players table to support players, coaches, and management
ALTER TABLE public.players ADD COLUMN player_type text DEFAULT 'player';

-- Add more fields for coaches and management
ALTER TABLE public.players ADD COLUMN role_title text;
ALTER TABLE public.players ADD COLUMN experience_years integer;
ALTER TABLE public.players ADD COLUMN achievements text[];
ALTER TABLE public.players ADD COLUMN sort_order integer DEFAULT 0;

-- Create index for player_type
CREATE INDEX idx_players_type ON public.players(player_type);

-- Update the check constraint if it exists or create one
-- Note: We'll use ENUM-like values: 'player', 'coach', 'management'
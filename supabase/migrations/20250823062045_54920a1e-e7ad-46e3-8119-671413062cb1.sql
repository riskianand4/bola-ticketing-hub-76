-- Create notification types enum first
CREATE TYPE public.notification_type AS ENUM (
  'general',
  'match_reminder',
  'goal_alert',
  'ticket_alert',
  'news_alert',
  'merchandise_alert',
  'payment_confirmation'
);

-- Enhance notifications table for push notifications
ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS scheduled_for TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS push_sent BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS data JSONB DEFAULT '{}';

-- Add notification_type column with proper enum type
ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS notification_type_new notification_type DEFAULT 'general';

-- Update existing records
UPDATE public.notifications 
SET notification_type_new = 'general'::notification_type 
WHERE notification_type_new IS NULL;

-- Drop old column and rename new one
ALTER TABLE public.notifications DROP COLUMN IF EXISTS notification_type;
ALTER TABLE public.notifications RENAME COLUMN notification_type_new TO notification_type;

-- Create notification preferences table
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  match_reminders BOOLEAN DEFAULT true,
  goal_alerts BOOLEAN DEFAULT true,
  ticket_alerts BOOLEAN DEFAULT true,
  news_alerts BOOLEAN DEFAULT true,
  merchandise_alerts BOOLEAN DEFAULT true,
  push_enabled BOOLEAN DEFAULT false,
  push_token TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on notification preferences
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- Create policies for notification preferences
CREATE POLICY "Users can view their own notification preferences"
ON public.notification_preferences
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notification preferences"
ON public.notification_preferences
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notification preferences"
ON public.notification_preferences
FOR UPDATE
USING (auth.uid() = user_id);

-- Create function to automatically create notification preferences for new users
CREATE OR REPLACE FUNCTION public.handle_new_user_notification_preferences()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notification_preferences (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$;

-- Create trigger for automatic notification preferences creation
DROP TRIGGER IF EXISTS on_auth_user_created_notification_preferences ON auth.users;
CREATE TRIGGER on_auth_user_created_notification_preferences
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_notification_preferences();

-- Create function to send push notification
CREATE OR REPLACE FUNCTION public.send_push_notification(
  _user_id UUID,
  _title TEXT,
  _message TEXT,
  _type notification_type DEFAULT 'general',
  _data JSONB DEFAULT '{}',
  _schedule_for TIMESTAMPTZ DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  notification_id UUID;
  user_preferences RECORD;
BEGIN
  -- Get user notification preferences
  SELECT * INTO user_preferences
  FROM public.notification_preferences
  WHERE user_id = _user_id;
  
  -- Check if user wants this type of notification
  IF user_preferences IS NULL OR NOT user_preferences.push_enabled THEN
    RETURN NULL;
  END IF;
  
  -- Check specific notification type preferences
  CASE _type
    WHEN 'match_reminder' THEN
      IF NOT user_preferences.match_reminders THEN
        RETURN NULL;
      END IF;
    WHEN 'goal_alert' THEN
      IF NOT user_preferences.goal_alerts THEN
        RETURN NULL;
      END IF;
    WHEN 'ticket_alert' THEN
      IF NOT user_preferences.ticket_alerts THEN
        RETURN NULL;
      END IF;
    WHEN 'news_alert' THEN
      IF NOT user_preferences.news_alerts THEN
        RETURN NULL;
      END IF;
    WHEN 'merchandise_alert' THEN
      IF NOT user_preferences.merchandise_alerts THEN
        RETURN NULL;
      END IF;
    ELSE
      -- Allow general notifications
  END CASE;
  
  -- Insert notification
  INSERT INTO public.notifications (
    user_id, 
    title, 
    message, 
    notification_type, 
    data, 
    scheduled_for
  )
  VALUES (
    _user_id, 
    _title, 
    _message, 
    _type, 
    _data, 
    _schedule_for
  )
  RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$;

-- Add trigger to update updated_at
CREATE TRIGGER update_notification_preferences_updated_at
  BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
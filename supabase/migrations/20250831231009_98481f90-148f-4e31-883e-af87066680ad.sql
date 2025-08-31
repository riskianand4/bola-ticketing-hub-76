-- Add foreign key relationship between news_comments and profiles
ALTER TABLE public.news_comments 
ADD CONSTRAINT news_comments_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id);
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

export const useVisitorTracking = () => {
  const location = useLocation();

  useEffect(() => {
    const trackVisitor = async () => {
      try {
        const sessionId = sessionStorage.getItem('visitor_session_id') || 
                         `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        if (!sessionStorage.getItem('visitor_session_id')) {
          sessionStorage.setItem('visitor_session_id', sessionId);
        }

        // Check if this page was already tracked in this session to avoid duplicates
        const lastTrackedPage = sessionStorage.getItem('last_tracked_page');
        const currentPage = location.pathname;
        
        if (lastTrackedPage === currentPage) {
          return; // Skip duplicate tracking for same page
        }

        sessionStorage.setItem('last_tracked_page', currentPage);

        await supabase
          .from('website_visitors')
          .insert([{
            visitor_ip: 'anonymous', // IP tracking removed for privacy
            user_agent: navigator.userAgent,
            page_path: currentPage,
            session_id: sessionId
          }]);
      } catch (error) {
        // Silently fail to avoid disrupting user experience
        console.log('Visitor tracking error:', error);
      }
    };

    trackVisitor();
  }, [location.pathname]); // Track on route change
};
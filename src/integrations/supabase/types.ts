export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      bundle_items: {
        Row: {
          bundle_id: string
          created_at: string
          id: string
          item_id: string
          item_type: string
          quantity: number
        }
        Insert: {
          bundle_id: string
          created_at?: string
          id?: string
          item_id: string
          item_type: string
          quantity?: number
        }
        Update: {
          bundle_id?: string
          created_at?: string
          id?: string
          item_id?: string
          item_type?: string
          quantity?: number
        }
        Relationships: []
      }
      cart_items: {
        Row: {
          color: string | null
          created_at: string
          id: string
          merchandise_id: string
          quantity: number
          size: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          merchandise_id: string
          quantity?: number
          size?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          merchandise_id?: string
          quantity?: number
          size?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_merchandise_id_fkey"
            columns: ["merchandise_id"]
            isOneToOne: false
            referencedRelation: "merchandise"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      gallery: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          duration: string | null
          event_date: string | null
          id: string
          image_url: string
          media_type: string | null
          thumbnail_url: string | null
          title: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          duration?: string | null
          event_date?: string | null
          id?: string
          image_url: string
          media_type?: string | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          duration?: string | null
          event_date?: string | null
          id?: string
          image_url?: string
          media_type?: string | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: []
      }
      match_events: {
        Row: {
          created_at: string
          description: string
          event_time: number
          event_type: Database["public"]["Enums"]["match_event_type"]
          id: string
          match_id: string
          player_name: string | null
          team: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          event_time: number
          event_type: Database["public"]["Enums"]["match_event_type"]
          id?: string
          match_id: string
          player_name?: string | null
          team?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          event_time?: number
          event_type?: Database["public"]["Enums"]["match_event_type"]
          id?: string
          match_id?: string
          player_name?: string | null
          team?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "match_events_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
        ]
      }
      matches: {
        Row: {
          away_score: number | null
          away_team: string
          away_team_logo: string | null
          competition: string | null
          created_at: string
          current_minute: number | null
          extra_time: number | null
          half_time_break: boolean | null
          home_score: number | null
          home_team: string
          home_team_logo: string | null
          id: string
          is_timer_active: boolean | null
          match_date: string
          match_ended_at: string | null
          match_started_at: string | null
          status: string | null
          updated_at: string
          venue: string | null
        }
        Insert: {
          away_score?: number | null
          away_team: string
          away_team_logo?: string | null
          competition?: string | null
          created_at?: string
          current_minute?: number | null
          extra_time?: number | null
          half_time_break?: boolean | null
          home_score?: number | null
          home_team: string
          home_team_logo?: string | null
          id?: string
          is_timer_active?: boolean | null
          match_date: string
          match_ended_at?: string | null
          match_started_at?: string | null
          status?: string | null
          updated_at?: string
          venue?: string | null
        }
        Update: {
          away_score?: number | null
          away_team?: string
          away_team_logo?: string | null
          competition?: string | null
          created_at?: string
          current_minute?: number | null
          extra_time?: number | null
          half_time_break?: boolean | null
          home_score?: number | null
          home_team?: string
          home_team_logo?: string | null
          id?: string
          is_timer_active?: boolean | null
          match_date?: string
          match_ended_at?: string | null
          match_started_at?: string | null
          status?: string | null
          updated_at?: string
          venue?: string | null
        }
        Relationships: []
      }
      merchandise: {
        Row: {
          category_id: string | null
          colors: string[] | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_available: boolean | null
          name: string
          price: number
          sizes: string[] | null
          stock_quantity: number | null
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          colors?: string[] | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_available?: boolean | null
          name: string
          price: number
          sizes?: string[] | null
          stock_quantity?: number | null
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          colors?: string[] | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_available?: boolean | null
          name?: string
          price?: number
          sizes?: string[] | null
          stock_quantity?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "merchandise_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "merchandise_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      merchandise_categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      merchandise_order_items: {
        Row: {
          color: string | null
          created_at: string
          id: string
          merchandise_id: string
          order_id: string
          price: number
          quantity: number
          size: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          merchandise_id: string
          order_id: string
          price: number
          quantity: number
          size?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          merchandise_id?: string
          order_id?: string
          price?: number
          quantity?: number
          size?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "merchandise_order_items_merchandise_id_fkey"
            columns: ["merchandise_id"]
            isOneToOne: false
            referencedRelation: "merchandise"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "merchandise_order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "merchandise_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      merchandise_orders: {
        Row: {
          created_at: string
          id: string
          order_status: string | null
          payment_method: string | null
          payment_reference: string | null
          payment_status: string | null
          shipping_address: string
          total_amount: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          order_status?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          payment_status?: string | null
          shipping_address: string
          total_amount: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          order_status?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          payment_status?: string | null
          shipping_address?: string
          total_amount?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "merchandise_orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      news: {
        Row: {
          author_id: string | null
          category: string | null
          content: string
          created_at: string
          excerpt: string | null
          featured_image: string | null
          id: string
          published: boolean | null
          published_at: string | null
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          category?: string | null
          content: string
          created_at?: string
          excerpt?: string | null
          featured_image?: string | null
          id?: string
          published?: boolean | null
          published_at?: string | null
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          category?: string | null
          content?: string
          created_at?: string
          excerpt?: string | null
          featured_image?: string | null
          id?: string
          published?: boolean | null
          published_at?: string | null
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "news_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      news_likes: {
        Row: {
          created_at: string
          id: string
          news_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          news_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          news_id?: string
          user_id?: string
        }
        Relationships: []
      }
      news_views: {
        Row: {
          created_at: string
          id: string
          ip_address: string | null
          news_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          ip_address?: string | null
          news_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          ip_address?: string | null
          news_id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          created_at: string | null
          goal_alerts: boolean | null
          id: string
          match_reminders: boolean | null
          merchandise_alerts: boolean | null
          news_alerts: boolean | null
          push_enabled: boolean | null
          push_token: string | null
          ticket_alerts: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          goal_alerts?: boolean | null
          id?: string
          match_reminders?: boolean | null
          merchandise_alerts?: boolean | null
          news_alerts?: boolean | null
          push_enabled?: boolean | null
          push_token?: string | null
          ticket_alerts?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          goal_alerts?: boolean | null
          id?: string
          match_reminders?: boolean | null
          merchandise_alerts?: boolean | null
          news_alerts?: boolean | null
          push_enabled?: boolean | null
          push_token?: string | null
          ticket_alerts?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          action_url: string | null
          created_at: string
          data: Json | null
          id: string
          is_read: boolean
          message: string
          notification_type:
            | Database["public"]["Enums"]["notification_type"]
            | null
          push_sent: boolean | null
          scheduled_for: string | null
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          action_url?: string | null
          created_at?: string
          data?: Json | null
          id?: string
          is_read?: boolean
          message: string
          notification_type?:
            | Database["public"]["Enums"]["notification_type"]
            | null
          push_sent?: boolean | null
          scheduled_for?: string | null
          title: string
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          action_url?: string | null
          created_at?: string
          data?: Json | null
          id?: string
          is_read?: boolean
          message?: string
          notification_type?:
            | Database["public"]["Enums"]["notification_type"]
            | null
          push_sent?: boolean | null
          scheduled_for?: string | null
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      players: {
        Row: {
          achievements: string[] | null
          bio: string | null
          created_at: string
          date_of_birth: string | null
          experience_years: number | null
          height: number | null
          id: string
          is_active: boolean | null
          jersey_number: number | null
          name: string
          nationality: string | null
          photo_url: string | null
          player_type: string | null
          position: string
          role_title: string | null
          sort_order: number | null
          updated_at: string
          weight: number | null
        }
        Insert: {
          achievements?: string[] | null
          bio?: string | null
          created_at?: string
          date_of_birth?: string | null
          experience_years?: number | null
          height?: number | null
          id?: string
          is_active?: boolean | null
          jersey_number?: number | null
          name: string
          nationality?: string | null
          photo_url?: string | null
          player_type?: string | null
          position: string
          role_title?: string | null
          sort_order?: number | null
          updated_at?: string
          weight?: number | null
        }
        Update: {
          achievements?: string[] | null
          bio?: string | null
          created_at?: string
          date_of_birth?: string | null
          experience_years?: number | null
          height?: number | null
          id?: string
          is_active?: boolean | null
          jersey_number?: number | null
          name?: string
          nationality?: string | null
          photo_url?: string | null
          player_type?: string | null
          position?: string
          role_title?: string | null
          sort_order?: number | null
          updated_at?: string
          weight?: number | null
        }
        Relationships: []
      }
      price_alerts: {
        Row: {
          created_at: string
          current_price: number
          id: string
          is_active: boolean | null
          merchandise_id: string
          target_price: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_price: number
          id?: string
          is_active?: boolean | null
          merchandise_id: string
          target_price: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_price?: number
          id?: string
          is_active?: boolean | null
          merchandise_id?: string
          target_price?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      product_bundles: {
        Row: {
          bundle_price: number
          created_at: string
          description: string | null
          discount_percentage: number | null
          id: string
          is_active: boolean | null
          name: string
          original_price: number
          updated_at: string
          valid_from: string
          valid_until: string | null
        }
        Insert: {
          bundle_price: number
          created_at?: string
          description?: string | null
          discount_percentage?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          original_price: number
          updated_at?: string
          valid_from?: string
          valid_until?: string | null
        }
        Update: {
          bundle_price?: number
          created_at?: string
          description?: string | null
          discount_percentage?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          original_price?: number
          updated_at?: string
          valid_from?: string
          valid_until?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          created_at: string
          email_notifications: boolean | null
          emergency_contact: string | null
          full_name: string | null
          id: string
          id_number: string | null
          phone: string | null
          push_notifications: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          created_at?: string
          email_notifications?: boolean | null
          emergency_contact?: string | null
          full_name?: string | null
          id?: string
          id_number?: string | null
          phone?: string | null
          push_notifications?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          created_at?: string
          email_notifications?: boolean | null
          emergency_contact?: string | null
          full_name?: string | null
          id?: string
          id_number?: string | null
          phone?: string | null
          push_notifications?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      promo_codes: {
        Row: {
          code: string
          created_at: string
          created_by: string | null
          description: string | null
          discount_type: string
          discount_value: number
          id: string
          is_active: boolean | null
          max_discount_amount: number | null
          min_purchase_amount: number | null
          name: string
          promo_type: string
          updated_at: string
          usage_limit: number | null
          used_count: number | null
          valid_from: string
          valid_until: string
        }
        Insert: {
          code: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          discount_type: string
          discount_value: number
          id?: string
          is_active?: boolean | null
          max_discount_amount?: number | null
          min_purchase_amount?: number | null
          name: string
          promo_type: string
          updated_at?: string
          usage_limit?: number | null
          used_count?: number | null
          valid_from?: string
          valid_until: string
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          discount_type?: string
          discount_value?: number
          id?: string
          is_active?: boolean | null
          max_discount_amount?: number | null
          min_purchase_amount?: number | null
          name?: string
          promo_type?: string
          updated_at?: string
          usage_limit?: number | null
          used_count?: number | null
          valid_from?: string
          valid_until?: string
        }
        Relationships: []
      }
      scanner_users: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          is_active: boolean | null
          password_hash: string
          updated_at: string
          username: string
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id?: string
          is_active?: boolean | null
          password_hash: string
          updated_at?: string
          username: string
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          is_active?: boolean | null
          password_hash?: string
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
      ticket_orders: {
        Row: {
          created_at: string
          customer_email: string
          customer_name: string
          customer_phone: string
          id: string
          order_date: string
          payment_method: string | null
          payment_reference: string | null
          payment_status: string | null
          quantity: number
          ticket_id: string
          total_amount: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          customer_email: string
          customer_name: string
          customer_phone: string
          id?: string
          order_date?: string
          payment_method?: string | null
          payment_reference?: string | null
          payment_status?: string | null
          quantity: number
          ticket_id: string
          total_amount: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          customer_email?: string
          customer_name?: string
          customer_phone?: string
          id?: string
          order_date?: string
          payment_method?: string | null
          payment_reference?: string | null
          payment_status?: string | null
          quantity?: number
          ticket_id?: string
          total_amount?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_orders_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_scans: {
        Row: {
          created_at: string
          id: string
          scanned_at: string
          scanner_user_id: string | null
          ticket_order_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          scanned_at?: string
          scanner_user_id?: string | null
          ticket_order_id: string
        }
        Update: {
          created_at?: string
          id?: string
          scanned_at?: string
          scanner_user_id?: string | null
          ticket_order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_scans_ticket_order_id_fkey"
            columns: ["ticket_order_id"]
            isOneToOne: false
            referencedRelation: "ticket_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      tickets: {
        Row: {
          available_quantity: number
          created_at: string
          description: string | null
          id: string
          match_id: string | null
          price: number
          ticket_type: string
          total_quantity: number
          updated_at: string
        }
        Insert: {
          available_quantity: number
          created_at?: string
          description?: string | null
          id?: string
          match_id?: string | null
          price: number
          ticket_type: string
          total_quantity: number
          updated_at?: string
        }
        Update: {
          available_quantity?: number
          created_at?: string
          description?: string | null
          id?: string
          match_id?: string | null
          price?: number
          ticket_type?: string
          total_quantity?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tickets_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      website_visitors: {
        Row: {
          created_at: string | null
          id: string
          page_path: string | null
          session_id: string | null
          user_agent: string | null
          visitor_ip: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          page_path?: string | null
          session_id?: string | null
          user_agent?: string | null
          visitor_ip?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          page_path?: string | null
          session_id?: string | null
          user_agent?: string | null
          visitor_ip?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_create_scanner_user: {
        Args: { _full_name?: string; _password: string; _username: string }
        Returns: {
          message: string
          success: boolean
          user_id: string
        }[]
      }
      admin_delete_scanner_user: {
        Args: { _user_id: string }
        Returns: {
          message: string
          success: boolean
        }[]
      }
      admin_delete_user: {
        Args: { _user_id: string }
        Returns: undefined
      }
      admin_list_users: {
        Args: Record<PropertyKey, never>
        Returns: {
          created_at: string
          email: string
          id: string
        }[]
      }
      admin_update_scanner_user: {
        Args: {
          _full_name?: string
          _is_active?: boolean
          _password?: string
          _user_id: string
          _username: string
        }
        Returns: {
          message: string
          success: boolean
        }[]
      }
      armor: {
        Args: { "": string }
        Returns: string
      }
      authenticate_scanner_user: {
        Args: { _password: string; _username: string }
        Returns: {
          full_name: string
          id: string
          is_active: boolean
          username: string
        }[]
      }
      check_price_alerts: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cleanup_duplicate_roles: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      dearmor: {
        Args: { "": string }
        Returns: string
      }
      gen_random_bytes: {
        Args: { "": number }
        Returns: string
      }
      gen_random_uuid: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      gen_salt: {
        Args: { "": string }
        Returns: string
      }
      get_news_statistics: {
        Args: Record<PropertyKey, never>
        Returns: {
          category: string
          created_at: string
          news_id: string
          title: string
          total_likes: number
          total_views: number
        }[]
      }
      get_total_users: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_match_timer: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      increment_promo_usage: {
        Args: { _promo_id: string }
        Returns: undefined
      }
      pgp_armor_headers: {
        Args: { "": string }
        Returns: Record<string, unknown>[]
      }
      pgp_key_id: {
        Args: { "": string }
        Returns: string
      }
      scan_ticket: {
        Args: { _scanner_user_id?: string; _ticket_order_id: string }
        Returns: {
          message: string
          success: boolean
          ticket_info: Json
        }[]
      }
      send_notification: {
        Args: {
          _action_url?: string
          _message: string
          _title: string
          _type?: string
          _user_id: string
        }
        Returns: string
      }
      send_push_notification: {
        Args: {
          _data?: Json
          _message: string
          _schedule_for?: string
          _title: string
          _type?: Database["public"]["Enums"]["notification_type"]
          _user_id: string
        }
        Returns: string
      }
      update_match_timer: {
        Args: { _action: string; _extra_minutes?: number; _match_id: string }
        Returns: {
          match_data: Json
          message: string
          success: boolean
        }[]
      }
      validate_promo_code: {
        Args: { _code: string; _promo_type: string; _purchase_amount: number }
        Returns: {
          discount_amount: number
          message: string
          promo_id: string
          valid: boolean
        }[]
      }
    }
    Enums: {
      app_role: "user" | "admin" | "super_admin"
      match_event_type:
        | "goal"
        | "yellow_card"
        | "red_card"
        | "substitution"
        | "half_time"
        | "full_time"
        | "commentary"
      notification_type:
        | "general"
        | "match_reminder"
        | "goal_alert"
        | "ticket_alert"
        | "news_alert"
        | "merchandise_alert"
        | "payment_confirmation"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["user", "admin", "super_admin"],
      match_event_type: [
        "goal",
        "yellow_card",
        "red_card",
        "substitution",
        "half_time",
        "full_time",
        "commentary",
      ],
      notification_type: [
        "general",
        "match_reminder",
        "goal_alert",
        "ticket_alert",
        "news_alert",
        "merchandise_alert",
        "payment_confirmation",
      ],
    },
  },
} as const

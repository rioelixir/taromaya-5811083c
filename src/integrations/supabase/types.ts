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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      accuracy_reference_charts: {
        Row: {
          birth_input: Json
          category: string
          chart_config: Json
          created_at: string
          expected: Json
          id: string
          name: string
          notes: string | null
          updated_at: string
        }
        Insert: {
          birth_input: Json
          category?: string
          chart_config: Json
          created_at?: string
          expected: Json
          id?: string
          name: string
          notes?: string | null
          updated_at?: string
        }
        Update: {
          birth_input?: Json
          category?: string
          chart_config?: Json
          created_at?: string
          expected?: Json
          id?: string
          name?: string
          notes?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Update: {
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      chart_calculations: {
        Row: {
          chart_id: string | null
          config_hash: string
          created_at: string
          engine_version: string
          id: string
          payload: Json
          user_id: string
        }
        Insert: {
          chart_id?: string | null
          config_hash: string
          created_at?: string
          engine_version: string
          id?: string
          payload: Json
          user_id: string
        }
        Update: {
          chart_id?: string | null
          config_hash?: string
          created_at?: string
          engine_version?: string
          id?: string
          payload?: Json
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chart_calculations_chart_id_fkey"
            columns: ["chart_id"]
            isOneToOne: false
            referencedRelation: "saved_kundlis"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_entries: {
        Row: {
          body: string
          created_at: string
          id: string
          kind: string
          meta: Json
          mood: string | null
          tags: string[]
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          body?: string
          created_at?: string
          id?: string
          kind: string
          meta?: Json
          mood?: string | null
          tags?: string[]
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          kind?: string
          meta?: Json
          mood?: string | null
          tags?: string[]
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      meditation_presets: {
        Row: {
          ambient: string
          ambient_volume: number
          created_at: string
          exhale_ms: number
          guided: boolean
          hold_in_ms: number
          hold_out_ms: number
          id: string
          inhale_ms: number
          loop_mantra: boolean
          mantra_volume: number
          name: string
          planet: string
          target_reps: number
          updated_at: string
          user_id: string
        }
        Insert: {
          ambient?: string
          ambient_volume?: number
          created_at?: string
          exhale_ms?: number
          guided?: boolean
          hold_in_ms?: number
          hold_out_ms?: number
          id?: string
          inhale_ms?: number
          loop_mantra?: boolean
          mantra_volume?: number
          name: string
          planet: string
          target_reps?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          ambient?: string
          ambient_volume?: number
          created_at?: string
          exhale_ms?: number
          guided?: boolean
          hold_in_ms?: number
          hold_out_ms?: number
          id?: string
          inhale_ms?: number
          loop_mantra?: boolean
          mantra_volume?: number
          name?: string
          planet?: string
          target_reps?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      pdf_downloads: {
        Row: {
          created_at: string
          id: string
          kind: string
          label: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          kind: string
          label?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          label?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          terms_accepted_at: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id: string
          terms_accepted_at?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          terms_accepted_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      saved_kundlis: {
        Row: {
          ayanamsa: string
          birth_date: string
          birth_seconds: number
          birth_time: string
          chart_config: Json
          chart_style: string
          created_at: string
          elevation_m: number
          engine_version: string
          gender: string
          house_system: string
          id: string
          is_primary: boolean
          language: string
          latitude: number
          longitude: number
          name: string
          node_type: string
          place: string | null
          tz_offset: number
          unknown_time: boolean
          user_id: string
          zodiac: string
        }
        Insert: {
          ayanamsa?: string
          birth_date: string
          birth_seconds?: number
          birth_time: string
          chart_config?: Json
          chart_style?: string
          created_at?: string
          elevation_m?: number
          engine_version?: string
          gender?: string
          house_system?: string
          id?: string
          is_primary?: boolean
          language?: string
          latitude: number
          longitude: number
          name: string
          node_type?: string
          place?: string | null
          tz_offset: number
          unknown_time?: boolean
          user_id: string
          zodiac?: string
        }
        Update: {
          ayanamsa?: string
          birth_date?: string
          birth_seconds?: number
          birth_time?: string
          chart_config?: Json
          chart_style?: string
          created_at?: string
          elevation_m?: number
          engine_version?: string
          gender?: string
          house_system?: string
          id?: string
          is_primary?: boolean
          language?: string
          latitude?: number
          longitude?: number
          name?: string
          node_type?: string
          place?: string | null
          tz_offset?: number
          unknown_time?: boolean
          user_id?: string
          zodiac?: string
        }
        Relationships: []
      }
      sky_alert_dispatch: {
        Row: {
          channel: string
          created_at: string
          event_key: string
          event_time: string
          id: string
          status: string
          user_id: string
        }
        Insert: {
          channel: string
          created_at?: string
          event_key: string
          event_time: string
          id?: string
          status?: string
          user_id: string
        }
        Update: {
          channel?: string
          created_at?: string
          event_key?: string
          event_time?: string
          id?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      sky_alert_preferences: {
        Row: {
          alert_full_moon: boolean
          alert_ingress: boolean
          alert_new_moon: boolean
          alert_retrograde: boolean
          channel: string
          created_at: string
          email: string | null
          enabled: boolean
          ingress_planets: string[]
          latitude: number | null
          lead_hours: number
          longitude: number | null
          place: string | null
          timezone: string
          updated_at: string
          user_id: string
        }
        Insert: {
          alert_full_moon?: boolean
          alert_ingress?: boolean
          alert_new_moon?: boolean
          alert_retrograde?: boolean
          channel?: string
          created_at?: string
          email?: string | null
          enabled?: boolean
          ingress_planets?: string[]
          latitude?: number | null
          lead_hours?: number
          longitude?: number | null
          place?: string | null
          timezone?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          alert_full_moon?: boolean
          alert_ingress?: boolean
          alert_new_moon?: boolean
          alert_retrograde?: boolean
          channel?: string
          created_at?: string
          email?: string | null
          enabled?: boolean
          ingress_planets?: string[]
          latitude?: number | null
          lead_hours?: number
          longitude?: number | null
          place?: string | null
          timezone?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      subscription_plans: {
        Row: {
          billing_period: string
          created_at: string
          currency: string
          description: string | null
          features: Json
          id: string
          is_active: boolean
          name: string
          payment_link: string | null
          price_cents: number
          slug: string
          updated_at: string
        }
        Insert: {
          billing_period?: string
          created_at?: string
          currency?: string
          description?: string | null
          features?: Json
          id?: string
          is_active?: boolean
          name: string
          payment_link?: string | null
          price_cents?: number
          slug: string
          updated_at?: string
        }
        Update: {
          billing_period?: string
          created_at?: string
          currency?: string
          description?: string | null
          features?: Json
          id?: string
          is_active?: boolean
          name?: string
          payment_link?: string | null
          price_cents?: number
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_birth_profile: {
        Row: {
          birth_date: string
          birth_time: string
          created_at: string
          full_name: string
          gender: string | null
          id: string
          latitude: number
          longitude: number
          place: string
          tz_offset_hours: number
          updated_at: string
          user_id: string
        }
        Insert: {
          birth_date: string
          birth_time: string
          created_at?: string
          full_name: string
          gender?: string | null
          id?: string
          latitude: number
          longitude: number
          place: string
          tz_offset_hours: number
          updated_at?: string
          user_id: string
        }
        Update: {
          birth_date?: string
          birth_time?: string
          created_at?: string
          full_name?: string
          gender?: string | null
          id?: string
          latitude?: number
          longitude?: number
          place?: string
          tz_offset_hours?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_subscriptions: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          notes: string | null
          plan_id: string | null
          started_at: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          notes?: string | null
          plan_id?: string | null
          started_at?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          notes?: string | null
          plan_id?: string | null
          started_at?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_premium: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const

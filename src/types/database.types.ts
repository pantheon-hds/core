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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      challenges: {
        Row: {
          active: boolean | null
          attempts: number | null
          condition: string
          created_at: string | null
          created_by: string | null
          description: string
          game_id: number | null
          id: number
          tier: string
          title: string
          type: string | null
          verification: string
        }
        Insert: {
          active?: boolean | null
          attempts?: number | null
          condition?: string
          created_at?: string | null
          created_by?: string | null
          description: string
          game_id?: number | null
          id?: number
          tier: string
          title: string
          type?: string | null
          verification?: string
        }
        Update: {
          active?: boolean | null
          attempts?: number | null
          condition?: string
          created_at?: string | null
          created_by?: string | null
          description?: string
          game_id?: number | null
          id?: number
          tier?: string
          title?: string
          type?: string | null
          verification?: string
        }
        Relationships: [
          {
            foreignKeyName: "challenges_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challenges_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      games: {
        Row: {
          active: boolean | null
          created_at: string | null
          id: number
          steam_app_id: string
          title: string
          total_achievements: number | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          id?: number
          steam_app_id: string
          title: string
          total_achievements?: number | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          id?: number
          steam_app_id?: string
          title?: string
          total_achievements?: number | null
        }
        Relationships: []
      }
      invite_codes: {
        Row: {
          code: string
          created_at: string | null
          email: string
          id: string
          used: boolean
          used_at: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          email: string
          id?: string
          used?: boolean
          used_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          email?: string
          id?: string
          used?: boolean
          used_at?: string | null
        }
        Relationships: []
      }
      judge_applications: {
        Row: {
          admin_note: string | null
          applied_at: string | null
          game_id: number | null
          id: string
          motivation: string | null
          reviewed_at: string | null
          status: string | null
          user_id: string | null
        }
        Insert: {
          admin_note?: string | null
          applied_at?: string | null
          game_id?: number | null
          id?: string
          motivation?: string | null
          reviewed_at?: string | null
          status?: string | null
          user_id?: string | null
        }
        Update: {
          admin_note?: string | null
          applied_at?: string | null
          game_id?: number | null
          id?: string
          motivation?: string | null
          reviewed_at?: string | null
          status?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "judge_applications_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "judge_applications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      ranks: {
        Row: {
          game_id: number | null
          granted_at: string | null
          id: string
          is_test: boolean | null
          method: string
          tier: string
          user_id: string | null
        }
        Insert: {
          game_id?: number | null
          granted_at?: string | null
          id?: string
          is_test?: boolean | null
          method: string
          tier: string
          user_id?: string | null
        }
        Update: {
          game_id?: number | null
          granted_at?: string | null
          id?: string
          is_test?: boolean | null
          method?: string
          tier?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ranks_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ranks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_limits: {
        Row: {
          count: number
          endpoint: string
          ip: string
          window_start: string
        }
        Insert: {
          count?: number
          endpoint: string
          ip: string
          window_start?: string
        }
        Update: {
          count?: number
          endpoint?: string
          ip?: string
          window_start?: string
        }
        Relationships: []
      }
      statues: {
        Row: {
          challenge: string | null
          game_id: number | null
          granted_at: string | null
          id: string
          is_test: boolean | null
          is_unique: boolean | null
          tier: string
          user_id: string | null
        }
        Insert: {
          challenge?: string | null
          game_id?: number | null
          granted_at?: string | null
          id?: string
          is_test?: boolean | null
          is_unique?: boolean | null
          tier: string
          user_id?: string | null
        }
        Update: {
          challenge?: string | null
          game_id?: number | null
          granted_at?: string | null
          id?: string
          is_test?: boolean | null
          is_unique?: boolean | null
          tier?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "statues_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "statues_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      submission_judges: {
        Row: {
          assigned_at: string | null
          id: string
          is_test: boolean | null
          judge_user_id: string | null
          submission_id: string | null
          timestamp_note: string | null
          vote: string | null
          voted_at: string | null
        }
        Insert: {
          assigned_at?: string | null
          id?: string
          is_test?: boolean | null
          judge_user_id?: string | null
          submission_id?: string | null
          timestamp_note?: string | null
          vote?: string | null
          voted_at?: string | null
        }
        Update: {
          assigned_at?: string | null
          id?: string
          is_test?: boolean | null
          judge_user_id?: string | null
          submission_id?: string | null
          timestamp_note?: string | null
          vote?: string | null
          voted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "submission_judges_judge_user_id_fkey"
            columns: ["judge_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submission_judges_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      submissions: {
        Row: {
          admin_note: string | null
          challenge_id: number | null
          comment: string | null
          cooldown_until: string | null
          id: string
          is_test: boolean | null
          status: string | null
          submitted_at: string | null
          user_id: string | null
          video_url: string
          withdrawn_at: string | null
        }
        Insert: {
          admin_note?: string | null
          challenge_id?: number | null
          comment?: string | null
          cooldown_until?: string | null
          id?: string
          is_test?: boolean | null
          status?: string | null
          submitted_at?: string | null
          user_id?: string | null
          video_url: string
          withdrawn_at?: string | null
        }
        Update: {
          admin_note?: string | null
          challenge_id?: number | null
          comment?: string | null
          cooldown_until?: string | null
          id?: string
          is_test?: boolean | null
          status?: string | null
          submitted_at?: string | null
          user_id?: string | null
          video_url?: string
          withdrawn_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "submissions_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          ban_reason: string | null
          banned_until: string | null
          created_at: string | null
          id: string
          is_admin: boolean | null
          is_banned: boolean | null
          is_judge: boolean | null
          is_test: boolean | null
          judge_games: string[] | null
          profile_url: string | null
          steam_id: string
          username: string
        }
        Insert: {
          avatar_url?: string | null
          ban_reason?: string | null
          banned_until?: string | null
          created_at?: string | null
          id?: string
          is_admin?: boolean | null
          is_banned?: boolean | null
          is_judge?: boolean | null
          is_test?: boolean | null
          judge_games?: string[] | null
          profile_url?: string | null
          steam_id: string
          username: string
        }
        Update: {
          avatar_url?: string | null
          ban_reason?: string | null
          banned_until?: string | null
          created_at?: string | null
          id?: string
          is_admin?: boolean | null
          is_banned?: boolean | null
          is_judge?: boolean | null
          is_test?: boolean | null
          judge_games?: string[] | null
          profile_url?: string | null
          steam_id?: string
          username?: string
        }
        Relationships: []
      }
      votes: {
        Row: {
          id: string
          judge_id: string | null
          submission_id: string | null
          vote: boolean
          voted_at: string | null
        }
        Insert: {
          id?: string
          judge_id?: string | null
          submission_id?: string | null
          vote: boolean
          voted_at?: string | null
        }
        Update: {
          id?: string
          judge_id?: string | null
          submission_id?: string | null
          vote?: boolean
          voted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "votes_judge_id_fkey"
            columns: ["judge_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "votes_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      waitlist: {
        Row: {
          applied_at: string | null
          email: string
          id: string
          reason: string | null
          rejected_at: string | null
          rejection_reason: string | null
          status: string
        }
        Insert: {
          applied_at?: string | null
          email: string
          id?: string
          reason?: string | null
          rejected_at?: string | null
          rejection_reason?: string | null
          status?: string
        }
        Update: {
          applied_at?: string | null
          email?: string
          id?: string
          reason?: string | null
          rejected_at?: string | null
          rejection_reason?: string | null
          status?: string
        }
        Relationships: []
      }
    }
    Views: {
      public_profiles: {
        Row: {
          id: string
          username: string
          steam_id: string
          avatar_url: string | null
          created_at: string | null
          is_judge: boolean | null
        }
        Relationships: []
      }
    }
    Functions: {
      award_rank_on_approval: {
        Args: { p_user_id: string; p_challenge_id: number }
        Returns: undefined
      }
      check_rate_limit: {
        Args: {
          p_endpoint: string
          p_ip: string
          p_limit: number
          p_window_seconds?: number
        }
        Returns: boolean
      }
      get_waitlist_admin: {
        Args: { p_steam_id: string }
        Returns: {
          applied_at: string
          email: string
          id: string
          reason: string
          rejection_reason: string
          status: string
        }[]
      }
      validate_invite_code: { Args: { p_code: string }; Returns: string | null }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const

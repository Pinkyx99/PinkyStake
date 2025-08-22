import { createClient } from '@supabase/supabase-js';

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string
          balance: number
          created_at: string
          password: string
          banned_until: string | null
          ban_reason: string | null
          muted_until: string | null
          warnings: string[] | null
          level: number
          rank: string
          xp: number
          godmode_until: string | null
          is_admin: boolean
          total_wagered: number | null
          total_wins: number | null
          total_losses: number | null
        }
        Insert: {
          id?: string
          username: string
          password: string
          balance?: number
          created_at?: string
          banned_until?: string | null
          ban_reason?: string | null
          muted_until?: string | null
          warnings?: string[] | null
          level?: number
          rank?: string
          xp?: number
          godmode_until?: string | null
          is_admin?: boolean
          total_wagered?: number | null
          total_wins?: number | null
          total_losses?: number | null
        }
        Update: {
          id?: string
          username?: string
          password?: string
          balance?: number
          created_at?: string
          banned_until?: string | null
          ban_reason?: string | null
          muted_until?: string | null
          warnings?: string[] | null
          level?: number
          rank?: string
          xp?: number
          godmode_until?: string | null
          is_admin?: boolean
          total_wagered?: number | null
          total_wins?: number | null
          total_losses?: number | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          id: string
          created_at: string
          content: string
          user_id: string
          username: string
        }
        Insert: {
          id?: string
          created_at?: string
          content: string
          user_id?: string
          username: string
        }
        Update: {
          id?: string
          created_at?: string
          content?: string
          user_id?: string
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      notifications: {
        Row: {
            id: string;
            created_at: string;
            user_id: string;
            type: string;
            content: Json | null;
            is_read: boolean;
        }
        Insert: {
            id?: string;
            created_at?: string;
            user_id: string;
            type: string;
            content?: Json | null;
            is_read?: boolean;
        }
        Update: {
            id?: string;
            created_at?: string;
            user_id?: string;
            type?: string;
            content?: Json | null;
            is_read?: boolean;
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      money_rains: {
        Row: {
            id: string;
            created_at: string;
            amount: number;
            expires_at: string;
        }
        Insert: {
            id?: string;
            created_at?: string;
            amount: number;
            expires_at: string;
        }
        Update: {
            id?: string;
            created_at?: string;
            amount?: number;
            expires_at?: string;
        }
        Relationships: []
      }
      claimed_rains: {
        Row: {
            rain_id: string;
            user_id: string;
            claimed_at: string;
        }
        Insert: {
            rain_id: string;
            user_id: string;
            claimed_at?: string;
        }
        Update: {
            rain_id?: string;
            user_id?: string;
            claimed_at?: string;
        }
        Relationships: [
          {
            foreignKeyName: "claimed_rains_rain_id_fkey"
            columns: ["rain_id"]
            referencedRelation: "money_rains"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "claimed_rains_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {}
    Functions: {
      transfer_balance: {
        Args: { recipient_id: string; transfer_amount: number }
        Returns: string
      }
      claim_rain: {
        Args: { rain_id_to_claim: string }
        Returns: string
      }
    }
    Enums: {}
    CompositeTypes: {}
  }
}


const supabaseUrl = 'https://zgwbryqaxpyeavbiqbxi.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpnd2JyeXFheHB5ZWF2YmlxYnhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3Nzg4MTYsImV4cCI6MjA3MTM1NDgxNn0.6BgXSLw5RCxAEkYX1-c2o8ZsO5L8lxIKYbstPpoHgxY';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
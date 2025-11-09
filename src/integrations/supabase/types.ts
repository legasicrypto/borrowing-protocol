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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      crypto_prices: {
        Row: {
          change_24h: number | null
          id: string
          price_eur: number | null
          price_usd: number
          recorded_at: string | null
          symbol: string
        }
        Insert: {
          change_24h?: number | null
          id?: string
          price_eur?: number | null
          price_usd: number
          recorded_at?: string | null
          symbol: string
        }
        Update: {
          change_24h?: number | null
          id?: string
          price_eur?: number | null
          price_usd?: number
          recorded_at?: string | null
          symbol?: string
        }
        Relationships: []
      }
      kyc_submissions: {
        Row: {
          city: string
          country: string
          date_of_birth: string
          email: string
          first_name: string
          iban_generated: boolean | null
          id: string
          id_document_url: string | null
          last_name: string
          postal_code: string
          proof_address_url: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          selfie_url: string | null
          status: string | null
          street: string
          submitted_at: string | null
          user_id: string
        }
        Insert: {
          city: string
          country: string
          date_of_birth: string
          email: string
          first_name: string
          iban_generated?: boolean | null
          id?: string
          id_document_url?: string | null
          last_name: string
          postal_code: string
          proof_address_url?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          selfie_url?: string | null
          status?: string | null
          street: string
          submitted_at?: string | null
          user_id: string
        }
        Update: {
          city?: string
          country?: string
          date_of_birth?: string
          email?: string
          first_name?: string
          iban_generated?: boolean | null
          id?: string
          id_document_url?: string | null
          last_name?: string
          postal_code?: string
          proof_address_url?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          selfie_url?: string | null
          status?: string | null
          street?: string
          submitted_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      liquidations: {
        Row: {
          collateral_liquidated: number
          debt_repaid: number
          id: string
          liquidated_at: string | null
          liquidation_price: number
          loan_id: string
          user_id: string
        }
        Insert: {
          collateral_liquidated: number
          debt_repaid: number
          id?: string
          liquidated_at?: string | null
          liquidation_price: number
          loan_id: string
          user_id: string
        }
        Update: {
          collateral_liquidated?: number
          debt_repaid?: number
          id?: string
          liquidated_at?: string | null
          liquidation_price?: number
          loan_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "liquidations_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loan_positions"
            referencedColumns: ["id"]
          },
        ]
      }
      loan_positions: {
        Row: {
          auto_top_up: boolean | null
          borrowed_currency: string
          borrowed_usdc: number
          collateral_amount: number
          collateral_type: string
          created_at: string | null
          health_factor: number | null
          id: string
          interest_rate: number | null
          liquidation_price: number | null
          ltv_ratio: number
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          auto_top_up?: boolean | null
          borrowed_currency?: string
          borrowed_usdc: number
          collateral_amount: number
          collateral_type: string
          created_at?: string | null
          health_factor?: number | null
          id?: string
          interest_rate?: number | null
          liquidation_price?: number | null
          ltv_ratio: number
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          auto_top_up?: boolean | null
          borrowed_currency?: string
          borrowed_usdc?: number
          collateral_amount?: number
          collateral_type?: string
          created_at?: string | null
          health_factor?: number | null
          id?: string
          interest_rate?: number | null
          liquidation_price?: number | null
          ltv_ratio?: number
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          message: string
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          read?: boolean
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          first_name: string | null
          id: string
          kyc_status: string | null
          last_name: string | null
          updated_at: string | null
          wallet_address: string | null
          wallet_verified: boolean | null
        }
        Insert: {
          created_at?: string | null
          first_name?: string | null
          id: string
          kyc_status?: string | null
          last_name?: string | null
          updated_at?: string | null
          wallet_address?: string | null
          wallet_verified?: boolean | null
        }
        Update: {
          created_at?: string | null
          first_name?: string | null
          id?: string
          kyc_status?: string | null
          last_name?: string | null
          updated_at?: string | null
          wallet_address?: string | null
          wallet_verified?: boolean | null
        }
        Relationships: []
      }
      system_config: {
        Row: {
          config_key: string
          config_value: string
          id: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          config_key: string
          config_value: string
          id?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          config_key?: string
          config_value?: string
          id?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          created_at: string | null
          currency: string
          id: string
          loan_id: string | null
          status: string | null
          tx_hash: string | null
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency: string
          id?: string
          loan_id?: string | null
          status?: string | null
          tx_hash?: string | null
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string
          id?: string
          loan_id?: string | null
          status?: string | null
          tx_hash?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loan_positions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_bank_accounts: {
        Row: {
          created_at: string | null
          eur_balance: number
          eurc_balance: number
          iban_legasi: string
          iban_personal: string | null
          id: string
          updated_at: string | null
          usd_balance: number
          usd_fiat_balance: number
          user_id: string
        }
        Insert: {
          created_at?: string | null
          eur_balance?: number
          eurc_balance?: number
          iban_legasi: string
          iban_personal?: string | null
          id?: string
          updated_at?: string | null
          usd_balance?: number
          usd_fiat_balance?: number
          user_id: string
        }
        Update: {
          created_at?: string | null
          eur_balance?: number
          eurc_balance?: number
          iban_legasi?: string
          iban_personal?: string | null
          id?: string
          updated_at?: string | null
          usd_balance?: number
          usd_fiat_balance?: number
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      wire_transfers: {
        Row: {
          amount_eur: number
          completed_at: string | null
          created_at: string | null
          fees_eur: number
          from_iban: string
          id: string
          status: string
          to_iban: string
          user_id: string
        }
        Insert: {
          amount_eur: number
          completed_at?: string | null
          created_at?: string | null
          fees_eur?: number
          from_iban: string
          id?: string
          status?: string
          to_iban: string
          user_id: string
        }
        Update: {
          amount_eur?: number
          completed_at?: string | null
          created_at?: string | null
          fees_eur?: number
          from_iban?: string
          id?: string
          status?: string
          to_iban?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_iban: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
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

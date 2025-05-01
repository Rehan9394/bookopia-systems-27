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
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          id: string
          ip_address: string | null
          new_values: Json | null
          old_values: Json | null
          record_id: string | null
          table_name: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "room_cleaning_status"
            referencedColumns: ["cleaner_id"]
          },
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          adults: number
          amount_paid: number | null
          base_rate: number
          check_in_date: string
          check_out_date: string
          children: number
          commission: number
          created_at: string | null
          created_by: string | null
          guest_id: string
          id: string
          net_to_owner: number
          notes: string | null
          payment_status: Database["public"]["Enums"]["payment_status"] | null
          pending_amount: number | null
          reference: string
          room_id: string
          security_deposit: number | null
          special_requests: string | null
          status: Database["public"]["Enums"]["booking_status"] | null
          total_amount: number
          tourism_fee: number | null
          updated_at: string | null
          updated_by: string | null
          vat: number | null
        }
        Insert: {
          adults?: number
          amount_paid?: number | null
          base_rate: number
          check_in_date: string
          check_out_date: string
          children?: number
          commission: number
          created_at?: string | null
          created_by?: string | null
          guest_id: string
          id?: string
          net_to_owner: number
          notes?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"] | null
          pending_amount?: number | null
          reference: string
          room_id: string
          security_deposit?: number | null
          special_requests?: string | null
          status?: Database["public"]["Enums"]["booking_status"] | null
          total_amount: number
          tourism_fee?: number | null
          updated_at?: string | null
          updated_by?: string | null
          vat?: number | null
        }
        Update: {
          adults?: number
          amount_paid?: number | null
          base_rate?: number
          check_in_date?: string
          check_out_date?: string
          children?: number
          commission?: number
          created_at?: string | null
          created_by?: string | null
          guest_id?: string
          id?: string
          net_to_owner?: number
          notes?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"] | null
          pending_amount?: number | null
          reference?: string
          room_id?: string
          security_deposit?: number | null
          special_requests?: string | null
          status?: Database["public"]["Enums"]["booking_status"] | null
          total_amount?: number
          tourism_fee?: number | null
          updated_at?: string | null
          updated_by?: string | null
          vat?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "room_cleaning_status"
            referencedColumns: ["cleaner_id"]
          },
          {
            foreignKeyName: "bookings_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "guests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "owner_room_bookings"
            referencedColumns: ["room_id"]
          },
          {
            foreignKeyName: "bookings_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "room_cleaning_status"
            referencedColumns: ["room_id"]
          },
          {
            foreignKeyName: "bookings_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "room_cleaning_status"
            referencedColumns: ["cleaner_id"]
          },
          {
            foreignKeyName: "bookings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      cleaning_checklist_items: {
        Row: {
          completed: boolean | null
          completed_at: string | null
          created_at: string | null
          id: string
          item_name: string
          notes: string | null
          task_id: string
          updated_at: string | null
        }
        Insert: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          item_name: string
          notes?: string | null
          task_id: string
          updated_at?: string | null
        }
        Update: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          item_name?: string
          notes?: string | null
          task_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cleaning_checklist_items_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "cleaning_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cleaning_checklist_items_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "room_cleaning_status"
            referencedColumns: ["task_id"]
          },
        ]
      }
      cleaning_tasks: {
        Row: {
          assigned_to: string | null
          completed_at: string | null
          created_at: string | null
          id: string
          notes: string | null
          room_id: string
          scheduled_date: string
          scheduled_time: string | null
          status: Database["public"]["Enums"]["cleaning_status"] | null
          updated_at: string | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          room_id: string
          scheduled_date: string
          scheduled_time?: string | null
          status?: Database["public"]["Enums"]["cleaning_status"] | null
          updated_at?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          room_id?: string
          scheduled_date?: string
          scheduled_time?: string | null
          status?: Database["public"]["Enums"]["cleaning_status"] | null
          updated_at?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cleaning_tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "room_cleaning_status"
            referencedColumns: ["cleaner_id"]
          },
          {
            foreignKeyName: "cleaning_tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cleaning_tasks_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "owner_room_bookings"
            referencedColumns: ["room_id"]
          },
          {
            foreignKeyName: "cleaning_tasks_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "room_cleaning_status"
            referencedColumns: ["room_id"]
          },
          {
            foreignKeyName: "cleaning_tasks_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cleaning_tasks_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "room_cleaning_status"
            referencedColumns: ["cleaner_id"]
          },
          {
            foreignKeyName: "cleaning_tasks_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      email_templates: {
        Row: {
          active: boolean | null
          body: string
          created_at: string | null
          id: string
          name: string
          subject: string
          updated_at: string | null
          variables: Json | null
        }
        Insert: {
          active?: boolean | null
          body: string
          created_at?: string | null
          id?: string
          name: string
          subject: string
          updated_at?: string | null
          variables?: Json | null
        }
        Update: {
          active?: boolean | null
          body?: string
          created_at?: string | null
          id?: string
          name?: string
          subject?: string
          updated_at?: string | null
          variables?: Json | null
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          category: Database["public"]["Enums"]["expense_category"]
          created_at: string | null
          created_by: string | null
          date: string
          description: string
          id: string
          notes: string | null
          owner_id: string | null
          payment_method: string | null
          property_id: string | null
          receipt_url: string | null
          room_id: string | null
          updated_at: string | null
          updated_by: string | null
          vendor: string | null
        }
        Insert: {
          amount: number
          category: Database["public"]["Enums"]["expense_category"]
          created_at?: string | null
          created_by?: string | null
          date: string
          description: string
          id?: string
          notes?: string | null
          owner_id?: string | null
          payment_method?: string | null
          property_id?: string | null
          receipt_url?: string | null
          room_id?: string | null
          updated_at?: string | null
          updated_by?: string | null
          vendor?: string | null
        }
        Update: {
          amount?: number
          category?: Database["public"]["Enums"]["expense_category"]
          created_at?: string | null
          created_by?: string | null
          date?: string
          description?: string
          id?: string
          notes?: string | null
          owner_id?: string | null
          payment_method?: string | null
          property_id?: string | null
          receipt_url?: string | null
          room_id?: string | null
          updated_at?: string | null
          updated_by?: string | null
          vendor?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expenses_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "room_cleaning_status"
            referencedColumns: ["cleaner_id"]
          },
          {
            foreignKeyName: "expenses_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "owner_room_bookings"
            referencedColumns: ["owner_id"]
          },
          {
            foreignKeyName: "expenses_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "owners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "owner_room_bookings"
            referencedColumns: ["property_id"]
          },
          {
            foreignKeyName: "expenses_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "room_cleaning_status"
            referencedColumns: ["property_id"]
          },
          {
            foreignKeyName: "expenses_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "owner_room_bookings"
            referencedColumns: ["room_id"]
          },
          {
            foreignKeyName: "expenses_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "room_cleaning_status"
            referencedColumns: ["room_id"]
          },
          {
            foreignKeyName: "expenses_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "room_cleaning_status"
            referencedColumns: ["cleaner_id"]
          },
          {
            foreignKeyName: "expenses_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      guests: {
        Row: {
          address: string | null
          city: string | null
          country: string | null
          created_at: string | null
          email: string | null
          first_name: string
          id: string
          id_document_url: string | null
          last_name: string
          nationality: string | null
          notes: string | null
          passport_number: string | null
          phone: string | null
          state: string | null
          updated_at: string | null
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          email?: string | null
          first_name: string
          id?: string
          id_document_url?: string | null
          last_name: string
          nationality?: string | null
          notes?: string | null
          passport_number?: string | null
          phone?: string | null
          state?: string | null
          updated_at?: string | null
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string
          id?: string
          id_document_url?: string | null
          last_name?: string
          nationality?: string | null
          notes?: string | null
          passport_number?: string | null
          phone?: string | null
          state?: string | null
          updated_at?: string | null
          zip_code?: string | null
        }
        Relationships: []
      }
      maintenance_records: {
        Row: {
          assigned_to: string | null
          cost: number | null
          created_at: string | null
          created_by: string | null
          id: string
          issue_description: string
          priority: string | null
          reported_date: string
          resolution_notes: string | null
          resolved_date: string | null
          room_id: string
          status: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          assigned_to?: string | null
          cost?: number | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          issue_description: string
          priority?: string | null
          reported_date?: string
          resolution_notes?: string | null
          resolved_date?: string | null
          room_id: string
          status?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          assigned_to?: string | null
          cost?: number | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          issue_description?: string
          priority?: string | null
          reported_date?: string
          resolution_notes?: string | null
          resolved_date?: string | null
          room_id?: string
          status?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_records_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "room_cleaning_status"
            referencedColumns: ["cleaner_id"]
          },
          {
            foreignKeyName: "maintenance_records_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_records_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "owner_room_bookings"
            referencedColumns: ["room_id"]
          },
          {
            foreignKeyName: "maintenance_records_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "room_cleaning_status"
            referencedColumns: ["room_id"]
          },
          {
            foreignKeyName: "maintenance_records_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_records_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "room_cleaning_status"
            referencedColumns: ["cleaner_id"]
          },
          {
            foreignKeyName: "maintenance_records_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          owner_id: string | null
          title: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          owner_id?: string | null
          title: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          owner_id?: string | null
          title?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "owner_room_bookings"
            referencedColumns: ["owner_id"]
          },
          {
            foreignKeyName: "notifications_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "owners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "room_cleaning_status"
            referencedColumns: ["cleaner_id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      owner_financial_info: {
        Row: {
          account_number: string | null
          bank_name: string | null
          commission_rate: number | null
          created_at: string | null
          iban: string | null
          id: string
          owner_id: string
          payment_method: string | null
          swift: string | null
          tax_id: string | null
          tax_residence: string | null
          updated_at: string | null
        }
        Insert: {
          account_number?: string | null
          bank_name?: string | null
          commission_rate?: number | null
          created_at?: string | null
          iban?: string | null
          id?: string
          owner_id: string
          payment_method?: string | null
          swift?: string | null
          tax_id?: string | null
          tax_residence?: string | null
          updated_at?: string | null
        }
        Update: {
          account_number?: string | null
          bank_name?: string | null
          commission_rate?: number | null
          created_at?: string | null
          iban?: string | null
          id?: string
          owner_id?: string
          payment_method?: string | null
          swift?: string | null
          tax_id?: string | null
          tax_residence?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "owner_financial_info_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "owner_room_bookings"
            referencedColumns: ["owner_id"]
          },
          {
            foreignKeyName: "owner_financial_info_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "owners"
            referencedColumns: ["id"]
          },
        ]
      }
      owners: {
        Row: {
          address: string | null
          avatar_url: string | null
          birth_date: string | null
          citizenship: string | null
          city: string | null
          country: string | null
          created_at: string | null
          email: string
          first_name: string
          id: string
          joined_date: string | null
          last_name: string
          notes: string | null
          password: string
          phone: string | null
          state: string | null
          status: boolean | null
          updated_at: string | null
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          birth_date?: string | null
          citizenship?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          email: string
          first_name: string
          id?: string
          joined_date?: string | null
          last_name: string
          notes?: string | null
          password: string
          phone?: string | null
          state?: string | null
          status?: boolean | null
          updated_at?: string | null
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          birth_date?: string | null
          citizenship?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          email?: string
          first_name?: string
          id?: string
          joined_date?: string | null
          last_name?: string
          notes?: string | null
          password?: string
          phone?: string | null
          state?: string | null
          status?: boolean | null
          updated_at?: string | null
          zip_code?: string | null
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          booking_id: string
          created_at: string | null
          created_by: string | null
          id: string
          notes: string | null
          payment_date: string
          payment_method: string
          transaction_reference: string | null
        }
        Insert: {
          amount: number
          booking_id: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          notes?: string | null
          payment_date?: string
          payment_method: string
          transaction_reference?: string | null
        }
        Update: {
          amount?: number
          booking_id?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          notes?: string | null
          payment_date?: string
          payment_method?: string
          transaction_reference?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "owner_room_bookings"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "payments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "room_cleaning_status"
            referencedColumns: ["cleaner_id"]
          },
          {
            foreignKeyName: "payments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      properties: {
        Row: {
          active: boolean | null
          address: string
          amenities: Json | null
          city: string
          country: string
          created_at: string | null
          description: string | null
          email: string | null
          id: string
          latitude: number | null
          longitude: number | null
          name: string
          notes: string | null
          phone: string | null
          state: string
          timezone: string | null
          updated_at: string | null
          zip_code: string
        }
        Insert: {
          active?: boolean | null
          address: string
          amenities?: Json | null
          city: string
          country: string
          created_at?: string | null
          description?: string | null
          email?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name: string
          notes?: string | null
          phone?: string | null
          state: string
          timezone?: string | null
          updated_at?: string | null
          zip_code: string
        }
        Update: {
          active?: boolean | null
          address?: string
          amenities?: Json | null
          city?: string
          country?: string
          created_at?: string | null
          description?: string | null
          email?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name?: string
          notes?: string | null
          phone?: string | null
          state?: string
          timezone?: string | null
          updated_at?: string | null
          zip_code?: string
        }
        Relationships: []
      }
      room_availability: {
        Row: {
          booking_id: string | null
          created_at: string | null
          date: string
          id: string
          notes: string | null
          room_id: string
          status: Database["public"]["Enums"]["room_status"] | null
          updated_at: string | null
        }
        Insert: {
          booking_id?: string | null
          created_at?: string | null
          date: string
          id?: string
          notes?: string | null
          room_id: string
          status?: Database["public"]["Enums"]["room_status"] | null
          updated_at?: string | null
        }
        Update: {
          booking_id?: string | null
          created_at?: string | null
          date?: string
          id?: string
          notes?: string | null
          room_id?: string
          status?: Database["public"]["Enums"]["room_status"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "room_availability_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_availability_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "owner_room_bookings"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "room_availability_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "owner_room_bookings"
            referencedColumns: ["room_id"]
          },
          {
            foreignKeyName: "room_availability_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "room_cleaning_status"
            referencedColumns: ["room_id"]
          },
          {
            foreignKeyName: "room_availability_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      room_owner_assignments: {
        Row: {
          active: boolean | null
          assigned_at: string | null
          assigned_by: string | null
          id: string
          notes: string | null
          owner_id: string
          room_id: string
        }
        Insert: {
          active?: boolean | null
          assigned_at?: string | null
          assigned_by?: string | null
          id?: string
          notes?: string | null
          owner_id: string
          room_id: string
        }
        Update: {
          active?: boolean | null
          assigned_at?: string | null
          assigned_by?: string | null
          id?: string
          notes?: string | null
          owner_id?: string
          room_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_owner_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "room_cleaning_status"
            referencedColumns: ["cleaner_id"]
          },
          {
            foreignKeyName: "room_owner_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_owner_assignments_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "owner_room_bookings"
            referencedColumns: ["owner_id"]
          },
          {
            foreignKeyName: "room_owner_assignments_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "owners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_owner_assignments_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "owner_room_bookings"
            referencedColumns: ["room_id"]
          },
          {
            foreignKeyName: "room_owner_assignments_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "room_cleaning_status"
            referencedColumns: ["room_id"]
          },
          {
            foreignKeyName: "room_owner_assignments_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      room_types: {
        Row: {
          active: boolean | null
          base_rate: number
          created_at: string | null
          description: string | null
          features: Json | null
          id: string
          image_urls: string[] | null
          max_occupancy: number
          name: string
          property_id: string | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          base_rate: number
          created_at?: string | null
          description?: string | null
          features?: Json | null
          id?: string
          image_urls?: string[] | null
          max_occupancy?: number
          name: string
          property_id?: string | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          base_rate?: number
          created_at?: string | null
          description?: string | null
          features?: Json | null
          id?: string
          image_urls?: string[] | null
          max_occupancy?: number
          name?: string
          property_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "room_types_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "owner_room_bookings"
            referencedColumns: ["property_id"]
          },
          {
            foreignKeyName: "room_types_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_types_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "room_cleaning_status"
            referencedColumns: ["property_id"]
          },
        ]
      }
      rooms: {
        Row: {
          active: boolean | null
          amenities: Json | null
          base_rate: number | null
          created_at: string | null
          description: string | null
          floor: string | null
          id: string
          image_urls: string[] | null
          max_adults: number | null
          max_children: number | null
          notes: string | null
          number: string
          property_id: string
          room_type_id: string
          size: number | null
          status: Database["public"]["Enums"]["room_status"] | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          amenities?: Json | null
          base_rate?: number | null
          created_at?: string | null
          description?: string | null
          floor?: string | null
          id?: string
          image_urls?: string[] | null
          max_adults?: number | null
          max_children?: number | null
          notes?: string | null
          number: string
          property_id: string
          room_type_id: string
          size?: number | null
          status?: Database["public"]["Enums"]["room_status"] | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          amenities?: Json | null
          base_rate?: number | null
          created_at?: string | null
          description?: string | null
          floor?: string | null
          id?: string
          image_urls?: string[] | null
          max_adults?: number | null
          max_children?: number | null
          notes?: string | null
          number?: string
          property_id?: string
          room_type_id?: string
          size?: number | null
          status?: Database["public"]["Enums"]["room_status"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rooms_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "owner_room_bookings"
            referencedColumns: ["property_id"]
          },
          {
            foreignKeyName: "rooms_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rooms_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "room_cleaning_status"
            referencedColumns: ["property_id"]
          },
          {
            foreignKeyName: "rooms_room_type_id_fkey"
            columns: ["room_type_id"]
            isOneToOne: false
            referencedRelation: "room_types"
            referencedColumns: ["id"]
          },
        ]
      }
      settings: {
        Row: {
          auto_checkout: boolean | null
          booking_confirmation_template: string | null
          check_in_reminder_template: string | null
          check_out_reminder_template: string | null
          company_email: string
          company_name: string
          currency_format: string | null
          date_format: string | null
          default_check_in_time: string | null
          default_check_out_time: string | null
          default_tax_rate: number | null
          email_notifications: boolean | null
          id: number
          reminder_days: number | null
          updated_at: string | null
        }
        Insert: {
          auto_checkout?: boolean | null
          booking_confirmation_template?: string | null
          check_in_reminder_template?: string | null
          check_out_reminder_template?: string | null
          company_email: string
          company_name: string
          currency_format?: string | null
          date_format?: string | null
          default_check_in_time?: string | null
          default_check_out_time?: string | null
          default_tax_rate?: number | null
          email_notifications?: boolean | null
          id?: number
          reminder_days?: number | null
          updated_at?: string | null
        }
        Update: {
          auto_checkout?: boolean | null
          booking_confirmation_template?: string | null
          check_in_reminder_template?: string | null
          check_out_reminder_template?: string | null
          company_email?: string
          company_name?: string
          currency_format?: string | null
          date_format?: string | null
          default_check_in_time?: string | null
          default_check_out_time?: string | null
          default_tax_rate?: number | null
          email_notifications?: boolean | null
          id?: number
          reminder_days?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      sms_templates: {
        Row: {
          active: boolean | null
          content: string
          created_at: string | null
          id: string
          name: string
          updated_at: string | null
          variables: Json | null
        }
        Insert: {
          active?: boolean | null
          content: string
          created_at?: string | null
          id?: string
          name: string
          updated_at?: string | null
          variables?: Json | null
        }
        Update: {
          active?: boolean | null
          content?: string
          created_at?: string | null
          id?: string
          name?: string
          updated_at?: string | null
          variables?: Json | null
        }
        Relationships: []
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string
          first_name: string
          id: string
          last_login: string | null
          last_name: string
          password: string
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          status: boolean | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          first_name: string
          id?: string
          last_login?: string | null
          last_name: string
          password: string
          phone?: string | null
          role: Database["public"]["Enums"]["user_role"]
          status?: boolean | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          first_name?: string
          id?: string
          last_login?: string | null
          last_name?: string
          password?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          status?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      owner_room_bookings: {
        Row: {
          booking_created_at: string | null
          booking_id: string | null
          booking_reference: string | null
          booking_status: Database["public"]["Enums"]["booking_status"] | null
          check_in_date: string | null
          check_out_date: string | null
          guest_name: string | null
          net_to_owner: number | null
          owner_email: string | null
          owner_id: string | null
          owner_name: string | null
          payment_status: Database["public"]["Enums"]["payment_status"] | null
          property_id: string | null
          property_name: string | null
          room_id: string | null
          room_number: string | null
          total_amount: number | null
        }
        Relationships: []
      }
      room_cleaning_status: {
        Row: {
          cleaner_id: string | null
          cleaner_name: string | null
          cleaning_status: Database["public"]["Enums"]["cleaning_status"] | null
          last_checkout: string | null
          next_checkin: string | null
          property_id: string | null
          property_name: string | null
          room_id: string | null
          room_number: string | null
          scheduled_date: string | null
          task_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      booking_status:
        | "pending"
        | "confirmed"
        | "checked_in"
        | "checked_out"
        | "cancelled"
        | "no_show"
      cleaning_status: "pending" | "in_progress" | "completed" | "verified"
      expense_category:
        | "utilities"
        | "maintenance"
        | "supplies"
        | "personnel"
        | "marketing"
        | "taxes"
        | "insurance"
        | "other"
      payment_status: "pending" | "partial" | "paid" | "refunded"
      room_status: "available" | "occupied" | "maintenance" | "cleaning"
      user_role: "admin" | "agent"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      booking_status: [
        "pending",
        "confirmed",
        "checked_in",
        "checked_out",
        "cancelled",
        "no_show",
      ],
      cleaning_status: ["pending", "in_progress", "completed", "verified"],
      expense_category: [
        "utilities",
        "maintenance",
        "supplies",
        "personnel",
        "marketing",
        "taxes",
        "insurance",
        "other",
      ],
      payment_status: ["pending", "partial", "paid", "refunded"],
      room_status: ["available", "occupied", "maintenance", "cleaning"],
      user_role: ["admin", "agent"],
    },
  },
} as const

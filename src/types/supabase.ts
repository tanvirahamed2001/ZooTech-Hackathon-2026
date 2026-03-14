export type Database = {
  public: {
    Tables: {
      quiz_responses: {
        Row: {
          id: string;
          email: string | null;
          first_name: string | null;
          reason: string | null;
          custom_reason: string | null;
          scores: any; // jsonb
          answers: any; // jsonb
          results_url: string;
          email_sent: boolean;
          ip_address: string | null; // inet type
          user_agent: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          email?: string | null;
          first_name?: string | null;
          reason?: string | null;
          custom_reason?: string | null;
          scores: any;
          answers: any;
          results_url: string;
          email_sent?: boolean;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          first_name?: string | null;
          reason?: string | null;
          custom_reason?: string | null;
          scores?: any;
          answers?: any;
          results_url?: string;
          email_sent?: boolean;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
      };
      emails: {
        Row: {
          id: string;
          recipient: string;
          subject: string | null;
          body: string | null;
          cc: string | null;
          bcc: string | null;
          status: string;
          smtp_response: string | null;
          metadata: any | null; // jsonb
          created_at: string;
        };
        Insert: {
          id?: string;
          recipient: string;
          subject?: string | null;
          body?: string | null;
          cc?: string | null;
          bcc?: string | null;
          status?: string;
          smtp_response?: string | null;
          metadata?: any | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          recipient?: string;
          subject?: string | null;
          body?: string | null;
          cc?: string | null;
          bcc?: string | null;
          status?: string;
          smtp_response?: string | null;
          metadata?: any | null;
          created_at?: string;
        };
      };
    };
  };
};
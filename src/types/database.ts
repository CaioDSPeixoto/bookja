// Tipos gerados automaticamente pelo Supabase CLI
// Execute: npx supabase gen types typescript --project-id SEU_PROJECT_ID > src/types/database.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// Placeholder - será substituído pelos tipos gerados
export interface Database {
  public: {
    Tables: Record<string, never>
  }
}

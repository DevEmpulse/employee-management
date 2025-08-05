// utils/supabase.ts
import { createClient } from "@supabase/supabase-js";

// 🚨 Reemplazá estos valores con los de tu proyecto en https://supabase.com/dashboard
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_APP_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_APP_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);

// Test connection function
export const testSupabaseConnection = async () => {
  try {
    const { data, error } = await supabase.storage.listBuckets();
    if (error) {
      console.error('Supabase connection error:', error);
      return false;
    }
    console.log('Available buckets:', data);
    return true;
  } catch (err) {
    console.error('Connection test failed:', err);
    return false;
  }
};
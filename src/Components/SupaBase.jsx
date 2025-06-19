import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://pntxwhiydtyommmizxnr.supabase.co";

const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBudHh3aGl5ZHR5b21tbWl6eG5yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAyNTcyNDAsImV4cCI6MjA2NTgzMzI0MH0.gjBEFznfEj-Jr68IYCyontYrKzCBaPeYyo7rZ3thjw4";

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
// src/utils/supabaseClient.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || 'https://placeholder-project.supabase.co';
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 'eyPlaceholderToken';

// Safely lazy-initialize the Supabase client to prevent exceptions on compile
let supabaseClient: any = null;

export const getSupabaseClient = () => {
  if (!supabaseClient) {
    if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
      console.log('⚡ Supabase Client in sandbox simulation model (no active tokens).');
      // Return a simulated client matching Supabase API footprints so listener binds safely
      return {
        channel: (channelName: string) => ({
          on: (event: string, filter: any, callback: (payload: any) => void) => {
            console.log(`[Supabase Realtime Simulator] Registered subscription channel: ${channelName} for "${event}" schema updates`);
            // Expose a custom function to push mock events internally
            return {
              subscribe: () => {
                console.log(`[Supabase Realtime Simulator] Subscribed safely on channel: ${channelName}`);
                return { unsubscribe: () => console.log(`Unsubscribed from channel: ${channelName}`) };
              }
            };
          }
        })
      };
    }
    
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
  }
  return supabaseClient;
};

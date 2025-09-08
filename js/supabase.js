const SUPABASE_URL = 'https://wunktcfckyvkiwpisoxp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1bmt0Y2Zja3l2a2l3cGlzb3hwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzkwMzAzMTQsImV4cCI6MjA1NDYwNjMxNH0.aPB3Vduz9ugxkT0aoBAG4kv2hD4ZX6iA7yNBTjYr07s';

window.initSupabase = async function() {
  if (window.supabase) {
    console.log('Supabase client already exists, reusing it');
    return window.supabase;
  }
  
  try {
    
    const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
    
    window.supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('Supabase client initialized successfully');
    return window.supabase;
  } catch (error) {
    console.error('Error initializing Supabase client:', error);
    throw error;
  }
};
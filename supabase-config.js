// Supabase configuration
const SUPABASE_URL = 'https://zukodinaswvoijraxamu.supabase.co'; // Replace with your Supabase project URL
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1a29kaW5hc3d2b2lqcmF4YW11Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxNTcxMjAsImV4cCI6MjA5MzczMzEyMH0.20O8CpSfiMxy1zoyQoPIQLtCuunTDO4vSPAHydY4GrY'; // Replace with your Supabase anon key

// Initialize Supabase client
let supabaseClient = null;
if (window.supabase && typeof window.supabase.createClient === 'function') {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} else {
    console.error('Supabase SDK did not load correctly. Check the script tag and network connection.');
}

// Export for use in other scripts
window.supabaseClient = supabaseClient;
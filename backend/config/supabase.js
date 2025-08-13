const { createClient } = require('@supabase/supabase-js');

// Supabase client configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Create Supabase client for regular operations
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Bucket configuration
const XRAY_BUCKET = 'xray-images';

module.exports = {
  supabase,
  XRAY_BUCKET
};

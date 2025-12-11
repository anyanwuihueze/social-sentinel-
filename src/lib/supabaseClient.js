const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || 'https://kodyzhrykckevpxejbyd.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtvZHl6aHJ5a2NrZXZweGVqYnlkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUyODU2OTcsImV4cCI6MjA4MDg2MTY5N30.P9eahtzb4H31_Hvgz1pzefebv7bRI4hxj5YMT75uslE';

const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

module.exports = { supabase };

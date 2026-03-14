import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkConnection() {
  console.log('🔍 Current Supabase project URL:', supabaseUrl);
  
  try {
    // Try to get project reference
    const { data, error } = await supabase.rpc('get_supabase_ref');
    if (data) {
      console.log('🔍 Current Supabase project ref:', data);
    } else if (error) {
      console.log('⚠️ get_supabase_ref failed, trying fallback...');
      
      // Fallback: check existing tables
      const { data: tables, error: tableError } = await supabase
        .from('information_schema.tables')
        .select('table_schema, table_name')
        .eq('table_schema', 'public')
        .limit(10);
      
      if (tableError) {
        console.log('❌ Cannot access schema:', tableError.message);
        
        // Final fallback: try a simple query
        const { data: simpleData, error: simpleError } = await supabase
          .from('quiz_responses')
          .select('count(*)')
          .limit(1);
        
        if (simpleError) {
          console.log('❌ Cannot access quiz_responses:', simpleError.message);
        } else {
          console.log('✅ Connected to Supabase project with quiz_responses table');
        }
      } else {
        console.log('📋 Available tables in public schema:');
        tables.forEach(table => {
          console.log(`   - ${table.table_name}`);
        });
      }
    }
  } catch (err) {
    console.log('❌ Connection check failed:', err.message);
  }
}

checkConnection();
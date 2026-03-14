import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://pcblabmseppqwuqocftj.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBjYmxhYm1zZXBwcXd1cW9jZnRqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTU2MDA1MSwiZXhwIjoyMDY1MTM2MDUxfQ.HVdntUyZ2Ou2McKZIK-TbY_Bg41yI88f-djjqixyfec'
);

async function run() {
  const { data, error } = await supabase
    .from('pg_tables')
    .select('schemaname, tablename');

  if (error) {
    console.error('❌ Error fetching tables:', error.message);
  } else {
    console.log('✅ Connected tables:');
    data.forEach(row => {
      console.log(`→ ${row.schemaname}.${row.tablename}`);
    });
  }
}

run();
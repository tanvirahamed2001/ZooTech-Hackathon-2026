import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkTableExists(tableName) {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('count(*)')
      .limit(1);
    
    if (error) {
      console.log(`❌ Table "${tableName}" does not exist or is inaccessible`);
      console.log(`   Error: ${error.message}`);
      return false;
    }
    
    console.log(`✅ Table "${tableName}" exists and is accessible`);
    return true;
  } catch (err) {
    console.log(`❌ Table "${tableName}" check failed: ${err.message}`);
    return false;
  }
}

async function checkTableData(tableName) {
  try {
    const { data, error, count } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.log(`❌ Cannot query data from "${tableName}": ${error.message}`);
      return 0;
    }
    
    console.log(`📊 Table "${tableName}" contains ${count || 0} records`);
    return count || 0;
  } catch (err) {
    console.log(`❌ Data check failed for "${tableName}": ${err.message}`);
    return 0;
  }
}

async function checkTableSchema(tableName) {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);
    
    if (error) {
      console.log(`❌ Cannot access schema for "${tableName}": ${error.message}`);
      return null;
    }
    
    if (data && data.length > 0) {
      const columns = Object.keys(data[0]);
      console.log(`📋 Table "${tableName}" columns: ${columns.join(', ')}`);
      return columns;
    } else {
      // Try to get schema from empty table
      const { data: emptyData, error: emptyError } = await supabase
        .from(tableName)
        .select('*')
        .eq('id', '00000000-0000-0000-0000-000000000000'); // Non-existent ID
      
      if (emptyError && emptyError.message.includes('column')) {
        console.log(`📋 Table "${tableName}" exists but schema details unavailable (empty table)`);
      }
      return [];
    }
  } catch (err) {
    console.log(`❌ Schema check failed for "${tableName}": ${err.message}`);
    return null;
  }
}

async function checkRLSPolicies(tableName) {
  try {
    // Test anonymous read access
    const anonClient = createClient(supabaseUrl, process.env.VITE_SUPABASE_ANON_KEY);
    const { data, error } = await anonClient
      .from(tableName)
      .select('id')
      .limit(1);
    
    if (error) {
      console.log(`⚠️  Anonymous access to "${tableName}" failed: ${error.message}`);
      return false;
    } else {
      console.log(`✅ Anonymous access to "${tableName}" working`);
      return true;
    }
  } catch (err) {
    console.log(`❌ RLS policy check failed for "${tableName}": ${err.message}`);
    return false;
  }
}

async function testQuizResponseSample() {
  try {
    const { data, error } = await supabase
      .from('quiz_responses')
      .select('id, email, created_at, scores, results_url')
      .order('created_at', { ascending: false })
      .limit(3);
    
    if (error) {
      console.log(`❌ Cannot sample quiz_responses: ${error.message}`);
      return false;
    }
    
    if (data && data.length > 0) {
      console.log(`📝 Recent quiz_responses sample:`);
      data.forEach((record, i) => {
        console.log(`   ${i + 1}. ID: ${record.id.substring(0, 8)}... | Email: ${record.email ? 'Yes' : 'No'} | Created: ${record.created_at} | Has URL: ${record.results_url ? 'Yes' : 'No'}`);
      });
      return true;
    } else {
      console.log(`⚠️  No quiz_responses records found`);
      return false;
    }
  } catch (err) {
    console.log(`❌ Quiz response sampling failed: ${err.message}`);
    return false;
  }
}

async function testResultsURLAccess() {
  try {
    const { data, error } = await supabase
      .from('quiz_responses')
      .select('id, results_url')
      .not('results_url', 'is', null)
      .limit(1);
    
    if (error || !data || data.length === 0) {
      console.log(`⚠️  No results URLs found to test`);
      return false;
    }
    
    const testRecord = data[0];
    console.log(`🔗 Testing results URL format: ${testRecord.results_url}`);
    
    // Extract hash from URL and verify it can decode scores
    const urlParts = testRecord.results_url.split('/r/');
    if (urlParts.length === 2) {
      const hash = urlParts[1];
      try {
        const decodedScores = atob(hash);
        const scores = decodedScores.split('-').map(Number);
        if (scores.length === 4 && scores.every(s => !isNaN(s))) {
          console.log(`✅ Results URL format is valid (scores: ${scores.join(', ')})`);
          return true;
        } else {
          console.log(`❌ Results URL hash decodes to invalid scores: ${scores}`);
          return false;
        }
      } catch (decodeError) {
        console.log(`❌ Results URL hash cannot be decoded: ${decodeError.message}`);
        return false;
      }
    } else {
      console.log(`❌ Results URL format is invalid: ${testRecord.results_url}`);
      return false;
    }
  } catch (err) {
    console.log(`❌ Results URL test failed: ${err.message}`);
    return false;
  }
}

async function testUnsubscribeURLAccess() {
  try {
    const { data, error } = await supabase
      .from('quiz_responses')
      .select('id, email')
      .not('email', 'is', null)
      .limit(1);
    
    if (error || !data || data.length === 0) {
      console.log(`⚠️  No email records found to test unsubscribe URLs`);
      return false;
    }
    
    const testRecord = data[0];
    console.log(`🔗 Testing unsubscribe URL format: /u/${testRecord.id}`);
    
    // Test if we can access the record by ID (simulating unsubscribe page)
    const { data: unsubData, error: unsubError } = await supabase
      .from('quiz_responses')
      .select('id, email, unsubscribed')
      .eq('id', testRecord.id)
      .single();
    
    if (unsubError) {
      console.log(`❌ Unsubscribe URL test failed: ${unsubError.message}`);
      return false;
    } else {
      console.log(`✅ Unsubscribe URL access working (ID: ${unsubData.id.substring(0, 8)}...)`);
      return true;
    }
  } catch (err) {
    console.log(`❌ Unsubscribe URL test failed: ${err.message}`);
    return false;
  }
}

async function runIntegrityCheck() {
  console.log('🔍 STARTING DATABASE INTEGRITY CHECK\n');
  
  const results = {
    tablesExist: {},
    dataIntegrity: {},
    urlIntegrity: {},
    accessIntegrity: {},
    criticalIssues: []
  };
  
  // 1. Check table existence
  console.log('1️⃣ CHECKING TABLE EXISTENCE');
  const expectedTables = ['quiz_responses', 'emails', 'visitor_analytics'];
  
  for (const table of expectedTables) {
    results.tablesExist[table] = await checkTableExists(table);
    if (!results.tablesExist[table]) {
      results.criticalIssues.push(`Missing table: ${table}`);
    }
  }
  
  // Check for legacy table names
  console.log('\n🔍 Checking for legacy table names...');
  const legacyTables = ['email_captures'];
  for (const table of legacyTables) {
    const exists = await checkTableExists(table);
    if (exists) {
      console.log(`⚠️  Legacy table "${table}" still exists - may need migration`);
      results.criticalIssues.push(`Legacy table exists: ${table}`);
    }
  }
  
  // 2. Check data integrity
  console.log('\n2️⃣ CHECKING DATA INTEGRITY');
  for (const table of expectedTables) {
    if (results.tablesExist[table]) {
      const count = await checkTableData(table);
      results.dataIntegrity[table] = count;
      
      if (table === 'quiz_responses' && count === 0) {
        results.criticalIssues.push('quiz_responses table is empty - potential data loss');
      }
      
      await checkTableSchema(table);
    }
  }
  
  // 3. Test URL integrity
  console.log('\n3️⃣ CHECKING URL INTEGRITY');
  if (results.tablesExist['quiz_responses']) {
    results.urlIntegrity.resultsUrls = await testResultsURLAccess();
    results.urlIntegrity.unsubscribeUrls = await testUnsubscribeURLAccess();
    
    if (!results.urlIntegrity.resultsUrls) {
      results.criticalIssues.push('Results URLs are broken or invalid');
    }
    if (!results.urlIntegrity.unsubscribeUrls) {
      results.criticalIssues.push('Unsubscribe URLs are broken or invalid');
    }
  }
  
  // 4. Check RLS and access policies
  console.log('\n4️⃣ CHECKING ACCESS POLICIES');
  for (const table of expectedTables) {
    if (results.tablesExist[table]) {
      results.accessIntegrity[table] = await checkRLSPolicies(table);
      
      if (!results.accessIntegrity[table] && table === 'quiz_responses') {
        results.criticalIssues.push(`Anonymous access to ${table} is broken`);
      }
    }
  }
  
  // 5. Sample real data
  console.log('\n5️⃣ SAMPLING REAL DATA');
  if (results.tablesExist['quiz_responses']) {
    await testQuizResponseSample();
  }
  
  // Final assessment
  console.log('\n📋 INTEGRITY CHECK SUMMARY');
  console.log('================================');
  
  if (results.criticalIssues.length === 0) {
    console.log('✅ SYSTEM STATUS: FULLY FUNCTIONAL');
    console.log('   All tables exist, data is present, URLs work, access policies functional');
  } else if (results.criticalIssues.length <= 2) {
    console.log('⚠️  SYSTEM STATUS: PARTIALLY BROKEN');
    console.log('   Some issues detected but core functionality may work');
  } else {
    console.log('❌ SYSTEM STATUS: FATALLY MISALIGNED');
    console.log('   Multiple critical issues detected');
  }
  
  if (results.criticalIssues.length > 0) {
    console.log('\n🚨 CRITICAL ISSUES:');
    results.criticalIssues.forEach((issue, i) => {
      console.log(`   ${i + 1}. ${issue}`);
    });
  }
  
  console.log('\n📊 DATA SUMMARY:');
  Object.entries(results.dataIntegrity).forEach(([table, count]) => {
    console.log(`   ${table}: ${count} records`);
  });
  
  return results;
}

// Run the check
runIntegrityCheck().catch(console.error);
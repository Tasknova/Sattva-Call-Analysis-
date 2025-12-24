import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDuration() {
  try {
    // Count total records
    const { count: totalCount, error: totalError } = await supabase
      .from('call_history')
      .select('*', { count: 'exact', head: true });

    if (totalError) throw totalError;

    // Count records where exotel_duration > 30
    const { count: greaterThan30, error: durationError } = await supabase
      .from('call_history')
      .select('*', { count: 'exact', head: true })
      .gt('exotel_duration', 30);

    if (durationError) throw durationError;

    console.log('\n=== Call History Duration Analysis ===');
    console.log(`Total records in call_history: ${totalCount}`);
    console.log(`Records with exotel_duration > 30 seconds: ${greaterThan30}`);
    console.log(`Percentage: ${((greaterThan30 / totalCount) * 100).toFixed(2)}%`);
    console.log('\n');

  } catch (error) {
    console.error('Error querying database:', error.message);
  }
}

checkDuration();

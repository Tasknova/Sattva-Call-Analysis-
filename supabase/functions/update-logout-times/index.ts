import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get today's date
    const today = new Date()
    const todayStr = today.toISOString().split('T')[0]

    console.log('Updating logout times for date:', todayStr)

    // Get the last call time for each employee today
    const { data: lastCallTimes, error: queryError } = await supabase
      .rpc('get_employee_last_call_times', { target_date: todayStr })

    if (queryError) {
      console.error('Error fetching last call times:', queryError)
      throw queryError
    }

    console.log('Found last call times for', lastCallTimes?.length || 0, 'employees')

    // Update logout time for each employee
    let updatedCount = 0
    let errorCount = 0

    for (const record of lastCallTimes || []) {
      const { error: updateError } = await supabase
        .from('employee_daily_productivity')
        .update({
          logout_time: record.last_call_time,
          updated_at: new Date().toISOString()
        })
        .eq('employee_id', record.employee_id)
        .eq('date', todayStr)

      if (updateError) {
        console.error(`Error updating logout for employee ${record.employee_id}:`, updateError)
        errorCount++
      } else {
        updatedCount++
        console.log(`Updated logout time for employee ${record.employee_id}: ${record.last_call_time}`)
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        date: todayStr,
        updated: updatedCount,
        errors: errorCount,
        message: `Updated logout times for ${updatedCount} employees`
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error in update-logout-times function:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})

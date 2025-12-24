import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { formatNumber, cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { 
  Users, 
  Phone, 
  TrendingUp, 
  BarChart3,
  Download,
  User,
  Target,
  Award,
  Activity,
  ThumbsUp,
  MessageSquare,
  Calendar
} from "lucide-react";

interface Employee {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
}

export default function ManagerReportsPage() {
  const { userRole } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState<'today' | 'yesterday' | 'this_week' | 'this_month' | 'custom'>('this_month');
  const [customDateRange, setCustomDateRange] = useState({ startDate: '', endDate: '' });
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [employeeStats, setEmployeeStats] = useState<Map<string, any>>(new Map());
  const [teamOverview, setTeamOverview] = useState<any>(null);

  useEffect(() => {
    if (userRole?.company_id) {
      fetchReportData();
    }
  }, [userRole, dateFilter, customDateRange, selectedDate]);

  const getDateRange = () => {
    const now = new Date();
    let startDateStr: string;
    let endDateStr: string;

    // Format date as YYYY-MM-DD (simple date format for call_date comparison)
    const formatDateStr = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    // If a specific date is selected, use that
    if (selectedDate) {
      startDateStr = formatDateStr(selectedDate);
      endDateStr = formatDateStr(selectedDate);
    } else if (dateFilter === 'today') {
      startDateStr = formatDateStr(now);
      endDateStr = formatDateStr(now);
    } else if (dateFilter === 'yesterday') {
      const yesterday = new Date();
      yesterday.setDate(now.getDate() - 1);
      startDateStr = formatDateStr(yesterday);
      endDateStr = formatDateStr(yesterday);
    } else if (dateFilter === 'this_week') {
      // Last 7 days including today
      const weekAgo = new Date(now);
      weekAgo.setDate(now.getDate() - 6);
      startDateStr = formatDateStr(weekAgo);
      endDateStr = formatDateStr(now);
    } else if (dateFilter === 'this_month') {
      // First day of current month to last day of current month
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      startDateStr = formatDateStr(firstDayOfMonth);
      const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      endDateStr = formatDateStr(lastDayOfMonth);
    } else if (dateFilter === 'custom' && customDateRange.startDate && customDateRange.endDate) {
      startDateStr = customDateRange.startDate;
      endDateStr = customDateRange.endDate;
    } else {
      // Default to this month
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      startDateStr = formatDateStr(firstDayOfMonth);
      const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      endDateStr = formatDateStr(lastDayOfMonth);
    }

    return { startDate: startDateStr, endDate: endDateStr };
  };

  const fetchReportData = async () => {
    if (!userRole?.company_id) {
      console.log('No company_id found in userRole:', userRole);
      return;
    }

    try {
      setLoading(true);
      const { startDate, endDate } = getDateRange();
      
      console.log('==================== MANAGER REPORTS DATA FETCH ====================');
      console.log('Fetching report data for company_id:', userRole.company_id);
      console.log('Manager user_id:', userRole.user_id);
      console.log('Date Filter:', dateFilter);
      console.log('Selected Date:', selectedDate);
      console.log('Custom Date Range:', customDateRange);
      console.log('Date range CALCULATED:', { 
        startDate, 
        endDate,
        filterType: dateFilter
      });
      console.log('Start Date:', startDate, '| End Date:', endDate);

      // Get manager's data
      const { data: managerData, error: managerError } = await supabase
        .from('managers')
        .select('id')
        .eq('user_id', userRole.user_id)
        .eq('company_id', userRole.company_id)
        .single();

      if (managerError) {
        console.error('Error fetching manager data:', managerError);
        return;
      }
      
      if (!managerData) {
        console.log('No manager data found for user_id:', userRole.user_id);
        return;
      }
      
      console.log('Manager data:', managerData);

      // Fetch employees under this manager (removed is_active filter)
      const { data: employeesData, error: employeesError } = await supabase
        .from('employees')
        .select('*')
        .eq('company_id', userRole.company_id)
        .eq('manager_id', managerData.id);

      if (employeesError) {
        console.error('Error fetching employees:', employeesError);
        throw employeesError;
      }
      
      console.log('Employees fetched:', employeesData?.length || 0, employeesData);

      // Filter active employees for display
      const activeEmployees = (employeesData || []).filter(emp => emp.is_active === true);
      setEmployees(activeEmployees);
      
      console.log('Active employees:', activeEmployees.length);

      const employeeIds = (employeesData || []).map(emp => emp.user_id);
      console.log('Employee user_ids:', employeeIds);

      // Fetch calls for the period using call_date
      console.log('=== CALL HISTORY QUERY DEBUG ===');
      console.log('Date Filter:', dateFilter);
      console.log('Start Date:', startDate);
      console.log('End Date:', endDate);
      console.log('Employee IDs:', employeeIds);
      
      // Fetch all calls for employees using pagination (Supabase has 1000 row limit per request)
      let allCallsData: any[] = [];
      let from = 0;
      const batchSize = 1000;
      let hasMore = true;
      
      while (hasMore) {
        const { data, error } = await supabase
          .from('call_history')
          .select('*')
          .in('employee_id', employeeIds)
          .range(from, from + batchSize - 1);
        
        if (error) {
          console.error('Error fetching calls batch:', error);
          break;
        }
        
        if (data && data.length > 0) {
          allCallsData = [...allCallsData, ...data];
          from += batchSize;
          hasMore = data.length === batchSize;
        } else {
          hasMore = false;
        }
      }

      // Helper to extract YYYY-MM-DD from any date string
      const extractDateStr = (dateString: string): string => {
        if (!dateString) return '';
        return dateString.substring(0, 10); // Take first 10 chars: YYYY-MM-DD
      };

      // Filter calls by date range (using call_date or fallback to created_at)
      const callsData = (allCallsData || []).filter(call => {
        const dateToUse = call.call_date || call.created_at;
        if (!dateToUse) return false;
        const callDateStr = extractDateStr(dateToUse);
        const isInRange = callDateStr >= startDate && callDateStr <= endDate;
        return isInRange;
      });
      
      console.log('All calls fetched:', allCallsData?.length || 0);
      console.log('Date range filter:', startDate, 'to', endDate);
      console.log('Calls after date filter:', callsData?.length || 0);
      if (allCallsData && allCallsData.length > 0) {
        console.log('First call sample:', {
          call_date: allCallsData[0].call_date,
          extracted: extractDateStr(allCallsData[0].call_date || allCallsData[0].created_at || ''),
          inRange: allCallsData[0].call_date ? 
            (extractDateStr(allCallsData[0].call_date) >= startDate && extractDateStr(allCallsData[0].call_date) <= endDate) : 
            'no call_date'
        });
      }

      // Fetch recordings for these calls to get recording_ids
      const callIds = (callsData || []).map(call => call.id);
      let analysesData: any[] = [];
      
      // Only fetch analyses if there are calls to query
      if (callIds.length > 0) {
        // Batch the call IDs into chunks of 200 to avoid URL length limits
        const batchSize = 200;
        let allRecordings: any[] = [];
        
        for (let i = 0; i < callIds.length; i += batchSize) {
          const batch = callIds.slice(i, i + batchSize);
          const { data: recordingsData, error: recordingsError } = await supabase
            .from('recordings')
            .select('id, call_history_id')
            .in('call_history_id', batch);

          if (recordingsError) {
            console.error('Error fetching recordings batch:', recordingsError);
          } else {
            allRecordings = [...allRecordings, ...(recordingsData || [])];
          }
        }

        const recordingIds = allRecordings.map(r => r.id);
        console.log('Total recordings fetched:', allRecordings.length);
        console.log('Total recording IDs:', recordingIds.length);
        
        // Then fetch analyses using recording_ids (also batched)
        if (recordingIds.length > 0) {
          let allAnalyses: any[] = [];
          
          for (let i = 0; i < recordingIds.length; i += batchSize) {
            const batch = recordingIds.slice(i, i + batchSize);
            const { data, error: analysesError } = await supabase
              .from('analyses')
              .select(`
                *,
                recordings (
                  id,
                  call_history_id
                )
              `)
              .in('recording_id', batch);

            if (analysesError) {
              console.error('Error fetching analyses batch:', analysesError);
            } else {
              allAnalyses = [...allAnalyses, ...(data || [])];
            }
          }
          
          analysesData = allAnalyses;
        }
      }
      
      console.log('Analyses fetched:', analysesData?.length || 0, analysesData);
      
      // Create a map of call_history_id to employee_id for quick lookup
      const callIdToEmployeeMap = new Map();
      callsData?.forEach(call => {
        callIdToEmployeeMap.set(call.id, call.employee_id);
      });

      // Calculate stats for each employee
      const employeeStatsMap = new Map();
      employeesData?.forEach(employee => {
        const employeeCalls = callsData?.filter(call => call.employee_id === employee.user_id) || [];
        // Match analyses by checking if the call_history_id belongs to this employee
        const employeeAnalyses = analysesData?.filter(analysis => {
          const callHistoryId = analysis.recordings?.call_history_id;
          const employeeId = callIdToEmployeeMap.get(callHistoryId);
          return employeeId === employee.user_id;
        }) || [];

        const completedAnalyses = employeeAnalyses.filter(a => a.status?.toLowerCase() === 'completed');
        
        // Calculate talk time metrics
        // Filter calls >= 45 seconds for avg talk time
        const validCallsForAvg = employeeCalls.filter(call => (call.exotel_duration || 0) >= 45);
        const totalTalkTimeSeconds = employeeCalls.reduce((sum, call) => sum + (Number(call.exotel_duration) || 0), 0);
        const avgTalkTimeSeconds = validCallsForAvg.length > 0 
          ? validCallsForAvg.reduce((sum, call) => sum + (Number(call.exotel_duration) || 0), 0) / validCallsForAvg.length 
          : 0;
        
        // Format talk time as MM:SS
        const formatTime = (seconds: number) => {
          const mins = Math.floor(seconds / 60);
          const secs = Math.floor(seconds % 60);
          return `${mins}:${secs.toString().padStart(2, '0')}`;
        };

        // Calculate no-answer and failed counts
        const noAnswerCalls = employeeCalls.filter(c => c.outcome === 'no-answer').length;
        const failedCalls = employeeCalls.filter(c => c.outcome === 'Failed' || c.outcome === 'failed').length;
        const totalCallsCount = employeeCalls.length;

        const completedCallsCount = employeeCalls.filter(c => c.outcome === 'completed' || c.outcome === 'converted').length;
        const relevantCallsCount = employeeCalls.filter(c => (c.exotel_duration || 0) >= 30).length;
        const irrelevantCallsCount = employeeCalls.filter(c => (c.exotel_duration || 0) < 30).length;
        const analyzedCount = completedAnalyses.length;

        employeeStatsMap.set(employee.id, {
          total_calls: totalCallsCount,
          completed_calls: completedCallsCount,
          completed_percent: totalCallsCount > 0 ? ((completedCallsCount / totalCallsCount) * 100).toFixed(1) : '0',
          total_relevant: relevantCallsCount,
          relevant_percent: totalCallsCount > 0 ? ((relevantCallsCount / totalCallsCount) * 100).toFixed(1) : '0',
          total_irrelevant: irrelevantCallsCount,
          irrelevant_percent: totalCallsCount > 0 ? ((irrelevantCallsCount / totalCallsCount) * 100).toFixed(1) : '0',
          no_answer_calls: noAnswerCalls,
          no_answer_percent: totalCallsCount > 0 ? ((noAnswerCalls / totalCallsCount) * 100).toFixed(1) : '0',
          failed_calls: failedCalls,
          failed_percent: totalCallsCount > 0 ? ((failedCalls / totalCallsCount) * 100).toFixed(1) : '0',
          total_analyzed: analyzedCount,
          analyzed_percent: totalCallsCount > 0 ? ((analyzedCount / totalCallsCount) * 100).toFixed(1) : '0',
          avg_talk_time: formatTime(avgTalkTimeSeconds),
          total_talk_time: formatTime(totalTalkTimeSeconds),
          success_rate: totalCallsCount > 0 ? 
            ((completedCallsCount / totalCallsCount) * 100).toFixed(1) : 0,
          avg_call_quality: completedAnalyses.length > 0 ?
            (completedAnalyses.reduce((sum, a) => sum + (parseFloat(a.call_quality_score) || 0), 0) / completedAnalyses.length).toFixed(1) : 0,
          avg_closure_probability: completedAnalyses.length > 0 ?
            (completedAnalyses.reduce((sum, a) => sum + (parseFloat(a.closure_probability) || 0), 0) / completedAnalyses.length).toFixed(1) : 0,
          avg_script_adherence: completedAnalyses.length > 0 ?
            (completedAnalyses.reduce((sum, a) => sum + (parseFloat(a.script_adherence) || 0), 0) / completedAnalyses.length).toFixed(1) : 0,
          avg_compliance_score: completedAnalyses.length > 0 ?
            (completedAnalyses.reduce((sum, a) => sum + (parseFloat(a.compilience_expections_score) || 0), 0) / completedAnalyses.length).toFixed(1) : 0,
          avg_sentiment: completedAnalyses.length > 0 ?
            (completedAnalyses.reduce((sum, a) => sum + (parseFloat(a.sentiment_score) || 0), 0) / completedAnalyses.length).toFixed(1) : 0,
          avg_engagement: completedAnalyses.length > 0 ?
            (completedAnalyses.reduce((sum, a) => sum + (parseFloat(a.engagement_score) || 0), 0) / completedAnalyses.length).toFixed(1) : 0,
          avg_confidence: completedAnalyses.length > 0 ?
            (completedAnalyses.reduce((sum, a) => sum + ((parseFloat(a.confidence_score_executive) + parseFloat(a.confidence_score_person)) / 2 || 0), 0) / completedAnalyses.length).toFixed(1) : 0,
          total_analyses: completedAnalyses.length
        });
      });

      setEmployeeStats(employeeStatsMap);

      // Team overview
      const totalCalls = callsData?.length || 0;
      const completedCalls = callsData?.filter(c => c.outcome === 'completed' || c.outcome === 'converted').length || 0;
      const noAnswerCallsTotal = callsData?.filter(c => c.outcome === 'no-answer').length || 0;
      const failedCallsTotal = callsData?.filter(c => c.outcome === 'Failed' || c.outcome === 'failed').length || 0;
      const allCompletedAnalyses = analysesData?.filter(a => a.status?.toLowerCase() === 'completed') || [];

      console.log('Total calls in period:', totalCalls);
      console.log('Completed calls:', completedCalls);
      console.log('All calls outcomes:', callsData?.map(c => c.outcome));
      console.log('Active employees for overview:', activeEmployees.length);

      const overview = {
        total_employees: activeEmployees.length,
        total_calls: totalCalls,
        completed_calls: completedCalls,
        success_rate: totalCalls > 0 ? ((completedCalls / totalCalls) * 100).toFixed(1) : 0,
        no_answer_calls: noAnswerCallsTotal,
        no_answer_percent: totalCalls > 0 ? ((noAnswerCallsTotal / totalCalls) * 100).toFixed(1) : 0,
        failed_calls: failedCallsTotal,
        failed_percent: totalCalls > 0 ? ((failedCallsTotal / totalCalls) * 100).toFixed(1) : 0,
        avg_call_quality: allCompletedAnalyses.length > 0 ?
          (allCompletedAnalyses.reduce((sum, a) => sum + (parseFloat(a.call_quality_score) || 0), 0) / allCompletedAnalyses.length).toFixed(1) : 0,
        avg_script_adherence: allCompletedAnalyses.length > 0 ?
          (allCompletedAnalyses.reduce((sum, a) => sum + (parseFloat(a.script_adherence) || 0), 0) / allCompletedAnalyses.length).toFixed(1) : 0,
        total_analyses: allCompletedAnalyses.length
      };
      
      console.log('==================== TEAM OVERVIEW ====================');
      console.log('Team Overview:', overview);
      console.log('=======================================================');
      setTeamOverview(overview);

    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = () => {
    let csv = `Manager Report - Team Performance\n`;
    csv += `Period: ${dateFilter.replace('_', ' ').toUpperCase()}\n`;
    if (dateFilter === 'custom') {
      csv += `Date Range: ${customDateRange.startDate} to ${customDateRange.endDate}\n\n`;
    } else {
      csv += `Date: ${new Date().toISOString().split('T')[0]}\n\n`;
    }
    
    csv += `Team Overview\n`;
    csv += `Total Employees,${teamOverview?.total_employees}\n`;
    csv += `Total Calls,${teamOverview?.total_calls}\n`;
    csv += `Success Rate,${teamOverview?.success_rate}%\n\n`;

    csv += `Employee Performance\n`;
    csv += `Employee Name,Email,Total Calls,Completed,Total Relevant,Total Irrelevant,Total Analyzed,Avg Talk Time,Total Talk Time,Avg Call Quality,Avg Closure Probability,Avg Script Adherence,Avg Compliance Score\n`;
    employees.forEach(employee => {
      const stats = employeeStats.get(employee.id);
      csv += `${employee.full_name},${employee.email},${stats?.total_calls || 0},${stats?.completed_calls || 0},${stats?.total_relevant || 0},${stats?.total_irrelevant || 0},${stats?.total_analyzed || 0},${stats?.avg_talk_time || '0:00'},${stats?.total_talk_time || '0:00'},${stats?.avg_call_quality || 0},${stats?.avg_closure_probability || 0},${stats?.avg_script_adherence || 0},${stats?.avg_compliance_score || 0}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const today = new Date().toISOString().split('T')[0];
    a.download = `manager-report-${dateFilter}-${today}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Team Reports</h2>
          <p className="text-muted-foreground">Employee performance metrics and insights</p>
        </div>
        <Button onClick={exportReport} className="gap-2">
          <Download className="h-4 w-4" />
          Export Report
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">Time Period</label>
                <Select value={dateFilter} onValueChange={(value: any) => setDateFilter(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="yesterday">Yesterday</SelectItem>
                    <SelectItem value="this_week">This Week</SelectItem>
                    <SelectItem value="this_month">This Month</SelectItem>
                    <SelectItem value="custom">Custom Range</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">Or Pick a Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !selectedDate && "text-muted-foreground"
                      )}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                {selectedDate && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedDate(undefined)}
                    className="mt-2 h-8 px-2"
                  >
                    Clear Date
                  </Button>
                )}
              </div>
            </div>
            {dateFilter === 'custom' && (
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <label className="text-sm font-medium mb-2 block">Start Date</label>
                  <input
                    type="date"
                    value={customDateRange.startDate}
                    onChange={(e) => setCustomDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    max={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div className="flex-1">
                  <label className="text-sm font-medium mb-2 block">End Date</label>
                  <input
                    type="date"
                    value={customDateRange.endDate}
                    onChange={(e) => setCustomDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    max={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Team Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Size</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(teamOverview?.total_employees || 0)}</div>
            <p className="text-xs text-muted-foreground">Active employees</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Calls</CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(teamOverview?.total_calls || 0)}</div>
            <p className="text-xs text-green-600 font-medium">
              {formatNumber(teamOverview?.completed_calls || 0)} completed ({teamOverview?.success_rate || 0}%)
            </p>
          </CardContent>
        </Card>

        <Card className="bg-yellow-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">No Answer<br/><span className="text-xs font-normal">(Follow-up)</span></CardTitle>
            <Phone className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{formatNumber(teamOverview?.no_answer_calls || 0)}</div>
            <p className="text-xs text-yellow-600 font-medium">
              {teamOverview?.no_answer_percent || 0}% of total calls
            </p>
          </CardContent>
        </Card>

        <Card className="bg-red-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed Calls</CardTitle>
            <Phone className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatNumber(teamOverview?.failed_calls || 0)}</div>
            <p className="text-xs text-red-600 font-medium">
              {teamOverview?.failed_percent || 0}% of total calls
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamOverview?.success_rate || 0}%</div>
            <p className="text-xs text-muted-foreground">Connected calls</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Analyses</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(teamOverview?.total_analyses || 0)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Award className="h-4 w-4" />
              Avg Call Quality Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{teamOverview?.avg_call_quality || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Average across all analyzed calls</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Avg Script Adherence
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{teamOverview?.avg_script_adherence || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Average across all analyzed calls</p>
          </CardContent>
        </Card>
      </div>

      {/* Employee Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Employee Performance Details
          </CardTitle>
          <CardDescription>Comprehensive performance metrics for each team member (sorted by calls)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {employees
              .filter(e => e.is_active === true)
              .sort((a, b) => {
                const statsA = employeeStats.get(a.id);
                const statsB = employeeStats.get(b.id);
                return (statsB?.total_calls || 0) - (statsA?.total_calls || 0);
              })
              .map((employee, index) => {
              const stats = employeeStats.get(employee.id);
              const performanceScore = parseFloat(stats?.success_rate || '0');
              
              return (
                <div key={employee.id} className="border rounded-lg p-4">
                  {/* Employee Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center font-bold text-blue-600">
                        {index + 1}
                      </div>
                      <div>
                        <h3 className="font-semibold">{employee.full_name}</h3>
                        <p className="text-sm text-muted-foreground">{employee.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={performanceScore >= 50 ? "default" : "secondary"}>
                        {performanceScore >= 70 ? 'High Performer' : performanceScore >= 40 ? 'Good' : 'Needs Improvement'}
                      </Badge>
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-9 gap-3">
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <div className="text-xl font-bold text-blue-600">{formatNumber(stats?.total_calls || 0)}</div>
                      <p className="text-xs text-blue-600 font-medium">Total Calls</p>
                    </div>
                    <div className="bg-green-50 p-3 rounded-lg">
                      <div className="text-xl font-bold text-green-600">{formatNumber(stats?.completed_calls || 0)}</div>
                      <p className="text-xs text-green-600 font-medium">Completed ({stats?.completed_percent || 0}%)</p>
                    </div>
                    <div className="bg-teal-50 p-3 rounded-lg">
                      <div className="text-xl font-bold text-teal-600">{formatNumber(stats?.total_relevant || 0)}</div>
                      <p className="text-xs text-teal-600 font-medium">Relevant ({stats?.relevant_percent || 0}%)</p>
                    </div>
                    <div className="bg-orange-50 p-3 rounded-lg">
                      <div className="text-xl font-bold text-orange-600">{formatNumber(stats?.total_irrelevant || 0)}</div>
                      <p className="text-xs text-orange-600 font-medium">Irrelevant ({stats?.irrelevant_percent || 0}%)</p>
                    </div>
                    <div className="bg-yellow-50 p-3 rounded-lg">
                      <div className="text-xl font-bold text-yellow-600">{formatNumber(stats?.no_answer_calls || 0)}</div>
                      <p className="text-xs text-yellow-600 font-medium">No Answer ({stats?.no_answer_percent || 0}%)</p>
                    </div>
                    <div className="bg-red-50 p-3 rounded-lg">
                      <div className="text-xl font-bold text-red-600">{formatNumber(stats?.failed_calls || 0)}</div>
                      <p className="text-xs text-red-600 font-medium">Failed ({stats?.failed_percent || 0}%)</p>
                    </div>
                    <div className="bg-indigo-50 p-3 rounded-lg">
                      <div className="text-xl font-bold text-indigo-600">{formatNumber(stats?.total_analyzed || 0)}</div>
                      <p className="text-xs text-indigo-600 font-medium">Analyzed ({stats?.analyzed_percent || 0}%)</p>
                    </div>
                    <div className="bg-cyan-50 p-3 rounded-lg">
                      <div className="text-xl font-bold text-cyan-600">{stats?.avg_talk_time || '0:00'}</div>
                      <p className="text-xs text-cyan-600 font-medium">Avg Talk Time</p>
                    </div>
                    <div className="bg-purple-50 p-3 rounded-lg">
                      <div className="text-xl font-bold text-purple-600">{stats?.total_talk_time || '0:00'}</div>
                      <p className="text-xs text-purple-600 font-medium">Total Talk Time</p>
                    </div>
                  </div>

                  {/* Analysis Metrics */}
                  <div className="mt-4 pt-4 border-t">
                    <h4 className="text-sm font-semibold mb-3">Call Quality Metrics</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="text-center p-2 bg-gray-50 rounded">
                        <div className="text-lg font-bold">{stats?.avg_call_quality || 0}</div>
                        <p className="text-xs text-muted-foreground">Avg Call Quality</p>
                      </div>
                      <div className="text-center p-2 bg-gray-50 rounded">
                        <div className="text-lg font-bold">{stats?.avg_closure_probability || 0}</div>
                        <p className="text-xs text-muted-foreground">Avg Closure Probability</p>
                      </div>
                      <div className="text-center p-2 bg-gray-50 rounded">
                        <div className="text-lg font-bold">{stats?.avg_script_adherence || 0}</div>
                        <p className="text-xs text-muted-foreground">Avg Script Adherence</p>
                      </div>
                      <div className="text-center p-2 bg-gray-50 rounded">
                        <div className="text-lg font-bold">{stats?.avg_compliance_score || 0}</div>
                        <p className="text-xs text-muted-foreground">Avg Compliance Score</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            {employees.filter(e => e.is_active === true).length === 0 && (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No active employees found in your team</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


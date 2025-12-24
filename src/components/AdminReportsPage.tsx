import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  Phone, 
  TrendingUp, 
  BarChart3,
  Calendar,
  Download,
  ArrowUp,
  ArrowDown,
  Minus,
  User,
  Target,
  Award,
  Activity,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  ThumbsUp
} from "lucide-react";

interface Manager {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  employees?: Employee[];
}

interface Employee {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  manager_id: string;
}

interface CallStats {
  total_calls: number;
  completed_calls: number;
  follow_up_calls: number;
  not_interested: number;
  conversion_rate: number;
}

interface AnalysisStats {
  avg_sentiment: number;
  avg_engagement: number;
  avg_confidence: number;
  total_analyses: number;
}

export default function AdminReportsPage() {
  const { userRole, company } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState<'today' | 'yesterday' | 'this_week' | 'this_month' | 'custom'>('this_month');
  const [customDateRange, setCustomDateRange] = useState({ startDate: '', endDate: '' });
  const [managers, setManagers] = useState<Manager[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [managerStats, setManagerStats] = useState<Map<string, any>>(new Map());
  const [employeeStats, setEmployeeStats] = useState<Map<string, any>>(new Map());
  const [companyOverview, setCompanyOverview] = useState<any>(null);
  const [expandedManagers, setExpandedManagers] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (userRole?.company_id) {
      fetchReportData();
    }
  }, [userRole, dateFilter, customDateRange]);

  const toggleManagerExpanded = (managerId: string) => {
    setExpandedManagers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(managerId)) {
        newSet.delete(managerId);
      } else {
        newSet.add(managerId);
      }
      return newSet;
    });
  };

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

    if (dateFilter === 'today') {
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
      
      console.log('==================== ADMIN REPORTS DATA FETCH ====================');
      console.log('Fetching report data for company_id:', userRole.company_id);
      console.log('Date Filter:', dateFilter);
      console.log('Custom Date Range:', customDateRange);
      console.log('Date range CALCULATED:', { 
        startDate, 
        endDate,
        filterType: dateFilter
      });
      console.log('Start Date:', startDate, '| End Date:', endDate);

      // Fetch all managers (removed is_active filter to see all managers)
      const { data: managersData, error: managersError } = await supabase
        .from('managers')
        .select('*')
        .eq('company_id', userRole.company_id);

      if (managersError) {
        console.error('Error fetching managers:', managersError);
        throw managersError;
      }
      
      console.log('Managers fetched:', managersData?.length || 0, managersData);

      // Fetch all employees (removed is_active filter to see all employees)
      const { data: employeesData, error: employeesError } = await supabase
        .from('employees')
        .select('*')
        .eq('company_id', userRole.company_id);

      if (employeesError) {
        console.error('Error fetching employees:', employeesError);
        throw employeesError;
      }
      
      console.log('Employees fetched:', employeesData?.length || 0, employeesData);

      // Filter active employees and managers for display
      const activeManagers = (managersData || []).filter(mgr => mgr.is_active === true);
      const activeEmployees = (employeesData || []).filter(emp => emp.is_active === true);
      setManagers(activeManagers);
      setEmployees(activeEmployees);
      
      console.log('Active managers:', activeManagers.length);
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
      
      console.log('=== ANALYSES FETCHING DEBUG ===');
      console.log('Total call IDs to fetch recordings for:', callIds.length);
      console.log('Sample call IDs:', callIds.slice(0, 5));
      
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
        console.log('Sample recordings:', allRecordings.slice(0, 3));
        
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
      
      console.log('Total analyses fetched:', analysesData?.length || 0);
      console.log('Sample analyses:', analysesData?.slice(0, 3));

// Create a map of call_history_id to employee_id for quick lookup
      const callIdToEmployeeMap = new Map();
      callsData?.forEach(call => {
        callIdToEmployeeMap.set(call.id, call.employee_id);
      });

      // Calculate stats for each manager
      const managerStatsMap = new Map();
      managersData?.forEach(manager => {
        const managerEmployees = employeesData?.filter(emp => emp.manager_id === manager.id) || [];
        // Get user_ids of employees under this manager
        const employeeUserIds = managerEmployees.map(emp => emp.user_id);
        
        // Match calls by employee_id (which is actually user_id in call_history)
        const managerCalls = callsData?.filter(call => 
          call.employee_id && employeeUserIds.includes(call.employee_id)
        ) || [];
        
        // Match analyses by checking if the call_history_id belongs to employees under this manager
        const managerAnalyses = analysesData?.filter(analysis => {
          const callHistoryId = analysis.recordings?.call_history_id;
          const employeeId = callIdToEmployeeMap.get(callHistoryId);
          return employeeId && employeeUserIds.includes(employeeId);
        }) || [];

        const completedAnalyses = managerAnalyses.filter(a => a.status?.toLowerCase() === 'completed');
        
        // Calculate talk time metrics for manager's team
        const validCallsForAvg = managerCalls.filter(call => (call.exotel_duration || 0) >= 45);
        const totalTalkTimeSeconds = managerCalls.reduce((sum, call) => sum + (Number(call.exotel_duration) || 0), 0);
        const avgTalkTimeSeconds = validCallsForAvg.length > 0 
          ? validCallsForAvg.reduce((sum, call) => sum + (Number(call.exotel_duration) || 0), 0) / validCallsForAvg.length 
          : 0;
        
        // Format talk time as MM:SS
        const formatTime = (seconds: number) => {
          const mins = Math.floor(seconds / 60);
          const secs = Math.floor(seconds % 60);
          return `${mins}:${secs.toString().padStart(2, '0')}`;
        };

        managerStatsMap.set(manager.id, {
          total_employees: managerEmployees.length,
          total_calls: managerCalls.length,
          completed_calls: managerCalls.filter(c => c.outcome === 'completed' || c.outcome === 'converted').length,
          total_relevant: managerCalls.filter(c => (c.exotel_duration || 0) >= 30).length,
          total_irrelevant: managerCalls.filter(c => (c.exotel_duration || 0) < 30).length,
          total_analyzed: completedAnalyses.length,
          avg_talk_time: formatTime(avgTalkTimeSeconds),
          total_talk_time: formatTime(totalTalkTimeSeconds),
          success_rate: managerCalls.length > 0 ? 
            ((managerCalls.filter(c => c.outcome === 'completed' || c.outcome === 'converted').length / managerCalls.length) * 100).toFixed(1) : 0,
          avg_call_quality: completedAnalyses.length > 0 ?
            (completedAnalyses.reduce((sum, a) => sum + (parseFloat(a.call_quality_score) || 0), 0) / completedAnalyses.length).toFixed(1) : 0,
          avg_closure_probability: completedAnalyses.length > 0 ?
            (completedAnalyses.reduce((sum, a) => sum + (parseFloat(a.closure_probability) || 0), 0) / completedAnalyses.length).toFixed(1) : 0,
          avg_script_adherence: completedAnalyses.length > 0 ?
            (completedAnalyses.reduce((sum, a) => sum + (parseFloat(a.script_adherence) || 0), 0) / completedAnalyses.length).toFixed(1) : 0,
          avg_compliance_score: completedAnalyses.length > 0 ?
            (completedAnalyses.reduce((sum, a) => sum + (parseFloat(a.compilience_expections_score) || 0), 0) / completedAnalyses.length).toFixed(1) : 0,
          employees: managerEmployees
        });
      });

      setManagerStats(managerStatsMap);

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
        const validCallsForAvg = employeeCalls.filter(call => (call.exotel_duration || 0) >= 45);
        const totalTalkTimeSeconds = employeeCalls.reduce((sum, call) => sum + (Number(call.exotel_duration) || 0), 0);
        const avgTalkTimeSeconds = validCallsForAvg.length > 0 
          ? validCallsForAvg.reduce((sum, call) => sum + (Number(call.exotel_duration) || 0), 0) / validCallsForAvg.length 
          : 0;
        
        const formatTime = (seconds: number) => {
          const mins = Math.floor(seconds / 60);
          const secs = Math.floor(seconds % 60);
          return `${mins}:${secs.toString().padStart(2, '0')}`;
        };

        employeeStatsMap.set(employee.id, {
          total_calls: employeeCalls.length,
          completed_calls: employeeCalls.filter(c => c.outcome === 'completed' || c.outcome === 'converted').length,
          total_relevant: employeeCalls.filter(c => (c.exotel_duration || 0) >= 30).length,
          total_irrelevant: employeeCalls.filter(c => (c.exotel_duration || 0) < 30).length,
          total_analyzed: completedAnalyses.length,
          avg_talk_time: formatTime(avgTalkTimeSeconds),
          total_talk_time: formatTime(totalTalkTimeSeconds),
          success_rate: employeeCalls.length > 0 ? 
            ((employeeCalls.filter(c => c.outcome === 'completed' || c.outcome === 'converted').length / employeeCalls.length) * 100).toFixed(1) : 0,
          avg_call_quality: completedAnalyses.length > 0 ?
            (completedAnalyses.reduce((sum, a) => sum + (parseFloat(a.call_quality_score) || 0), 0) / completedAnalyses.length).toFixed(1) : 0,
          avg_closure_probability: completedAnalyses.length > 0 ?
            (completedAnalyses.reduce((sum, a) => sum + (parseFloat(a.closure_probability) || 0), 0) / completedAnalyses.length).toFixed(1) : 0,
          avg_script_adherence: completedAnalyses.length > 0 ?
            (completedAnalyses.reduce((sum, a) => sum + (parseFloat(a.script_adherence) || 0), 0) / completedAnalyses.length).toFixed(1) : 0,
          avg_compliance_score: completedAnalyses.length > 0 ?
            (completedAnalyses.reduce((sum, a) => sum + (parseFloat(a.compilience_expections_score) || 0), 0) / completedAnalyses.length).toFixed(1) : 0
        });
      });

      setEmployeeStats(employeeStatsMap);

      // Company overview (using already filtered active managers and employees)
      console.log('Active managers count:', activeManagers.length);
      console.log('Active employees count:', activeEmployees.length);
      
      const totalCalls = callsData?.length || 0;
      const completedCalls = callsData?.filter(c => c.outcome === 'completed' || c.outcome === 'converted').length || 0;
      const allCompletedAnalyses = analysesData?.filter(a => a.status?.toLowerCase() === 'completed') || [];

      console.log('Total calls in period:', totalCalls);
      console.log('Completed calls:', completedCalls);
      console.log('All calls outcomes:', callsData?.map(c => c.outcome));

      const overview = {
        total_managers: activeManagers.length,
        total_employees: activeEmployees.length,
        total_calls: totalCalls,
        completed_calls: completedCalls,
        success_rate: totalCalls > 0 ? ((completedCalls / totalCalls) * 100).toFixed(1) : 0,
        avg_call_quality: allCompletedAnalyses.length > 0 ?
          (allCompletedAnalyses.reduce((sum, a) => sum + (parseFloat(a.call_quality_score) || 0), 0) / allCompletedAnalyses.length).toFixed(1) : 0,
        avg_script_adherence: allCompletedAnalyses.length > 0 ?
          (allCompletedAnalyses.reduce((sum, a) => sum + (parseFloat(a.script_adherence) || 0), 0) / allCompletedAnalyses.length).toFixed(1) : 0,
        total_analyses: allCompletedAnalyses.length
      };
      
      console.log('==================== COMPANY OVERVIEW ====================');
      console.log('Company Overview:', overview);
      console.log('==========================================================');
      setCompanyOverview(overview);

    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = () => {
    let csv = `Company Report - ${company?.name}\n`;
    csv += `Period: ${dateFilter.replace('_', ' ').toUpperCase()}\n`;
    if (dateFilter === 'custom') {
      csv += `Date Range: ${customDateRange.startDate} to ${customDateRange.endDate}\n\n`;
    } else {
      csv += `Date: ${new Date().toISOString().split('T')[0]}\n\n`;
    }
    
    csv += `Company Overview\n`;
    csv += `Total Managers,${companyOverview?.total_managers}\n`;
    csv += `Total Employees,${companyOverview?.total_employees}\n`;
    csv += `Total Calls,${companyOverview?.total_calls}\n`;
    csv += `Success Rate,${companyOverview?.success_rate}%\n\n`;

    csv += `Manager Performance\n`;
    csv += `Manager Name,Email,Employees,Total Calls,Completed,Total Relevant,Total Irrelevant,Total Analyzed,Avg Talk Time,Total Talk Time,Avg Call Quality,Avg Script Adherence\n`;
    managers.forEach(manager => {
      const stats = managerStats.get(manager.id);
      csv += `${manager.full_name},${manager.email},${stats?.total_employees || 0},${stats?.total_calls || 0},${stats?.completed_calls || 0},${stats?.total_relevant || 0},${stats?.total_irrelevant || 0},${stats?.total_analyzed || 0},${stats?.avg_talk_time || '0:00'},${stats?.total_talk_time || '0:00'},${stats?.avg_call_quality || 0},${stats?.avg_script_adherence || 0}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const today = new Date().toISOString().split('T')[0];
    a.download = `admin-report-${dateFilter}-${today}.csv`;
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
      {/* Header with filters */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Admin Reports</h2>
          <p className="text-muted-foreground">Comprehensive performance reports for all managers and employees</p>
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
                    <SelectItem value="this_week">Last 7 days</SelectItem>
                    <SelectItem value="this_month">This Month</SelectItem>
                    <SelectItem value="custom">Custom Range</SelectItem>
                  </SelectContent>
                </Select>
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

      {/* Company Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Managers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{companyOverview?.total_managers || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{companyOverview?.total_employees || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Calls</CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{companyOverview?.total_calls || 0}</div>
            <p className="text-xs text-green-600 font-medium">
              {companyOverview?.completed_calls || 0} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{companyOverview?.success_rate || 0}%</div>
            <p className="text-xs text-muted-foreground">Connected calls</p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Award className="h-4 w-4" />
              Avg Call Quality Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{companyOverview?.avg_call_quality || 0}</div>
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
            <div className="text-3xl font-bold text-green-600">{companyOverview?.avg_script_adherence || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Average across all analyzed calls</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Analyses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">{companyOverview?.total_analyses || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Completed analyses</p>
          </CardContent>
        </Card>
      </div>

      {/* Manager Performance Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Manager Performance
          </CardTitle>
          <CardDescription>Detailed performance metrics for each manager and their team</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {managers.filter(m => m.is_active === true).map(manager => {
              const stats = managerStats.get(manager.id);
              const managerEmployees = employees.filter(emp => emp.manager_id === manager.id && emp.is_active === true);
              const isExpanded = expandedManagers.has(manager.id);
              const performanceScore = parseFloat(stats?.success_rate || '0');

              return (
                <Card key={manager.id}>
                  <CardContent className="pt-6">
                    {/* Manager Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{manager.full_name}</h3>
                          <p className="text-sm text-muted-foreground">{manager.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={performanceScore >= 50 ? "default" : "secondary"}>
                          {performanceScore >= 70 ? 'High Performer' : performanceScore >= 40 ? 'Good' : 'Needs Improvement'}
                        </Badge>
                      </div>
                    </div>

                    {/* Manager Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <div className="text-xl font-bold text-blue-600">{stats?.total_calls || 0}</div>
                        <p className="text-xs text-blue-600 font-medium">Total Calls</p>
                      </div>
                      <div className="bg-green-50 p-3 rounded-lg">
                        <div className="text-xl font-bold text-green-600">{stats?.completed_calls || 0}</div>
                        <p className="text-xs text-green-600 font-medium">Completed</p>
                      </div>
                      <div className="bg-teal-50 p-3 rounded-lg">
                        <div className="text-xl font-bold text-teal-600">{stats?.total_relevant || 0}</div>
                        <p className="text-xs text-teal-600 font-medium">Total Relevant</p>
                      </div>
                      <div className="bg-orange-50 p-3 rounded-lg">
                        <div className="text-xl font-bold text-orange-600">{stats?.total_irrelevant || 0}</div>
                        <p className="text-xs text-orange-600 font-medium">Total Irrelevant</p>
                      </div>
                      <div className="bg-indigo-50 p-3 rounded-lg">
                        <div className="text-xl font-bold text-indigo-600">{stats?.total_analyzed || 0}</div>
                        <p className="text-xs text-indigo-600 font-medium">Total Analyzed</p>
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

                    {/* Call Quality Metrics */}
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

                    {/* Toggle Button for Employees */}
                    {managerEmployees.length > 0 && (
                      <div className="mt-4 pt-4 border-t">
                        <Button
                          variant="ghost"
                          className="w-full flex items-center justify-between"
                          onClick={() => toggleManagerExpanded(manager.id)}
                        >
                          <span className="font-medium">
                            Team Members ({managerEmployees.length} employees)
                          </span>
                          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </Button>

                        {/* Collapsible Employee List */}
                        {isExpanded && (
                          <div className="mt-4 space-y-3">
                            {managerEmployees
                              .sort((a, b) => {
                                const statsA = employeeStats.get(a.id);
                                const statsB = employeeStats.get(b.id);
                                return (statsB?.total_calls || 0) - (statsA?.total_calls || 0);
                              })
                              .map(employee => {
                              const empStats = employeeStats.get(employee.id);
                              return (
                                <div key={employee.id} className="border rounded-lg p-4 bg-white">
                                  <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                        <User className="h-4 w-4 text-blue-600" />
                                      </div>
                                      <div>
                                        <p className="font-medium text-sm">{employee.full_name}</p>
                                        <p className="text-xs text-muted-foreground">{employee.email}</p>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Employee Stats Grid */}
                                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
                                    <div className="text-center p-2 bg-blue-50 rounded">
                                      <div className="font-bold text-blue-600">{empStats?.total_calls || 0}</div>
                                      <div className="text-xs text-blue-600">Total Calls</div>
                                    </div>
                                    <div className="text-center p-2 bg-green-50 rounded">
                                      <div className="font-bold text-green-600">{empStats?.completed_calls || 0}</div>
                                      <div className="text-xs text-green-600">Completed</div>
                                    </div>
                                    <div className="text-center p-2 bg-teal-50 rounded">
                                      <div className="font-bold text-teal-600">{empStats?.total_relevant || 0}</div>
                                      <div className="text-xs text-teal-600">Relevant</div>
                                    </div>
                                    <div className="text-center p-2 bg-orange-50 rounded">
                                      <div className="font-bold text-orange-600">{empStats?.total_irrelevant || 0}</div>
                                      <div className="text-xs text-orange-600">Irrelevant</div>
                                    </div>
                                    <div className="text-center p-2 bg-indigo-50 rounded">
                                      <div className="font-bold text-indigo-600">{empStats?.total_analyzed || 0}</div>
                                      <div className="text-xs text-indigo-600">Analyzed</div>
                                    </div>
                                    <div className="text-center p-2 bg-cyan-50 rounded">
                                      <div className="font-bold text-cyan-600">{empStats?.avg_talk_time || '0:00'}</div>
                                      <div className="text-xs text-cyan-600">Avg Time</div>
                                    </div>
                                    <div className="text-center p-2 bg-purple-50 rounded">
                                      <div className="font-bold text-purple-600">{empStats?.total_talk_time || '0:00'}</div>
                                      <div className="text-xs text-purple-600">Total Time</div>
                                    </div>
                                  </div>

                                  {/* Employee Call Quality Metrics */}
                                  <div className="mt-3 pt-3 border-t">
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                      <div className="text-center p-2 bg-gray-50 rounded">
                                        <div className="text-sm font-bold">{empStats?.avg_call_quality || 0}</div>
                                        <div className="text-xs text-muted-foreground">Call Quality</div>
                                      </div>
                                      <div className="text-center p-2 bg-gray-50 rounded">
                                        <div className="text-sm font-bold">{empStats?.avg_closure_probability || 0}</div>
                                        <div className="text-xs text-muted-foreground">Closure Prob.</div>
                                      </div>
                                      <div className="text-center p-2 bg-gray-50 rounded">
                                        <div className="text-sm font-bold">{empStats?.avg_script_adherence || 0}</div>
                                        <div className="text-xs text-muted-foreground">Script Adh.</div>
                                      </div>
                                      <div className="text-center p-2 bg-gray-50 rounded">
                                        <div className="text-sm font-bold">{empStats?.avg_compliance_score || 0}</div>
                                        <div className="text-xs text-muted-foreground">Compliance</div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
            {managers.filter(m => m.is_active === true).length === 0 && (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No active managers found</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Clock, TrendingUp, Calendar as CalendarIcon } from "lucide-react";
import { format, parseISO, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";

export default function Logs() {
  const [filterPeriod, setFilterPeriod] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['allLogs'],
    queryFn: async () => {
      // Backend now uses session to filter by user automatically
      return base44.entities.IntakeLog.filter({}, '-created_date');
    },
    initialData: [],
  });

  const filterLogsByPeriod = (logs) => {
    if (filterPeriod === "all") return logs;
    
    const now = new Date();
    let start, end;

    switch (filterPeriod) {
      case "today":
        return logs.filter(log => log.intake_date === format(now, 'yyyy-MM-dd'));
      case "week":
        start = startOfWeek(now);
        end = endOfWeek(now);
        break;
      case "month":
        start = startOfMonth(now);
        end = endOfMonth(now);
        break;
      default:
        return logs;
    }

    return logs.filter(log => {
      const logDate = parseISO(log.intake_date);
      return isWithinInterval(logDate, { start, end });
    });
  };

  const filteredLogs = filterLogsByPeriod(logs).filter(log => 
    filterStatus === "all" || log.status === filterStatus
  );

  const takenCount = filteredLogs.filter(log => log.status === 'taken').length;
  const missedCount = filteredLogs.filter(log => log.status === 'missed').length;
  const skippedCount = filteredLogs.filter(log => log.status === 'skipped').length;
  const complianceRate = filteredLogs.length > 0 
    ? ((takenCount / filteredLogs.length) * 100).toFixed(1) 
    : 0;

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-blue-50 via-white to-green-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Intake Logs</h1>
          <p className="text-gray-600 mt-2 text-lg">Track your medicine intake history</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="shadow-lg border-none">
            <CardContent className="p-6 text-center">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <p className="text-3xl font-bold text-gray-900">{takenCount}</p>
              <p className="text-sm text-gray-600 mt-1">Taken</p>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-none">
            <CardContent className="p-6 text-center">
              <XCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
              <p className="text-3xl font-bold text-gray-900">{missedCount}</p>
              <p className="text-sm text-gray-600 mt-1">Missed</p>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-none">
            <CardContent className="p-6 text-center">
              <Clock className="w-12 h-12 text-gray-500 mx-auto mb-3" />
              <p className="text-3xl font-bold text-gray-900">{skippedCount}</p>
              <p className="text-sm text-gray-600 mt-1">Skipped</p>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-none bg-gradient-to-br from-blue-500 to-green-500 text-white">
            <CardContent className="p-6 text-center">
              <TrendingUp className="w-12 h-12 mx-auto mb-3" />
              <p className="text-3xl font-bold">{complianceRate}%</p>
              <p className="text-sm mt-1">Compliance</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="shadow-lg border-none mb-6">
          <CardContent className="p-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Time Period</label>
                <Select value={filterPeriod} onValueChange={setFilterPeriod}>
                  <SelectTrigger className="text-lg py-6">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Status</label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="text-lg py-6">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="taken">Taken</SelectItem>
                    <SelectItem value="missed">Missed</SelectItem>
                    <SelectItem value="skipped">Skipped</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Logs List */}
        <Card className="shadow-lg border-none">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <CalendarIcon className="w-6 h-6 text-blue-600" />
              Intake History ({filteredLogs.length} records)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-500 mt-4">Loading logs...</p>
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="text-center py-16">
                <Clock className="w-24 h-24 text-gray-300 mx-auto mb-4" />
                <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                  No logs found
                </h3>
                <p className="text-gray-600 text-lg">
                  {filterPeriod !== "all" || filterStatus !== "all"
                    ? "Try adjusting your filters"
                    : "Start tracking your medicine intake"}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredLogs.map((log) => (
                  <div 
                    key={log.id}
                    className={`p-5 rounded-xl border-l-4 ${
                      log.status === 'taken'
                        ? 'border-green-500 bg-green-50'
                        : log.status === 'missed'
                        ? 'border-red-500 bg-red-50'
                        : 'border-gray-500 bg-gray-50'
                    }`}
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div className="flex items-start gap-4">
                        {log.status === 'taken' ? (
                          <CheckCircle className="w-8 h-8 text-green-600 flex-shrink-0" />
                        ) : log.status === 'missed' ? (
                          <XCircle className="w-8 h-8 text-red-600 flex-shrink-0" />
                        ) : (
                          <Clock className="w-8 h-8 text-gray-600 flex-shrink-0" />
                        )}
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">{log.medicine_name}</h3>
                          <p className="text-gray-600 mt-1">
                            Scheduled: {log.scheduled_time}
                          </p>
                          {log.actual_intake_time && (
                            <p className="text-sm text-gray-500 mt-1">
                              Taken at {log.actual_intake_time}
                            </p>
                          )}
                          {log.remarks && (
                            <p className="text-sm text-gray-600 mt-2 italic">
                              Note: {log.remarks}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge className={`text-sm px-3 py-1 ${
                          log.status === 'taken'
                            ? 'bg-green-100 text-green-800'
                            : log.status === 'missed'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {log.status.charAt(0).toUpperCase() + log.status.slice(1)}
                        </Badge>
                        <p className="text-sm text-gray-500">
                          {format(parseISO(log.intake_date), 'MMM d, yyyy')}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
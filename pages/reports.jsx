import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Calendar, Award, AlertCircle } from "lucide-react";
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, format, parseISO, isWithinInterval, eachDayOfInterval } from "date-fns";

export default function Reports() {
  const [period, setPeriod] = useState("month");

  const { data: logs = [] } = useQuery({
    queryKey: ['allLogs'],
    queryFn: async () => {
      // Backend now uses session to filter by user automatically
      return base44.entities.IntakeLog.filter({}, '-created_date');
    },
    initialData: [],
  });

  const { data: medicines = [] } = useQuery({
    queryKey: ['medicines'],
    queryFn: async () => {
      // Backend now uses session to filter by user automatically
      return base44.entities.Medicine.filter({});
    },
    initialData: [],
  });

  const getFilteredLogs = () => {
    const now = new Date();
    let start, end;

    switch (period) {
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

  const filteredLogs = getFilteredLogs();

  const complianceData = [
    { name: 'Taken', value: filteredLogs.filter(l => l.status === 'taken').length, color: '#22c55e' },
    { name: 'Missed', value: filteredLogs.filter(l => l.status === 'missed').length, color: '#ef4444' },
    { name: 'Skipped', value: filteredLogs.filter(l => l.status === 'skipped').length, color: '#6b7280' },
  ];

  const medicineBreakdown = medicines.map(med => ({
    name: med.med_name,
    taken: filteredLogs.filter(l => l.medicine_id === med.id && l.status === 'taken').length,
    missed: filteredLogs.filter(l => l.medicine_id === med.id && l.status === 'missed').length,
  })).filter(item => item.taken > 0 || item.missed > 0);

  const getDailyTrend = () => {
    const now = new Date();
    const days = period === "week" 
      ? eachDayOfInterval({ start: startOfWeek(now), end: endOfWeek(now) })
      : eachDayOfInterval({ start: startOfMonth(now), end: endOfMonth(now) });

    return days.map(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const dayLogs = filteredLogs.filter(l => l.intake_date === dayStr);
      return {
        date: format(day, 'MMM d'),
        taken: dayLogs.filter(l => l.status === 'taken').length,
        missed: dayLogs.filter(l => l.status === 'missed').length,
      };
    });
  };

  const dailyTrend = getDailyTrend();

  const complianceRate = filteredLogs.length > 0 
    ? ((filteredLogs.filter(l => l.status === 'taken').length / filteredLogs.length) * 100).toFixed(1)
    : 0;

  const bestMedicine = medicineBreakdown.length > 0
    ? medicineBreakdown.reduce((best, current) => {
        const currentRate = current.taken / (current.taken + current.missed);
        const bestRate = best.taken / (best.taken + best.missed);
        return currentRate > bestRate ? current : best;
      })
    : null;

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-blue-50 via-white to-green-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Reports & Analytics</h1>
            <p className="text-gray-600 mt-2 text-lg">Track your medicine intake patterns</p>
          </div>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-48 text-lg py-6">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Key Metrics */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="shadow-lg border-none bg-gradient-to-br from-green-500 to-green-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/90 text-sm mb-1">Compliance Rate</p>
                  <p className="text-4xl font-bold">{complianceRate}%</p>
                </div>
                <TrendingUp className="w-12 h-12 text-white/80" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-none bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/90 text-sm mb-1">Total Intakes</p>
                  <p className="text-4xl font-bold">{filteredLogs.length}</p>
                </div>
                <Calendar className="w-12 h-12 text-white/80" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-none bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/90 text-sm mb-1">Best Performer</p>
                  <p className="text-xl font-bold">{bestMedicine?.name || 'N/A'}</p>
                </div>
                <Award className="w-12 h-12 text-white/80" />
              </div>
            </CardContent>
          </Card>
        </div>

        {filteredLogs.length === 0 ? (
          <Card className="shadow-lg border-none">
            <CardContent className="text-center py-16">
              <AlertCircle className="w-24 h-24 text-gray-300 mx-auto mb-4" />
              <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                No data available
              </h3>
              <p className="text-gray-600 text-lg">
                Start logging your medicine intake to see analytics
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Compliance Overview */}
            <Card className="shadow-lg border-none">
              <CardHeader>
                <CardTitle className="text-xl">Compliance Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={complianceData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {complianceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Daily Trend */}
            <Card className="shadow-lg border-none">
              <CardHeader>
                <CardTitle className="text-xl">Daily Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={dailyTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="taken" stroke="#22c55e" strokeWidth={2} name="Taken" />
                    <Line type="monotone" dataKey="missed" stroke="#ef4444" strokeWidth={2} name="Missed" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Medicine Performance */}
            <Card className="shadow-lg border-none lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-xl">Medicine Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={medicineBreakdown}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="taken" fill="#22c55e" name="Taken" />
                    <Bar dataKey="missed" fill="#ef4444" name="Missed" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
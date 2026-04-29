import React, { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import NotificationTest from "@/components/NotificationTest";
import { 
  Pill, 
  Calendar, 
  Package, 
  Bell, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  AlertCircle,
  TrendingUp,
  Clock,
  RefreshCw
} from "lucide-react";
import { format, isToday, parseISO } from "date-fns";

import TodayReminders from "@/components/dashboard/TodayReminders";
import StatsOverview from "@/components/dashboard/StatsOverview";
import LowStockAlerts from "@/components/dashboard/LowStockAlerts";
import RecentActivity from "@/components/dashboard/RecentActivity";

export default function Dashboard() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [user, setUser] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [newUpdates, setNewUpdates] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        // Get user from localStorage
        const userName = localStorage.getItem('userName') || 'User';
        const userEmail = localStorage.getItem('userEmail') || '';
        setUser({
          full_name: userName,
          email: userEmail
        });
      } catch (error) {
        console.error("Error fetching user:", error);
      }
    };
    fetchUser();
  }, []);

  const { data: schedules = [], isRefetching: schedulesRefetching } = useQuery({
    queryKey: ['schedules'],
    queryFn: async () => {
      // Backend now uses session to filter by user automatically
      return base44.entities.MedicineSchedule.filter({ 
        active: true 
      });
    },
    initialData: [],
    enabled: !!user, // Only fetch when user is loaded
    retry: 3,
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  const { data: stocks = [], isRefetching: stocksRefetching } = useQuery({
    queryKey: ['stocks'],
    queryFn: async () => {
      // Backend now uses session to filter by user automatically
      return base44.entities.Stock.filter({});
    },
    initialData: [],
    enabled: !!user, // Only fetch when user is loaded
    retry: 3,
    refetchInterval: 5000,
  });

  const { data: todayLogs = [], isRefetching: logsRefetching, dataUpdatedAt } = useQuery({
    queryKey: ['todayLogs'],
    queryFn: async () => {
      // Backend now uses session to filter by user automatically
      const today = format(new Date(), 'yyyy-MM-dd');
      return base44.entities.IntakeLog.filter({ 
        intake_date: today
      }, '-created_date');
    },
    initialData: [],
    enabled: !!user, // Only fetch when user is loaded
    retry: 3,
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  const { data: notifications = [], isRefetching: notifsRefetching } = useQuery({
    queryKey: ['recentNotifications'],
    queryFn: async () => {
      // Backend now uses session to filter by user automatically
      return base44.entities.Notification.filter(
        {},
        '-created_date',
        5
      );
    },
    initialData: [],
    enabled: !!user, // Only fetch when user is loaded
    retry: 3,
    refetchInterval: 5000,
  });

  // Detect when data updates
  useEffect(() => {
    if (dataUpdatedAt > lastUpdate.getTime()) {
      setNewUpdates(true);
      setLastUpdate(new Date());
      
      // Show update indicator for 3 seconds
      setTimeout(() => setNewUpdates(false), 3000);
    }
  }, [dataUpdatedAt]);

  const currentDay = format(currentTime, 'EEEE');
  const todaySchedules = schedules.filter(schedule => 
    schedule.days.includes(currentDay)
  );

  const lowStockItems = stocks.filter(stock => stock.quantity <= stock.threshold);
  const takenToday = todayLogs.filter(log => log.status === 'taken').length;
  const missedToday = todayLogs.filter(log => log.status === 'missed').length;
  const pendingToday = todaySchedules.length - todayLogs.length;

  const isRefreshing = schedulesRefetching || stocksRefetching || logsRefetching || notifsRefetching;

  // Merge logs and notifications for Recent Activity (most recent first)
  const activities = [...(todayLogs || []), ...(notifications || [])].sort((a, b) => {
    const ad = a.created_date ? new Date(a.created_date).getTime() : 0;
    const bd = b.created_date ? new Date(b.created_date).getTime() : 0;
    return bd - ad;
  });

  // Action from notification card to mark intake
  const markFromNotification = async (notif, status) => {
    const sched = todaySchedules.find(s => s.medicine_name === notif.medicine_name);
    if (!sched) return;
    await fetch('http://localhost:5000/api/logs/mark', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ schedule_id: sched.id, status, notification_id: notif.id })
    });
    queryClient.invalidateQueries({ queryKey: ['todayLogs'] });
    queryClient.invalidateQueries({ queryKey: ['recentNotifications'] });
    queryClient.invalidateQueries({ queryKey: ['stocks'] });
  };

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-blue-50 via-white to-green-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header with Auto-Refresh Indicator */}
        <div className="mb-8">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                Good {currentTime.getHours() < 12 ? 'Morning' : currentTime.getHours() < 18 ? 'Afternoon' : 'Evening'}, {user?.full_name?.split(' ')[0] || 'there'}!
              </h1>
              <p className="text-lg text-gray-600">
                {format(currentTime, 'EEEE, MMMM d, yyyy')} • {format(currentTime, 'HH:mm')}
              </p>
            </div>
            
            {/* Live Update Indicator */}
            <div className="flex flex-col items-end gap-2">
              <Badge 
                className={`${
                  isRefreshing 
                    ? 'bg-blue-100 text-blue-700 animate-pulse' 
                    : newUpdates
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                <RefreshCw className={`w-3 h-3 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? 'Updating...' : newUpdates ? 'Updated!' : 'Live'}
              </Badge>
              <p className="text-xs text-gray-500">
                Last updated: {format(lastUpdate, 'HH:mm:ss')}
              </p>
            </div>
          </div>

          {/* Email Response Alert */}
          {newUpdates && (
            <div className="mb-4 p-4 bg-green-50 border-l-4 border-green-500 rounded-lg animate-pulse">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-green-600" />
                <div>
                  <p className="font-semibold text-green-900">Dashboard Updated!</p>
                  <p className="text-sm text-green-700">Your latest response has been recorded</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Stats Overview with Pending Count */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <Card className="shadow-lg border-none">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mb-3 mx-auto shadow-md">
                <Pill className="w-6 h-6 text-white" />
              </div>
              <p className="text-3xl font-bold text-gray-900">{schedules.length}</p>
              <p className="text-sm text-gray-600 font-medium">Total Medicines</p>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-none">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center mb-3 mx-auto shadow-md">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <p className="text-3xl font-bold text-gray-900">{todaySchedules.length}</p>
              <p className="text-sm text-gray-600 font-medium">Today's Schedule</p>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-none">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center mb-3 mx-auto shadow-md">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <p className="text-3xl font-bold text-gray-900">{takenToday}</p>
              <p className="text-sm text-gray-600 font-medium">Taken Today</p>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-none">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center mb-3 mx-auto shadow-md">
                <XCircle className="w-6 h-6 text-white" />
              </div>
              <p className="text-3xl font-bold text-gray-900">{missedToday}</p>
              <p className="text-sm text-gray-600 font-medium">Missed Today</p>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-none">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-yellow-500 to-yellow-600 flex items-center justify-center mb-3 mx-auto shadow-md">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <p className="text-3xl font-bold text-gray-900">{pendingToday}</p>
              <p className="text-sm text-gray-600 font-medium">Pending</p>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-none">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center mb-3 mx-auto shadow-md">
                <AlertTriangle className="w-6 h-6 text-white" />
              </div>
              <p className="text-3xl font-bold text-gray-900">{lowStockItems.length}</p>
              <p className="text-sm text-gray-600 font-medium">Low Stock</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <TodayReminders todaySchedules={todaySchedules} todayLogs={todayLogs} />
            <RecentActivity activities={activities} />
          </div>

          <div className="space-y-6">
            <LowStockAlerts stocks={lowStockItems} />
            
            {/* Quick Actions */}
            <Card className="shadow-lg border-none bg-gradient-to-br from-blue-500 to-green-500 text-white">
              <CardHeader>
                <CardTitle className="text-white text-xl">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link to={createPageUrl("Medicines")}>
                  <Button className="w-full bg-white text-blue-600 hover:bg-blue-50 text-lg py-6">
                    <Pill className="w-5 h-5 mr-2" />
                    Add Medicine
                  </Button>
                </Link>
                <Link to={createPageUrl("Schedule")}>
                  <Button className="w-full bg-white/90 text-green-600 hover:bg-white text-lg py-6">
                    <Calendar className="w-5 h-5 mr-2" />
                    Set Reminder
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Notification Test Component */}
            <NotificationTest />

            {/* Recent Notifications */}
            {notifications.length > 0 && (
              <Card className="shadow-lg border-none">
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Bell className="w-5 h-5 text-blue-600" />
                    Recent Alerts
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {notifications.slice(0, 3).map((notif) => {
                    const isReminder = notif.notification_type === 'reminder';
                    // Try find schedule for buttons
                    const sched = todaySchedules.find(s => s.medicine_name === notif.medicine_name);
                    return (
                      <div 
                        key={notif.id}
                        className={`p-3 rounded-lg border-l-4 ${
                          notif.priority === 'urgent' || notif.priority === 'high'
                            ? 'border-red-500 bg-red-50'
                            : notif.priority === 'medium'
                            ? 'border-yellow-500 bg-yellow-50'
                            : 'border-blue-500 bg-blue-50'
                        }`}
                      >
                        <p className="font-semibold text-sm">{notif.title}</p>
                        <p className="text-xs text-gray-600 mt-1">{notif.message}</p>
                        <div className="flex items-center justify-between mt-2">
                          <p className="text-xs text-gray-400">
                            {format(parseISO(notif.created_date), 'HH:mm')}
                          </p>
                          {isReminder && sched && (
                            <div className="flex items-center gap-2">
                              <Button size="sm" variant="outline" onClick={() => markFromNotification(notif, 'taken')}>
                                <CheckCircle className="w-4 h-4 mr-1" /> I Took It
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => markFromNotification(notif, 'missed')}>
                                <AlertCircle className="w-4 h-4 mr-1" /> I Missed It
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  <Link to={createPageUrl("Notifications")}>
                    <Button variant="outline" className="w-full mt-2">
                      View All Notifications
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
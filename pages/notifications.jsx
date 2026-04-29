import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, AlertTriangle, Package, Clock, CheckCircle, Trash2 } from "lucide-react";
import { format, parseISO, parse } from "date-fns";

export default function Notifications() {
  const queryClient = useQueryClient();
  const [pendingId, setPendingId] = React.useState(null);

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['unreadNotifications'],
    queryFn: async () => {
      // Only unread notifications so handled ones disappear automatically
      return base44.entities.Notification.filter({ is_read: false }, '-created_date');
    },
    initialData: [],
  });

  const { data: schedules = [] } = useQuery({
    queryKey: ['notifTodaySchedules'],
    queryFn: async () => {
      const all = await base44.entities.MedicineSchedule.filter({ active: true });
      const todayName = new Date().toLocaleDateString(undefined, { weekday: 'long' });
      return all.filter(s => Array.isArray(s.days) ? s.days.includes(todayName) : `${s.days}`.includes(todayName));
    },
    initialData: [],
  });

  const markAsReadMutation = useMutation({
    mutationFn: (id) => base44.entities.Notification.update(id, { is_read: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allNotifications'] });
      queryClient.invalidateQueries({ queryKey: ['unreadNotifications'] });
    },
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: (id) => base44.entities.Notification.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allNotifications'] });
      queryClient.invalidateQueries({ queryKey: ['unreadNotifications'] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const unread = notifications.filter(n => !n.is_read);
      await Promise.all(unread.map(n => base44.entities.Notification.update(n.id, { is_read: true })));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allNotifications'] });
      queryClient.invalidateQueries({ queryKey: ['unreadNotifications'] });
    },
  });

  const markIntake = async (notification, status) => {
    try {
      setPendingId(notification.id);
      const body = { status, notification_id: notification.id };
      if (notification.schedule_id) {
        body.schedule_id = notification.schedule_id;
      } else {
        // Try to resolve today's schedule by medicine name and time extracted from message
        const todayName = new Date().toLocaleDateString(undefined, { weekday: 'long' });
        // Extract time after ' at '
        let intakeStr = '';
        const msg = notification.message || '';
        const atIdx = msg.toLowerCase().lastIndexOf(' at ');
        if (atIdx > -1) {
          intakeStr = msg.substring(atIdx + 4).trim();
        }
        // Normalize to HH:mm if possible
        const ref = new Date();
        let normalized = '';
        if (intakeStr) {
          try {
            const d24 = parse(intakeStr, 'HH:mm', ref);
            if (!isNaN(d24.getTime())) normalized = format(d24, 'HH:mm');
          } catch {}
          if (!normalized) {
            try {
              const d12 = parse(intakeStr, 'h:mm a', ref);
              if (!isNaN(d12.getTime())) normalized = format(d12, 'HH:mm');
            } catch {}
          }
        }
        const sched = schedules.find(s => (
          s.medicine_name === notification.medicine_name) &&
          (Array.isArray(s.days) ? s.days.includes(todayName) : `${s.days}`.includes(todayName)) &&
          (!normalized || `${s.intake_time}` === normalized)
        );
        if (!sched) {
          alert('No matching schedule found for this reminder');
          return;
        }
        body.schedule_id = sched.id;
        // Provide extra hints for backend fallback
        body.medicine_name = notification.medicine_name;
        if (normalized) body.intake_time = normalized;
      }
      await fetch('http://localhost:5000/api/logs/mark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body)
      });
      queryClient.invalidateQueries({ queryKey: ['allNotifications'] });
      queryClient.invalidateQueries({ queryKey: ['unreadNotifications'] });
      queryClient.invalidateQueries({ queryKey: ['todayLogs'] });
      queryClient.invalidateQueries({ queryKey: ['stocks'] });
    } finally {
      setPendingId(null);
    }
  };

  const getNotificationIcon = (type, priority) => {
    if (type === 'low_stock' || type === 'out_of_stock') {
      return <Package className="w-6 h-6" />;
    }
    if (type === 'missed_dose') {
      return <Clock className="w-6 h-6" />;
    }
    if (priority === 'urgent' || priority === 'high') {
      return <AlertTriangle className="w-6 h-6" />;
    }
    return <Bell className="w-6 h-6" />;
  };

  const getNotificationColor = (type, priority) => {
    if (type === 'out_of_stock' || priority === 'urgent') {
      return 'from-red-500 to-red-600';
    }
    if (type === 'low_stock' || priority === 'high') {
      return 'from-orange-500 to-orange-600';
    }
    if (type === 'missed_dose') {
      return 'from-yellow-500 to-yellow-600';
    }
    return 'from-blue-500 to-blue-600';
  };

  const unreadCount = notifications.length;

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-blue-50 via-white to-green-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Notifications</h1>
            <p className="text-gray-600 mt-2 text-lg">
              {unreadCount > 0 ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
            </p>
          </div>
          {unreadCount > 0 && (
            <Button
              size="lg"
              variant="outline"
              onClick={() => markAllAsReadMutation.mutate()}
              disabled={markAllAsReadMutation.isPending}
              className="text-lg px-6"
            >
              <CheckCircle className="w-5 h-5 mr-2" />
              Mark All as Read
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-500 mt-4">Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <Card className="shadow-lg border-none">
            <CardContent className="text-center py-16">
              <Bell className="w-24 h-24 text-gray-300 mx-auto mb-4" />
              <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                No notifications yet
              </h3>
              <p className="text-gray-600 text-lg">
                You'll receive alerts here for low stock and missed doses
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <Card 
                key={notification.id}
                className={`shadow-lg border-none hover:shadow-xl transition-all duration-300 ${
                  !notification.is_read ? 'ring-2 ring-blue-500' : ''
                }`}
              >
                <CardHeader className={`bg-gradient-to-r ${getNotificationColor(notification.notification_type, notification.priority)} text-white rounded-t-lg p-6`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                        {getNotificationIcon(notification.notification_type, notification.priority)}
                      </div>
                      <div>
                        <CardTitle className="text-xl">{notification.title}</CardTitle>
                        {notification.medicine_name && (
                          <p className="text-white/90 mt-1">{notification.medicine_name}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-white/20 text-white border-white/30 text-sm">
                        {notification.priority}
                      </Badge>
                      {!notification.is_read && (
                        <div className="w-3 h-3 bg-white rounded-full"></div>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <p className="text-gray-700 text-lg mb-4">{notification.message}</p>
                  <div className="flex items-center justify-between pt-4 border-t">
                    <p className="text-sm text-gray-500">
                      {format(parseISO(notification.created_date), 'MMM d, yyyy • HH:mm')}
                    </p>
                    <div className="flex gap-2">
                      {notification.notification_type === 'reminder' ? (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => markIntake(notification, 'taken')}
                            disabled={pendingId === notification.id}
                            className="text-green-700 border-green-200 hover:bg-green-50"
                          >
                            <CheckCircle className="w-4 h-4 mr-2" /> I Took It
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => markIntake(notification, 'missed')}
                            disabled={pendingId === notification.id}
                            className="text-red-700 border-red-200 hover:bg-red-50"
                          >
                            <CheckCircle className="w-4 h-4 mr-2" /> I Missed It
                          </Button>
                        </>
                      ) : (
                        !notification.is_read && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => markAsReadMutation.mutate(notification.id)}
                            disabled={markAsReadMutation.isPending}
                            className="text-blue-600 border-blue-200 hover:bg-blue-50"
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Mark as Read
                          </Button>
                        )
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (confirm("Are you sure you want to delete this notification?")) {
                            deleteNotificationMutation.mutate(notification.id);
                          }
                        }}
                        disabled={deleteNotificationMutation.isPending}
                        className="text-red-600 border-red-200 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
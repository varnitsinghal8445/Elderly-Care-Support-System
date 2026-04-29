
import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bell, Clock, Mail, CheckCircle, AlertTriangle, RefreshCw } from "lucide-react";
import { format, parse, differenceInMinutes } from "date-fns";
import { useNotification } from "@/contexts/NotificationContext";

export default function AutoReminders() {
  const [autoSendEnabled, setAutoSendEnabled] = useState(() => {
    try {
      const saved = localStorage.getItem('autoSendEnabled');
      return saved === 'true';
    } catch {
      return false;
    }
  });
  const [nextCheck, setNextCheck] = useState(null);
  const [lastSent, setLastSent] = useState([]); // [{ scheduleId, date, sentAt, resent:false }]
  const { showNotification } = useNotification();

  const { data: schedules = [] } = useQuery({
    queryKey: ['activeSchedules'],
    queryFn: async () => {
      // Backend now uses session to filter by user automatically
      return base44.entities.MedicineSchedule.filter({ 
        active: true 
      });
    },
    initialData: [],
    refetchInterval: 30000, // Check every 30 seconds
  });

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const parseScheduleTime = (timeStr) => {
    const ref = new Date();
    try {
      const d24 = parse(timeStr, 'HH:mm', ref);
      if (!isNaN(d24.getTime())) return d24;
    } catch {}
    try {
      const d12 = parse(timeStr, 'h:mm a', ref);
      if (!isNaN(d12.getTime())) return d12;
    } catch {}
    // Fallback: treat as HH:mm best-effort
    return parse(timeStr, 'HH:mm', ref);
  };

  const checkAndSendReminders = async () => {
    // Proceed even if user query hasn't resolved yet; backend will enforce auth

    const now = new Date();
    const currentTime = format(now, 'HH:mm');
    const currentDay = format(now, 'EEEE');
    const today = format(now, 'yyyy-MM-dd');

    // Get today's schedules
    const todaySchedules = schedules.filter(schedule => {
      const days = schedule?.days;
      if (Array.isArray(days)) return days.includes(currentDay);
      if (typeof days === 'string') return days.includes(currentDay);
      return false;
    });

    console.log('[AutoReminders] now', now.toISOString(), 'currentDay', currentDay, 'todaySchedules', todaySchedules.map(s => ({ id: s.id, med: s.medicine_name, time: s.intake_time })));

    for (const schedule of todaySchedules) {
      const scheduleTime = parseScheduleTime(schedule.intake_time);
      const timeDiff = differenceInMinutes(scheduleTime, now);
      console.log('[AutoReminders] check schedule', schedule.id, schedule.medicine_name, 'at', schedule.intake_time, 'diff(min)=', timeDiff);

      // Send reminder 5 minutes before scheduled time
      if (timeDiff <= 5 && timeDiff >= 0) {
        // Check if already sent today
        const alreadySent = lastSent.find(s => s.scheduleId === schedule.id && s.date === today);

        if (!alreadySent) {
          // Check if already logged
          const logs = await base44.entities.IntakeLog.filter({
            schedule_id: schedule.id,
            intake_date: today
          });

          if (logs.length === 0) {
            await sendReminderNotification(schedule);
            setLastSent(prev => [...prev, { scheduleId: schedule.id, date: today, sentAt: new Date(), resent: false }]);
          }
        }
      }

      // Resend once if no response within 5 minutes after first send
      const record = lastSent.find(s => s.scheduleId === schedule.id && s.date === today);
      if (record && !record.resent) {
        const minutesSinceSend = differenceInMinutes(now, new Date(record.sentAt));
        if (minutesSinceSend >= 5) {
          // Check if a log exists (response)
          const logs = await base44.entities.IntakeLog.filter({
            schedule_id: schedule.id,
            intake_date: today
          });
          if (logs.length === 0) {
            await sendReminderNotification(schedule);
            setLastSent(prev => prev.map(r => r.scheduleId === record.scheduleId && r.date === record.date ? { ...r, resent: true } : r));
          }
        }
      }
    }

    setNextCheck(new Date(now.getTime() + 30000)); // Next check in 30 seconds
  };

  const sendReminderNotification = async (schedule) => {
    try {
      // Show popup notification
      showNotification({
        notification_type: 'reminder',
        title: 'Medicine Reminder',
        message: `Time to take ${schedule.medicine_name} at ${schedule.intake_time}`,
        medicine_name: schedule.medicine_name,
        priority: 'medium'
      });

      // Create notification in database
      await base44.entities.Notification.create({
        schedule_id: schedule.id,
        medicine_id: schedule.medicine_id,
        medicine_name: schedule.medicine_name,
        notification_type: 'reminder',
        title: 'Medicine Reminder',
        message: `Time to take ${schedule.medicine_name} at ${schedule.intake_time}`,
        priority: 'medium'
      });

      await fetch('http://localhost:5000/api/reminders/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          schedule_id: schedule.id,
          medicine_id: schedule.medicine_id,
          medicine_name: schedule.medicine_name,
          intake_time: schedule.intake_time,
        }),
      });

      console.log(`✅ Auto-reminder notification sent for ${schedule.medicine_name}`);
    } catch (error) {
      console.error("Error sending auto-reminder notification:", error);
    }
  };

  // Persist toggle to localStorage
  useEffect(() => {
    try { localStorage.setItem('autoSendEnabled', String(autoSendEnabled)); } catch {}
  }, [autoSendEnabled]);

  useEffect(() => {
    if (autoSendEnabled) {
      const interval = setInterval(() => {
        checkAndSendReminders();
      }, 30000); // Check every 30 seconds

      // Initial check
      checkAndSendReminders();

      return () => clearInterval(interval);
    }
  }, [autoSendEnabled, schedules]);

  const todaySchedules = schedules.filter(schedule => {
    const day = format(new Date(), 'EEEE');
    const days = schedule?.days;
    if (Array.isArray(days)) return days.includes(day);
    if (typeof days === 'string') return days.includes(day);
    return false;
  });

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-blue-50 via-white to-green-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Automatic Popup Reminders
          </h1>
          <p className="text-gray-600 text-lg">
            Enable automatic popup notifications for your medicine schedule
          </p>
        </div>

        {/* Control Panel */}
        <Card className="shadow-xl border-none mb-8">
          <CardHeader className="bg-gradient-to-r from-blue-500 to-green-500 text-white rounded-t-lg">
            <CardTitle className="text-2xl flex items-center gap-3">
              <Bell className="w-7 h-7" />
              Auto-Reminder System
              <Badge className="ml-auto bg-white/20 text-white border-white/30">
                {autoSendEnabled ? "Active" : "Inactive"}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <div className="space-y-6">
              <div className="flex items-center justify-between p-6 bg-blue-50 rounded-xl border-2 border-blue-200">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {autoSendEnabled ? "✅ Automatic Reminders ON" : "⏸️ Automatic Reminders OFF"}
                  </h3>
                  <p className="text-gray-600">
                    {autoSendEnabled 
                      ? "Popup notifications will appear automatically 5 minutes before each scheduled medicine time"
                      : "Click the button to enable automatic popup reminders"
                    }
                  </p>
                  {autoSendEnabled && nextCheck && (
                    <p className="text-sm text-blue-600 mt-2 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Next check: {format(nextCheck, 'HH:mm:ss')}
                    </p>
                  )}
                </div>
                <Button
                  size="lg"
                  onClick={() => setAutoSendEnabled(!autoSendEnabled)}
                  className={`text-lg px-8 ${
                    autoSendEnabled 
                      ? "bg-red-500 hover:bg-red-600" 
                      : "bg-green-500 hover:bg-green-600"
                  }`}
                >
                  {autoSendEnabled ? "Disable" : "Enable"}
                </Button>
              </div>

              {autoSendEnabled && (
                <div className="p-6 bg-green-50 border-2 border-green-200 rounded-xl">
                  <div className="flex items-center gap-3 mb-3">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                    <h4 className="font-semibold text-green-900 text-lg">System Active</h4>
                  </div>
                  <ul className="space-y-2 text-green-800">
                    <li>✓ Monitoring {todaySchedules.length} medicines scheduled for today</li>
                    <li>✓ Checking every 30 seconds for upcoming reminders</li>
                    <li>✓ Popup notifications will appear 5 minutes before scheduled time</li>
                    <li>✓ Notifications will also be saved to the notifications page</li>
                  </ul>
                  <div className="mt-4">
                    <Button
                      variant="outline"
                      onClick={async () => {
                        try {
                          const next = todaySchedules.sort((a,b)=>`${a.intake_time}`.localeCompare(`${b.intake_time}`))[0];
                          if (!next) { console.warn('[AutoReminders] No schedule for today to test'); return; }
                          console.log('[AutoReminders] Test send for', next);
                          await sendReminderNotification(next);
                          // Mark as sent today to avoid duplicate immediate resend
                          setLastSent(prev => [...prev, { scheduleId: next.id, date: format(new Date(),'yyyy-MM-dd'), sentAt: new Date(), resent: false }]);
                        } catch (e) {
                          console.error('[AutoReminders] Test send failed', e);
                        }
                      }}
                    >
                      Send Test Reminder Now
                    </Button>
                  </div>
                </div>
              )}

              <div className="p-6 bg-yellow-50 border-2 border-yellow-200 rounded-xl">
                <div className="flex items-center gap-3 mb-3">
                  <AlertTriangle className="w-6 h-6 text-yellow-600" />
                  <h4 className="font-semibold text-yellow-900 text-lg">Important Notes</h4>
                </div>
                <ul className="space-y-2 text-yellow-800">
                  <li>• Keep this page open in your browser for automatic reminders to work</li>
                  <li>• Reminders are sent 5 minutes before the scheduled time</li>
                  <li>• Each reminder is sent only once per day per medicine</li>
                  <li>• If you already logged the medicine, no reminder will be sent</li>
                  <li>• Popup notifications will appear in the top-right corner</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Today's Schedule */}
        <Card className="shadow-lg border-none">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Clock className="w-6 h-6 text-blue-600" />
              Today's Schedule ({todaySchedules.length} medicines)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {todaySchedules.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No medicines scheduled for today</p>
              </div>
            ) : (
              <div className="space-y-3">
                {todaySchedules
                  .sort((a, b) => a.intake_time.localeCompare(b.intake_time))
                  .map((schedule) => (
                    <div 
                      key={schedule.id}
                      className="p-4 bg-white border-2 border-gray-200 rounded-lg hover:shadow-md transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-bold text-gray-900 text-lg">{schedule.medicine_name}</h3>
                          <div className="text-gray-600 flex items-center gap-2 mt-1">
                            <Clock className="w-4 h-4" />
                            <span>{schedule.intake_time}</span>
                            {autoSendEnabled && (
                              <Badge className="bg-green-100 text-green-700 ml-2">
                                <Bell className="w-3 h-3 mr-1" />
                                Auto-reminder enabled
                              </Badge>
                            )}
                          </div>
                        </div>
                        <Bell className="w-8 h-8 text-blue-500" />
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

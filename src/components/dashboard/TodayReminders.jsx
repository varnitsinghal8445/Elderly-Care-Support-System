import React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react';
import { format, parse, differenceInMinutes } from 'date-fns';

export default function TodayReminders({ todaySchedules, todayLogs = [] }) {
  const queryClient = useQueryClient();

  const markLog = async (scheduleId, status) => {
    await fetch('http://localhost:5000/api/logs/mark', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ schedule_id: scheduleId, status }),
    });
    // Refresh dashboard queries
    queryClient.invalidateQueries({ queryKey: ['todayLogs'] });
    queryClient.invalidateQueries({ queryKey: ['recentNotifications'] });
  };

  const logBySchedule = new Map(
    todayLogs
      .filter(l => l.schedule_id != null)
      .map(l => [l.schedule_id, l])
  );
  if (!todaySchedules || todaySchedules.length === 0) {
    return (
      <Card className="shadow-lg border-none">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <Clock className="w-6 h-6 text-blue-600" />
            Today's Reminders
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No medicines scheduled for today</p>
        </CardContent>
      </Card>
    );
  }

  const now = new Date();
  const sortedSchedules = todaySchedules.sort((a, b) => 
    a.intake_time.localeCompare(b.intake_time)
  );

  const getTimeStatus = (scheduleTime) => {
    const scheduleDateTime = parse(scheduleTime, 'HH:mm', new Date());
    const timeDiff = differenceInMinutes(scheduleDateTime, now);
    
    if (timeDiff < -30) {
      return { status: 'overdue', color: 'text-red-600', bgColor: 'bg-red-50', borderColor: 'border-red-200' };
    } else if (timeDiff < 0) {
      return { status: 'late', color: 'text-orange-600', bgColor: 'bg-orange-50', borderColor: 'border-orange-200' };
    } else if (timeDiff <= 30) {
      return { status: 'upcoming', color: 'text-yellow-600', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-200' };
    } else {
      return { status: 'scheduled', color: 'text-blue-600', bgColor: 'bg-blue-50', borderColor: 'border-blue-200' };
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'overdue':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Overdue</Badge>;
      case 'late':
        return <Badge className="bg-orange-100 text-orange-800 border-orange-200">Late</Badge>;
      case 'upcoming':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Upcoming</Badge>;
      default:
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Scheduled</Badge>;
    }
  };

  return (
    <Card className="shadow-lg border-none">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <Clock className="w-6 h-6 text-blue-600" />
          Today's Reminders ({todaySchedules.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sortedSchedules.map((schedule) => {
            const timeStatus = getTimeStatus(schedule.intake_time);
            const scheduleDateTime = parse(schedule.intake_time, 'HH:mm', new Date());
            const timeDiff = differenceInMinutes(scheduleDateTime, new Date()); // minutes until intake
            const log = logBySchedule.get(schedule.id);
            const isTaken = log?.status === 'taken';
            const isMissed = log?.status === 'missed';
            const forcedColors = isTaken
              ? { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700' }
              : isMissed
              ? { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700' }
              : null;
            return (
              <div 
                key={schedule.id} 
                className={`p-4 rounded-lg border-2 ${forcedColors ? forcedColors.bg : timeStatus.bgColor} ${forcedColors ? forcedColors.border : timeStatus.borderColor}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <Clock className={`w-5 h-5 ${forcedColors ? forcedColors.text : timeStatus.color}`} />
                    <h3 className="font-semibold text-gray-900">{schedule.medicine_name}</h3>
                  </div>
                  {log ? (
                    isTaken ? <Badge className="bg-green-100 text-green-800 border-green-200">Taken</Badge>
                            : <Badge className="bg-red-100 text-red-800 border-red-200">Missed</Badge>
                  ) : (
                    getStatusBadge(timeStatus.status)
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <p className={`text-lg font-bold ${forcedColors ? forcedColors.text : timeStatus.color}`}>
                    {schedule.intake_time}
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="text-sm text-gray-600">
                      {Array.isArray(schedule.days) ? schedule.days.join(', ') : schedule.days}
                    </div>
                    {log ? (
                      <span className="text-xs text-gray-500">Recorded at {log.actual_intake_time}</span>
                    ) : (
                      <span className="text-xs text-gray-500">Take as scheduled</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="pt-4 border-t border-gray-200 mt-6">
          <Button
            variant="outline"
            className="w-full text-blue-600 hover:text-blue-700 hover:bg-blue-50"
            onClick={() => window.location.href = '/schedule'}
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Manage Schedules
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
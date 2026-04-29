import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { format, parseISO } from 'date-fns';

export default function RecentActivity({ activities }) {
  if (!activities || activities.length === 0) {
    return (
      <Card className="shadow-lg border-none">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <Clock className="w-6 h-6 text-blue-600" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No recent activity</p>
        </CardContent>
      </Card>
    );
  }

  const getActivityIcon = (type) => {
    switch (type) {
      case 'taken':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'missed':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'low_stock':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      default:
        return <Clock className="w-5 h-5 text-blue-600" />;
    }
  };

  const getActivityBadge = (type) => {
    switch (type) {
      case 'taken':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Taken</Badge>;
      case 'missed':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Missed</Badge>;
      case 'low_stock':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Low Stock</Badge>;
      default:
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Activity</Badge>;
    }
  };

  return (
    <Card className="shadow-lg border-none">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <Clock className="w-6 h-6 text-blue-600" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.slice(0, 5).map((activity) => (
            <div key={activity.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="flex-shrink-0 mt-1">
                {getActivityIcon(activity.status || activity.notification_type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {activity.medicine_name}
                  </p>
                  {getActivityBadge(activity.status || activity.notification_type)}
                </div>
                <p className="text-sm text-gray-600 mb-1">
                  {activity.message || activity.remarks || 'Activity recorded'}
                </p>
                <p className="text-xs text-gray-500">
                  {format(parseISO(activity.created_date), 'MMM dd, yyyy h:mm a')}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
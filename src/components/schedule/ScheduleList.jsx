import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, Clock, Calendar, Pill } from 'lucide-react';
import { format, parseISO } from 'date-fns';

export default function ScheduleList({ schedules, onEdit, onDelete }) {
  if (schedules.length === 0) {
    return (
      <Card className="shadow-lg border-none">
        <CardContent className="text-center py-16">
          <Clock className="w-24 h-24 text-gray-300 mx-auto mb-4" />
          <h3 className="text-2xl font-semibold text-gray-900 mb-2">
            No schedules yet
          </h3>
          <p className="text-gray-600 text-lg">
            Create your first medicine schedule to get started
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {schedules.map((schedule) => (
        <Card key={schedule.id} className="shadow-lg border-none transition-all hover:shadow-xl bg-white border-gray-200">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-xl font-bold text-gray-900 mb-2">
                  {schedule.medicine_name}
                </CardTitle>
                <div className="flex flex-wrap gap-2 mb-2">
                  <Badge className={schedule.active ? "bg-green-100 text-green-800 border-green-200" : "bg-gray-100 text-gray-800 border-gray-200"}>
                    {schedule.active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(schedule)}
                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDelete(schedule.id)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="pt-0">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-gray-500" />
                  <span className="text-gray-600">Time:</span>
                </div>
                <span className="font-bold text-lg text-blue-600">
                  {schedule.intake_time}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-gray-500" />
                  <span className="text-gray-600">Days:</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {Array.isArray(schedule.days) ? schedule.days.map((day) => (
                    <Badge key={day} className="bg-blue-100 text-blue-800 border-blue-200 text-xs">
                      {day.substring(0, 3)}
                    </Badge>
                  )) : (
                    <Badge className="bg-blue-100 text-blue-800 border-blue-200 text-xs">
                      {schedule.days}
                    </Badge>
                  )}
                </div>
              </div>

              <div className="pt-2 border-t border-gray-200">
                <div className="text-sm text-gray-500">
                  Created: {format(parseISO(schedule.created_date), 'MMM dd, yyyy')}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
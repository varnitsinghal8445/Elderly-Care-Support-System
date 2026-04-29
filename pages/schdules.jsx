import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Calendar as CalendarIcon, Mail } from "lucide-react";

import ScheduleForm from "@/components/schedule/ScheduleForm";
import ScheduleList from "@/components/schedule/ScheduleList";

export default function Schedule() {
  const [showForm, setShowForm] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const queryClient = useQueryClient();

  const { data: medicines = [], isLoading: medicinesLoading, error: medicinesError } = useQuery({
    queryKey: ['activeMedicines'],
    queryFn: async () => {
      // Backend now uses session to filter by user automatically
      return base44.entities.Medicine.filter({ 
        active: true 
      });
    },
    initialData: [],
  });

  const { data: schedules = [], isLoading } = useQuery({
    queryKey: ['schedules'],
    queryFn: async () => {
      // Backend now uses session to filter by user automatically
      return base44.entities.MedicineSchedule.filter({}, '-created_date');
    },
    initialData: [],
  });

  const createScheduleMutation = useMutation({
    mutationFn: async (scheduleData) => {
      // Backend now sets created_by from session automatically
      return base44.entities.MedicineSchedule.create(scheduleData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      setShowForm(false);
      setEditingSchedule(null);
    },
  });

  const updateScheduleMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.MedicineSchedule.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      setShowForm(false);
      setEditingSchedule(null);
    },
  });

  const deleteScheduleMutation = useMutation({
    mutationFn: (id) => base44.entities.MedicineSchedule.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
    },
  });

  const handleSubmit = (scheduleData) => {
    if (editingSchedule) {
      updateScheduleMutation.mutate({ id: editingSchedule.id, data: scheduleData });
    } else {
      createScheduleMutation.mutate(scheduleData);
    }
  };

  const handleEdit = (schedule) => {
    setEditingSchedule(schedule);
    setShowForm(true);
  };

  const handleDelete = (id) => {
    if (confirm("Are you sure you want to delete this schedule?")) {
      deleteScheduleMutation.mutate(id);
    }
  };

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-blue-50 via-white to-green-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Medicine Schedule</h1>
            <p className="text-gray-600 mt-2 text-lg">Set reminders for your medicines</p>
          </div>
          <Button
            size="lg"
            onClick={() => {
              setEditingSchedule(null);
              setShowForm(!showForm);
            }}
            className="bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white text-lg px-6 py-6"
            disabled={!medicinesLoading && medicines.length === 0}
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Schedule
          </Button>
        </div>

        {!medicinesLoading && medicines.length === 0 && (
          <Card className="shadow-lg border-none mb-6 bg-yellow-50 border-yellow-200">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <CalendarIcon className="w-6 h-6 text-yellow-600" />
                <p className="text-yellow-800 font-semibold text-lg">
                  Please add medicines first before creating schedules
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="shadow-lg border-none mb-6 bg-blue-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <Mail className="w-8 h-8 text-blue-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-xl font-semibold text-blue-900 mb-2">Email Reminders</h3>
                <p className="text-blue-800 text-lg leading-relaxed">
                  Once you create schedules, you can send email reminders from the Dashboard. 
                  Each email will include easy "I Took It" and "I Missed It" buttons that automatically 
                  update your intake logs when clicked.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {showForm && (
          <ScheduleForm
            schedule={editingSchedule}
            medicines={medicines}
            onSubmit={handleSubmit}
            onCancel={() => {
              setShowForm(false);
              setEditingSchedule(null);
            }}
            isLoading={createScheduleMutation.isPending || updateScheduleMutation.isPending}
          />
        )}

        <ScheduleList
          schedules={schedules}
          isLoading={isLoading}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </div>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { X, Save } from 'lucide-react';

export default function ScheduleForm({ schedule, medicines, onSubmit, onCancel, isLoading }) {
  const [formData, setFormData] = useState({
    medicine_id: '',
    medicine_name: '',
    intake_time: '',
    days: [],
    active: true
  });

  const dayOptions = [
    { value: 'Monday', label: 'Monday' },
    { value: 'Tuesday', label: 'Tuesday' },
    { value: 'Wednesday', label: 'Wednesday' },
    { value: 'Thursday', label: 'Thursday' },
    { value: 'Friday', label: 'Friday' },
    { value: 'Saturday', label: 'Saturday' },
    { value: 'Sunday', label: 'Sunday' }
  ];

  useEffect(() => {
    if (schedule) {
      setFormData({
        medicine_id: schedule.medicine_id || '',
        medicine_name: schedule.medicine_name || '',
        intake_time: schedule.intake_time || '',
        days: Array.isArray(schedule.days) ? schedule.days : (schedule.days ? schedule.days.split(',') : []),
        active: schedule.active !== undefined ? schedule.active : true
      });
    }
  }, [schedule]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.medicine_name || !formData.intake_time || formData.days.length === 0) {
      alert('Please fill in all required fields');
      return;
    }
    onSubmit(formData);
  };

  const handleMedicineChange = (medicineId) => {
    const medicine = medicines.find(m => m.id.toString() === medicineId);
    if (medicine) {
      setFormData(prev => ({
        ...prev,
        medicine_id: medicine.id,
        medicine_name: medicine.med_name
      }));
    }
  };

  const handleDayChange = (day, checked) => {
    setFormData(prev => ({
      ...prev,
      days: checked 
        ? [...prev.days, day]
        : prev.days.filter(d => d !== day)
    }));
  };

  return (
    <Card className="shadow-xl border-none mb-8">
      <CardHeader className="bg-gradient-to-r from-blue-500 to-green-500 text-white rounded-t-lg">
        <CardTitle className="text-2xl flex items-center justify-between">
          {schedule ? 'Edit Schedule' : 'Add New Schedule'}
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="text-white hover:bg-white/20"
          >
            <X className="w-5 h-5" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="medicine" className="text-lg font-semibold">
                Medicine *
              </Label>
              <Select
                value={formData.medicine_id.toString()}
                onValueChange={handleMedicineChange}
                disabled={isLoading}
              >
                <SelectTrigger className="text-lg py-6">
                  <SelectValue placeholder="Select a medicine" />
                </SelectTrigger>
                <SelectContent>
                  {medicines.map((medicine) => (
                    <SelectItem key={medicine.id} value={medicine.id.toString()}>
                      {medicine.med_name} - {medicine.dosage}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="intake_time" className="text-lg font-semibold">
                Intake Time *
              </Label>
              <Input
                id="intake_time"
                type="time"
                value={formData.intake_time}
                onChange={(e) => setFormData(prev => ({ ...prev, intake_time: e.target.value }))}
                className="text-lg py-6"
                disabled={isLoading}
                required
              />
            </div>
          </div>

          <div className="space-y-4">
            <Label className="text-lg font-semibold">
              Days of the Week *
            </Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {dayOptions.map((day) => (
                <div key={day.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={day.value}
                    checked={formData.days.includes(day.value)}
                    onCheckedChange={(checked) => handleDayChange(day.value, checked)}
                    disabled={isLoading}
                  />
                  <Label
                    htmlFor={day.value}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {day.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
              className="text-lg px-8 py-6"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white text-lg px-8 py-6"
            >
              <Save className="w-5 h-5 mr-2" />
              {isLoading ? 'Saving...' : (schedule ? 'Update Schedule' : 'Add Schedule')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
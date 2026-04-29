import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { X, Save } from 'lucide-react';

export default function MedicineForm({ medicine, onSubmit, onCancel, isLoading }) {
  const [formData, setFormData] = useState({
    med_name: '',
    dosage: '',
    frequency: 1,
    prescribed_by: '',
    notes: '',
    active: true
  });

  useEffect(() => {
    if (medicine) {
      setFormData({
        med_name: medicine.med_name || '',
        dosage: medicine.dosage || '',
        frequency: medicine.frequency || 1,
        prescribed_by: medicine.prescribed_by || '',
        notes: medicine.notes || '',
        active: medicine.active !== undefined ? medicine.active : true
      });
    }
  }, [medicine]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.med_name || !formData.dosage) {
      alert('Please fill in medicine name and dosage');
      return;
    }
    onSubmit(formData);
  };

  return (
    <Card className="shadow-xl border-none mb-8">
      <CardHeader className="bg-gradient-to-r from-blue-500 to-green-500 text-white rounded-t-lg">
        <CardTitle className="text-2xl flex items-center justify-between">
          {medicine ? 'Edit Medicine' : 'Add New Medicine'}
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
              <Label htmlFor="med_name" className="text-lg font-semibold">
                Medicine Name *
              </Label>
              <Input
                id="med_name"
                type="text"
                value={formData.med_name}
                onChange={(e) => setFormData(prev => ({ ...prev, med_name: e.target.value }))}
                placeholder="Enter medicine name"
                className="text-lg py-6"
                disabled={isLoading}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dosage" className="text-lg font-semibold">
                Dosage *
              </Label>
              <Input
                id="dosage"
                type="text"
                value={formData.dosage}
                onChange={(e) => setFormData(prev => ({ ...prev, dosage: e.target.value }))}
                placeholder="e.g., 500mg, 1 tablet"
                className="text-lg py-6"
                disabled={isLoading}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="frequency" className="text-lg font-semibold">
                Frequency (per day)
              </Label>
              <Input
                id="frequency"
                type="number"
                min="1"
                max="10"
                value={formData.frequency}
                onChange={(e) => setFormData(prev => ({ ...prev, frequency: parseInt(e.target.value) || 1 }))}
                className="text-lg py-6"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="prescribed_by" className="text-lg font-semibold">
                Prescribed By
              </Label>
              <Input
                id="prescribed_by"
                type="text"
                value={formData.prescribed_by}
                onChange={(e) => setFormData(prev => ({ ...prev, prescribed_by: e.target.value }))}
                placeholder="Doctor's name"
                className="text-lg py-6"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="notes" className="text-lg font-semibold">
                Notes
              </Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Additional notes about the medicine..."
                className="text-lg py-6 min-h-[100px]"
                disabled={isLoading}
              />
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
              {isLoading ? 'Saving...' : (medicine ? 'Update Medicine' : 'Add Medicine')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
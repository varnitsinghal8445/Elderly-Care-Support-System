import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, Pill, User, Calendar } from 'lucide-react';
import { format, parseISO } from 'date-fns';

export default function MedicineCard({ medicine, onEdit, onDelete }) {
  const getStatusBadge = () => {
    return medicine.active ? 
      <Badge className="bg-green-100 text-green-800 border-green-200">Active</Badge> :
      <Badge className="bg-gray-100 text-gray-800 border-gray-200">Inactive</Badge>;
  };

  return (
    <Card className="shadow-lg border-none transition-all hover:shadow-xl bg-white border-gray-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-xl font-bold text-gray-900 mb-2">
              {medicine.med_name}
            </CardTitle>
            <div className="flex flex-wrap gap-2 mb-2">
              {getStatusBadge()}
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(medicine)}
              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete(medicine.id)}
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
              <Pill className="w-5 h-5 text-gray-500" />
              <span className="text-gray-600">Dosage:</span>
            </div>
            <span className="font-semibold text-gray-900">
              {medicine.dosage}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Pill className="w-5 h-5 text-gray-500" />
              <span className="text-gray-600">Frequency:</span>
            </div>
            <span className="font-semibold text-gray-900">
              {medicine.frequency} time{medicine.frequency > 1 ? 's' : ''} per day
            </span>
          </div>

          {medicine.prescribed_by && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-gray-500" />
                <span className="text-gray-600">Prescribed by:</span>
              </div>
              <span className="font-semibold text-gray-900">
                {medicine.prescribed_by}
              </span>
            </div>
          )}

          {medicine.notes && (
            <div className="pt-2">
              <div className="text-sm text-gray-600 mb-1">Notes:</div>
              <div className="text-sm text-gray-800 bg-gray-50 p-3 rounded-lg">
                {medicine.notes}
              </div>
            </div>
          )}

          <div className="pt-2 border-t border-gray-200">
            <div className="text-sm text-gray-500">
              Added: {format(parseISO(medicine.created_date), 'MMM dd, yyyy')}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
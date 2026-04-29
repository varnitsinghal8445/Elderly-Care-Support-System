import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Save } from 'lucide-react';

export default function StockForm({ stock, medicines, existingStocks, onSubmit, onCancel, isLoading }) {
  const [formData, setFormData] = useState({
    medicine_id: '',
    medicine_name: '',
    quantity: '',
    unit: 'tablets',
    threshold: '',
    expiry_date: ''
  });

  useEffect(() => {
    if (stock) {
      setFormData({
        medicine_id: stock.medicine_id || '',
        medicine_name: stock.medicine_name || '',
        quantity: stock.quantity || '',
        unit: stock.unit || 'tablets',
        threshold: stock.threshold || '',
        expiry_date: stock.expiry_date || ''
      });
    }
  }, [stock]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.medicine_name || !formData.quantity || !formData.threshold) {
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

  return (
    <Card className="shadow-xl border-none mb-8">
      <CardHeader className="bg-gradient-to-r from-blue-500 to-green-500 text-white rounded-t-lg">
        <CardTitle className="text-2xl flex items-center justify-between">
          {stock ? 'Edit Stock Entry' : 'Add Stock Entry'}
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
              <Label htmlFor="quantity" className="text-lg font-semibold">
                Quantity *
              </Label>
              <Input
                id="quantity"
                type="number"
                step="0.1"
                min="0"
                value={formData.quantity}
                onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
                placeholder="Enter quantity"
                className="text-lg py-6"
                disabled={isLoading}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit" className="text-lg font-semibold">
                Unit *
              </Label>
              <Select
                value={formData.unit}
                onValueChange={(value) => setFormData(prev => ({ ...prev, unit: value }))}
                disabled={isLoading}
              >
                <SelectTrigger className="text-lg py-6">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tablets">Tablets</SelectItem>
                  <SelectItem value="capsules">Capsules</SelectItem>
                  <SelectItem value="ml">ML</SelectItem>
                  <SelectItem value="mg">MG</SelectItem>
                  <SelectItem value="pieces">Pieces</SelectItem>
                  <SelectItem value="bottles">Bottles</SelectItem>
                  <SelectItem value="tubes">Tubes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="threshold" className="text-lg font-semibold">
                Low Stock Threshold *
              </Label>
              <Input
                id="threshold"
                type="number"
                step="0.1"
                min="0"
                value={formData.threshold}
                onChange={(e) => setFormData(prev => ({ ...prev, threshold: e.target.value }))}
                placeholder="Alert when quantity reaches"
                className="text-lg py-6"
                disabled={isLoading}
                required
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="expiry_date" className="text-lg font-semibold">
                Expiry Date
              </Label>
              <Input
                id="expiry_date"
                type="date"
                value={formData.expiry_date}
                onChange={(e) => setFormData(prev => ({ ...prev, expiry_date: e.target.value }))}
                className="text-lg py-6"
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
              {isLoading ? 'Saving...' : (stock ? 'Update Stock' : 'Add Stock')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
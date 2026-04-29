import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, AlertTriangle, Calendar, Package } from 'lucide-react';
import { format, parseISO, isAfter, isBefore } from 'date-fns';

export default function StockCard({ stock, onEdit, onDelete }) {
  const isLowStock = stock.quantity <= stock.threshold;
  const isOutOfStock = stock.quantity === 0;
  
  const isExpired = stock.expiry_date && isBefore(parseISO(stock.expiry_date), new Date());
  const isExpiringSoon = stock.expiry_date && 
    isAfter(parseISO(stock.expiry_date), new Date()) && 
    isBefore(parseISO(stock.expiry_date), new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));

  const getStatusBadge = () => {
    if (isOutOfStock) {
      return <Badge className="bg-red-100 text-red-800 border-red-200">Out of Stock</Badge>;
    }
    if (isLowStock) {
      return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Low Stock</Badge>;
    }
    return <Badge className="bg-green-100 text-green-800 border-green-200">In Stock</Badge>;
  };

  const getExpiryBadge = () => {
    if (isExpired) {
      return <Badge className="bg-red-100 text-red-800 border-red-200">Expired</Badge>;
    }
    if (isExpiringSoon) {
      return <Badge className="bg-orange-100 text-orange-800 border-orange-200">Expiring Soon</Badge>;
    }
    return null;
  };

  return (
    <Card className={`shadow-lg border-none transition-all hover:shadow-xl ${
      isOutOfStock ? 'border-red-200 bg-red-50' : 
      isLowStock ? 'border-yellow-200 bg-yellow-50' : 
      'border-gray-200 bg-white'
    }`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-xl font-bold text-gray-900 mb-2">
              {stock.medicine_name}
            </CardTitle>
            <div className="flex flex-wrap gap-2 mb-2">
              {getStatusBadge()}
              {getExpiryBadge()}
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(stock)}
              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete(stock.id)}
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
              <Package className="w-5 h-5 text-gray-500" />
              <span className="text-gray-600">Current Stock:</span>
            </div>
            <span className={`font-bold text-lg ${
              isOutOfStock ? 'text-red-600' : 
              isLowStock ? 'text-yellow-600' : 
              'text-green-600'
            }`}>
              {stock.quantity} {stock.unit}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-gray-500" />
              <span className="text-gray-600">Alert Threshold:</span>
            </div>
            <span className="font-semibold text-gray-900">
              {stock.threshold} {stock.unit}
            </span>
          </div>

          {stock.expiry_date && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-gray-500" />
                <span className="text-gray-600">Expiry Date:</span>
              </div>
              <span className={`font-semibold ${
                isExpired ? 'text-red-600' : 
                isExpiringSoon ? 'text-orange-600' : 
                'text-gray-900'
              }`}>
                {format(parseISO(stock.expiry_date), 'MMM dd, yyyy')}
              </span>
            </div>
          )}

          <div className="pt-2 border-t border-gray-200">
            <div className="text-sm text-gray-500">
              Added: {format(parseISO(stock.created_date), 'MMM dd, yyyy')}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
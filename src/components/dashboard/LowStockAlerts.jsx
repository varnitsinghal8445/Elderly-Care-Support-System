import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Package, ExternalLink } from 'lucide-react';

export default function LowStockAlerts({ lowStockItems }) {
  if (!lowStockItems || lowStockItems.length === 0) {
    return (
      <Card className="shadow-lg border-none">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-green-600" />
            Stock Alerts
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <Package className="w-12 h-12 text-green-300 mx-auto mb-3" />
          <p className="text-gray-500">All medicines are well stocked!</p>
        </CardContent>
      </Card>
    );
  }

  const urgentItems = lowStockItems.filter(item => item.quantity === 0);
  const lowItems = lowStockItems.filter(item => item.quantity > 0);

  return (
    <Card className="shadow-lg border-none">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <AlertTriangle className="w-6 h-6 text-yellow-600" />
          Stock Alerts ({lowStockItems.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {urgentItems.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-red-600 mb-2">🚨 Out of Stock</h4>
              {urgentItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg mb-2">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                    <div>
                      <p className="font-medium text-red-900">{item.medicine_name}</p>
                      <p className="text-sm text-red-700">Completely out of stock!</p>
                    </div>
                  </div>
                  <Badge className="bg-red-100 text-red-800 border-red-200">0 {item.unit}</Badge>
                </div>
              ))}
            </div>
          )}

          {lowItems.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-yellow-600 mb-2">⚠️ Low Stock</h4>
              {lowItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg mb-2">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-yellow-600" />
                    <div>
                      <p className="font-medium text-yellow-900">{item.medicine_name}</p>
                      <p className="text-sm text-yellow-700">Running low on stock</p>
                    </div>
                  </div>
                  <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                    {item.quantity} {item.unit}
                  </Badge>
                </div>
              ))}
            </div>
          )}

          <div className="pt-4 border-t border-gray-200">
            <Button
              variant="outline"
              className="w-full text-blue-600 hover:text-blue-700 hover:bg-blue-50"
              onClick={() => window.location.href = '/stock'}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Manage Stock
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
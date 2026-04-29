import React from 'react';
import { Button } from '@/components/ui/button';
import { useNotification } from '@/contexts/NotificationContext';
import { Bell, AlertTriangle, Package } from 'lucide-react';

export default function NotificationTest() {
  const { showNotification } = useNotification();

  const testNotifications = [
    {
      notification_type: 'reminder',
      title: 'Medicine Reminder',
      message: 'Time to take Aspirin at 8:00 AM',
      medicine_name: 'Aspirin',
      priority: 'medium'
    },
    {
      notification_type: 'low_stock',
      title: 'Low Stock Alert',
      message: 'Paracetamol stock is low (5 tablets remaining)',
      medicine_name: 'Paracetamol',
      priority: 'high'
    },
    {
      notification_type: 'out_of_stock',
      title: 'Out of Stock',
      message: 'Vitamin D is completely out of stock!',
      medicine_name: 'Vitamin D',
      priority: 'urgent'
    }
  ];

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Bell className="w-5 h-5" />
        Test Notification System
      </h3>
      <div className="space-y-3">
        {testNotifications.map((notification, index) => (
          <Button
            key={index}
            variant="outline"
            onClick={() => showNotification(notification)}
            className="w-full justify-start"
          >
            {notification.notification_type === 'reminder' && <Bell className="w-4 h-4 mr-2" />}
            {notification.notification_type === 'low_stock' && <Package className="w-4 h-4 mr-2" />}
            {notification.notification_type === 'out_of_stock' && <AlertTriangle className="w-4 h-4 mr-2" />}
            Test {notification.title}
          </Button>
        ))}
      </div>
    </div>
  );
}



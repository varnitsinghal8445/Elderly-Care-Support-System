import React from 'react';
import { X, Bell, AlertTriangle, Package, Clock, CheckCircle } from 'lucide-react';
import { useNotification } from '@/contexts/NotificationContext';

const NotificationPopup = ({ notification, onClose }) => {
  const getIcon = (type, priority) => {
    switch (type) {
      case 'reminder':
        return <Bell className="w-6 h-6" />;
      case 'low_stock':
      case 'out_of_stock':
        return <Package className="w-6 h-6" />;
      case 'missed_dose':
        return <Clock className="w-6 h-6" />;
      default:
        return priority === 'urgent' || priority === 'high' ? 
          <AlertTriangle className="w-6 h-6" /> : 
          <Bell className="w-6 h-6" />;
    }
  };

  const getColorClasses = (type, priority) => {
    if (type === 'out_of_stock' || priority === 'urgent') {
      return 'bg-red-500 border-red-600';
    }
    if (type === 'low_stock' || priority === 'high') {
      return 'bg-orange-500 border-orange-600';
    }
    if (type === 'missed_dose') {
      return 'bg-yellow-500 border-yellow-600';
    }
    return 'bg-blue-500 border-blue-600';
  };

  return (
    <div className={`fixed top-4 right-4 z-50 max-w-sm w-full bg-white rounded-lg shadow-xl border-2 ${getColorClasses(notification.notification_type, notification.priority)} animate-in slide-in-from-right duration-300`}>
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-full ${getColorClasses(notification.notification_type, notification.priority)} flex items-center justify-center text-white flex-shrink-0`}>
            {getIcon(notification.notification_type, notification.priority)}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 text-sm mb-1">
              {notification.title}
            </h3>
            <p className="text-gray-700 text-sm mb-2">
              {notification.message}
            </p>
            {notification.medicine_name && (
              <p className="text-xs text-gray-500">
                Medicine: {notification.medicine_name}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export const NotificationContainer = () => {
  const { notifications, removeNotification } = useNotification();

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {notifications.map((notification) => (
        <NotificationPopup
          key={notification.id}
          notification={notification}
          onClose={() => removeNotification(notification.id)}
        />
      ))}
    </div>
  );
};



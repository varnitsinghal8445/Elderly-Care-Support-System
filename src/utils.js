import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function createPageUrl(pageName) {
  const pageMap = {
    Dashboard: '/dashboard',
    Medicines: '/medicines',
    Schedule: '/schedule',
    AutoReminders: '/auto-reminders',
    Stock: '/stock',
    Logs: '/logs',
    Notifications: '/notifications',
    Reports: '/reports',
    Profile: '/profile',
  };
  return pageMap[pageName] || '/';
}

import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Layout from '../layouts/layouts.jsx';
import Loading from '@/components/ui/loading';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { NotificationContainer } from '@/components/NotificationContainer';

// Import pages
import Login from '../pages/login.jsx';
import Signup from '../pages/signup.jsx';
import Dashboard from '../pages/dashboard.jsx';
import Medicines from '../pages/mediciens.jsx';
import Schedule from '../pages/schdules.jsx';
import AutoReminders from '../pages/auto_reminders.jsx';
import Stock from '../pages/stock.jsx';
import Logs from '../pages/logs.jsx';
import Notifications from '../pages/notifications.jsx';
import Reports from '../pages/reports.jsx';
import Profile from '../pages/profile.jsx';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5000,
    },
  },
});

// Protected Route Component
function ProtectedRoute({ children }) {
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
}

// Public Route Component (redirect to dashboard if already logged in)
function PublicRoute({ children }) {
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
  
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <NotificationProvider>
        <Router>
          <Suspense fallback={<Loading />}>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
              <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />
              
              {/* Protected Routes */}
              <Route path="/dashboard" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
              <Route path="/medicines" element={<ProtectedRoute><Layout><Medicines /></Layout></ProtectedRoute>} />
              <Route path="/schedule" element={<ProtectedRoute><Layout><Schedule /></Layout></ProtectedRoute>} />
              <Route path="/auto-reminders" element={<ProtectedRoute><Layout><AutoReminders /></Layout></ProtectedRoute>} />
              <Route path="/stock" element={<ProtectedRoute><Layout><Stock /></Layout></ProtectedRoute>} />
              <Route path="/logs" element={<ProtectedRoute><Layout><Logs /></Layout></ProtectedRoute>} />
              <Route path="/notifications" element={<ProtectedRoute><Layout><Notifications /></Layout></ProtectedRoute>} />
              <Route path="/reports" element={<ProtectedRoute><Layout><Reports /></Layout></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><Layout><Profile /></Layout></ProtectedRoute>} />
            </Routes>
          </Suspense>
          <NotificationContainer />
        </Router>
      </NotificationProvider>
    </QueryClientProvider>
  );
}

export default App;

import React from "react";
import { Pill } from "lucide-react";

export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-green-500 mb-6 shadow-lg animate-pulse">
          <Pill className="w-10 h-10 text-white animate-spin" style={{ animationDuration: '2s' }} />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">ElderCare</h2>
        <p className="text-gray-600">Loading your health dashboard...</p>
        <div className="mt-6 flex justify-center gap-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>
    </div>
  );
}

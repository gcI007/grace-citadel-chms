import React, { useState } from 'react';
import { Users, RefreshCw } from 'lucide-react';

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header section matching your screenshot */}
      <header className="bg-white shadow-sm border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="bg-orange-500 p-2 rounded-lg text-white">
            <Users size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Grace Citadel ChMS</h1>
            <p className="text-sm text-gray-500">Relational Database Core & Outreach Node</p>
          </div>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 text-sm border rounded-md hover:bg-gray-50 text-gray-600">
          <RefreshCw size={16} />
          Reset Seeds
        </button>
      </header>

      {/* Restored Dashboard Content */}
      <main className="flex-1 p-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <h2 className="text-lg font-semibold mb-2 text-gray-900">Member Directory</h2>
            <p className="text-gray-500 text-sm mb-4">Manage congregation records and contact info.</p>
            <button className="text-blue-600 font-medium text-sm hover:underline">View Members &rarr;</button>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <h2 className="text-lg font-semibold mb-2 text-gray-900">AI Outreach</h2>
            <p className="text-gray-500 text-sm mb-4">Draft personalized messages using Gemini.</p>
            <button className="text-blue-600 font-medium text-sm hover:underline">Draft Message &rarr;</button>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <h2 className="text-lg font-semibold mb-2 text-gray-900">Service Attendance</h2>
            <p className="text-gray-500 text-sm mb-4">Track and visualize Sunday service numbers.</p>
            <button className="text-blue-600 font-medium text-sm hover:underline">Log Attendance &rarr;</button>
          </div>

        </div>
      </main>
    </div>
  );
}
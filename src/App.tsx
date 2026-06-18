import React, { useState } from 'react';
import { Users, RefreshCw, ArrowLeft } from 'lucide-react';

export default function App() {
  // This is the "brain" that remembers which page we are looking at
  const [activeView, setActiveView] = useState('dashboard');

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="bg-orange-500 p-2 rounded-lg text-white cursor-pointer" onClick={() => setActiveView('dashboard')}>
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

      {/* Main Content Area */}
      <main className="flex-1 p-6">
        
        {/* --- VIEW: DASHBOARD --- */}
        {activeView === 'dashboard' && (
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border">
              <h2 className="text-lg font-semibold mb-2 text-gray-900">Member Directory</h2>
              <p className="text-gray-500 text-sm mb-4">Manage congregation records and contact info.</p>
              <button onClick={() => setActiveView('members')} className="text-blue-600 font-medium text-sm hover:underline">View Members &rarr;</button>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border">
              <h2 className="text-lg font-semibold mb-2 text-gray-900">AI Outreach</h2>
              <p className="text-gray-500 text-sm mb-4">Draft personalized messages using Gemini.</p>
              <button onClick={() => setActiveView('outreach')} className="text-blue-600 font-medium text-sm hover:underline">Draft Message &rarr;</button>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border">
              <h2 className="text-lg font-semibold mb-2 text-gray-900">Service Attendance</h2>
              <p className="text-gray-500 text-sm mb-4">Track and visualize Sunday service numbers.</p>
              <button onClick={() => setActiveView('attendance')} className="text-blue-600 font-medium text-sm hover:underline">Log Attendance &rarr;</button>
            </div>
          </div>
        )}

        {/* --- VIEW: MEMBER DIRECTORY --- */}
        {activeView === 'members' && (
          <div className="max-w-4xl mx-auto bg-white p-6 rounded-xl shadow-sm border">
            <button onClick={() => setActiveView('dashboard')} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-6">
              <ArrowLeft size={16} /> Back to Dashboard
            </button>
            <h2 className="text-2xl font-bold mb-4">Member Directory</h2>
            <p className="text-gray-600 mb-4">This is where your Supabase Member Table will load.</p>
            {/* Future Member Form goes here */}
          </div>
        )}

        {/* --- VIEW: AI OUTREACH --- */}
        {activeView === 'outreach' && (
          <div className="max-w-4xl mx-auto bg-white p-6 rounded-xl shadow-sm border">
            <button onClick={() => setActiveView('dashboard')} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-6">
              <ArrowLeft size={16} /> Back to Dashboard
            </button>
            <h2 className="text-2xl font-bold mb-4">AI Outreach Drafter</h2>
            <p className="text-gray-600 mb-4">This is where your Gemini Prompt Box will go to draft messages.</p>
            {/* Future AI Form goes here */}
          </div>
        )}

        {/* --- VIEW: ATTENDANCE --- */}
        {activeView === 'attendance' && (
          <div className="max-w-4xl mx-auto bg-white p-6 rounded-xl shadow-sm border">
            <button onClick={() => setActiveView('dashboard')} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-6">
              <ArrowLeft size={16} /> Back to Dashboard
            </button>
            <h2 className="text-2xl font-bold mb-4">Service Attendance</h2>
            <p className="text-gray-600 mb-4">This is where the ushers will input Sunday headcounts.</p>
            {/* Future Attendance Form goes here */}
          </div>
        )}

      </main>
    </div>
  );
}
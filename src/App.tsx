import React, { useState } from 'react';
import { Users, RefreshCw, ArrowLeft } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

// 1. INITIALIZE SUPABASE
// It pulls your secret keys directly from Render's environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function App() {
  const [activeView, setActiveView] = useState('dashboard');

  // 2. FORM MEMORY (State)
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 3. THE DATABASE SAVING FUNCTION
  const handleSaveMember = async (e: React.FormEvent) => {
    e.preventDefault(); // Prevents the page from reloading
    setIsSubmitting(true);
    setStatusMessage('Saving to secure database...');

    try {
      // Send the data to the 'members' table in Supabase
      const { error } = await supabase
        .from('members')
        .insert([
          { full_name: name, email: email, phone_number: phone }
        ]);

      if (error) throw error;

      // If successful, clear the form and show a success message
      setStatusMessage('✅ Member successfully saved to Grace Citadel roster!');
      setName('');
      setEmail('');
      setPhone('');
    } catch (error: any) {
      // If it fails, show the exact error so we can fix it
      setStatusMessage('❌ Error: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

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
              <button onClick={() => {setActiveView('members'); setStatusMessage('');}} className="text-blue-600 font-medium text-sm hover:underline">View Members &rarr;</button>
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
            <p className="text-gray-600 mb-6">Add new members to the centralized roster below.</p>
            
            {/* The Database Form */}
            <form onSubmit={handleSaveMember} className="flex flex-col gap-4 max-w-md">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input 
                  type="text" 
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-gray-300 rounded-md p-2" 
                  placeholder="e.g. John Doe" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-gray-300 rounded-md p-2" 
                  placeholder="john@example.com" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <input 
                  type="tel" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full border border-gray-300 rounded-md p-2" 
                  placeholder="+234..." 
                />
              </div>
              
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="bg-orange-500 text-white px-4 py-2 rounded-md hover:bg-orange-600 font-medium mt-2 transition-colors disabled:bg-gray-400"
              >
                {isSubmitting ? 'Saving...' : 'Save Member Record'}
              </button>

              {/* Status Message Display */}
              {statusMessage && (
                <div className={`p-3 rounded-md mt-2 text-sm font-medium ${statusMessage.includes('✅') ? 'bg-green-100 text-green-800' : statusMessage.includes('❌') ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>
                  {statusMessage}
                </div>
              )}
            </form>
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
          </div>
        )}

      </main>
    </div>
  );
}
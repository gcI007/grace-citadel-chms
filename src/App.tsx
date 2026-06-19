import React, { useState, useEffect } from 'react';
import { Users, ArrowLeft, Sparkles, Lock, LogOut, Cake, CheckSquare, Search, UserPlus, ClipboardList, UserMinus } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

// --- INITIALIZE SUPABASE ---
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function App() {
  // --- AUTHENTICATION STATE ---
  const [session, setSession] = useState<any>(null);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState('');

  // --- APP STATE ---
  const [activeView, setActiveView] = useState('dashboard');
  const [birthdays, setBirthdays] = useState<any[]>([]);

  // --- MEMBER FORM STATE ---
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [occupation, setOccupation] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('');
  const [memberStatus, setMemberStatus] = useState('Regular');
  const [statusMessage, setStatusMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- ROSTER STATES ---
  const [guestList, setGuestList] = useState<any[]>([]);
  const [absenteeList, setAbsenteeList] = useState<any[]>([]); // NEW: Absentee State

  // --- AI OUTREACH STATE ---
  const [promptContext, setPromptContext] = useState('');
  const [generatedMessage, setGeneratedMessage] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // --- INDIVIDUAL CHECK-IN STATE ---
  const [memberList, setMemberList] = useState<any[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [checkinDate, setCheckinDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [checkinStatusMessage, setCheckinStatusMessage] = useState('');

  // --- 1. THE SECURITY GUARD ---
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session));
    return () => subscription.unsubscribe();
  }, []);

  // --- 2. FETCH DASHBOARD DATA ---
  useEffect(() => {
    if (session && activeView === 'dashboard') fetchBirthdays();
    if (session && activeView === 'attendance') {
      fetchMembersForCheckin();
      setSelectedMembers([]); setCheckinStatusMessage(''); setSearchTerm('');
    }
    if (session && activeView === 'guests') fetchGuests();
    if (session && activeView === 'absentees') fetchAbsentees(); // Trigger Absentee fetch
  }, [session, activeView]);

  const fetchBirthdays = async () => {
    const { data } = await supabase.from('members').select('full_name, date_of_birth');
    if (data) {
      const currentMonth = new Date().toLocaleString('default', { month: 'long' });
      const upcoming = data.filter(m => m.date_of_birth && m.date_of_birth.toLowerCase().includes(currentMonth.toLowerCase()));
      setBirthdays(upcoming);
    }
  };

  const fetchMembersForCheckin = async () => {
    const { data } = await supabase.from('members').select('full_name').order('full_name');
    if (data) setMemberList(data);
  };

  const fetchGuests = async () => {
    const { data } = await supabase.from('members').select('*').in('status', ['1st Timer', '2nd Timer']).order('created_at', { ascending: false });
    if (data) setGuestList(data);
  };

  // --- NEW: FETCH ABSENTEES ENGINE (Missing for 14+ days) ---
  const fetchAbsentees = async () => {
    // 1. Calculate the date 14 days ago
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
    const cutoffDate = fourteenDaysAgo.toISOString().split('T')[0];

    // 2. Fetch ALL members
    const { data: allMembers } = await supabase.from('members').select('*').order('full_name');
    
    // 3. Fetch anyone who checked in during the last 14 days
    const { data: recentCheckins } = await supabase
      .from('member_checkins')
      .select('member_name')
      .gte('service_date', cutoffDate);

    if (allMembers && recentCheckins) {
      // 4. Create a fast-lookup list of names who DID attend
      const recentAttendees = new Set(recentCheckins.map(c => c.member_name));
      
      // 5. Filter the main member list to ONLY show people NOT in the recent attendees list
      const missingMembers = allMembers.filter(m => !recentAttendees.has(m.full_name));
      setAbsenteeList(missingMembers);
    }
  };

  // --- LOGIN / LOGOUT ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthenticating(true); setAuthError('');
    const { error } = await supabase.auth.signInWithPassword({ email: loginEmail, password: loginPassword });
    if (error) setAuthError(error.message);
    setIsAuthenticating(false);
  };
  const handleLogout = async () => await supabase.auth.signOut();

  // --- SAVE NEW MEMBER / GUEST ---
  const handleSaveMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true); setStatusMessage('Saving to secure database...');
    try {
      const { error } = await supabase.from('members').insert([{ full_name: name, email: email, phone_number: phone, occupation: occupation, date_of_birth: dob, gender: gender, status: memberStatus }]);
      if (error) throw error;
      setStatusMessage(`✅ ${memberStatus} successfully registered!`);
      setName(''); setEmail(''); setPhone(''); setOccupation(''); setDob(''); setGender(''); setMemberStatus('Regular');
    } catch (error: any) {
      setStatusMessage('❌ Error: ' + error.message);
    } finally { setIsSubmitting(false); }
  };

  // --- SAVE BATCH CHECK-INS ---
  const toggleMemberSelection = (memberName: string) => setSelectedMembers(prev => prev.includes(memberName) ? prev.filter(n => n !== memberName) : [...prev, memberName]);
  
  const handleSaveCheckins = async () => {
    if (selectedMembers.length === 0) return setCheckinStatusMessage('❌ Please select at least one member.');
    setIsSubmitting(true); setCheckinStatusMessage('Saving attendance records...');
    try {
      const recordsToInsert = selectedMembers.map(n => ({ service_date: checkinDate, member_name: n }));
      const { error } = await supabase.from('member_checkins').insert(recordsToInsert);
      if (error) throw error;
      setCheckinStatusMessage(`✅ Successfully checked in ${selectedMembers.length} members!`);
      setSelectedMembers([]); setSearchTerm('');
    } catch (error: any) {
      setCheckinStatusMessage('❌ Error: ' + error.message);
    } finally { setIsSubmitting(false); }
  };

  // --- GENERATE AI MESSAGE ---
  const handleGenerateMessage = async () => {
    if (!promptContext) return;
    setIsGenerating(true); setGeneratedMessage('');
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      setGeneratedMessage(`[ Simulated AI Response ]\n\nBlessings!\n\nThis is a placeholder message. Once you connect your Google Billing, the real Gemini AI will read your prompt ("${promptContext}") and automatically draft a beautiful, customized message right here!`);
    } catch (error: any) {
      setGeneratedMessage('❌ Error: ' + error.message);
    } finally { setIsGenerating(false); }
  };

  // ==========================================
  // UI RENDER: LOGIN SCREEN
  // ==========================================
  if (!session) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full border border-gray-200">
          <div className="flex justify-center mb-6"><div className="bg-orange-500 p-3 rounded-full text-white"><Lock size={32} /></div></div>
          <h1 className="text-2xl font-bold text-center text-gray-900 mb-2">Grace Citadel ChMS</h1>
          <p className="text-center text-gray-500 mb-8">Authorized Personnel Only</p>
          <form onSubmit={handleLogin} className="space-y-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Admin Email</label><input type="email" required value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} className="w-full border border-gray-300 rounded-md p-3 focus:ring-2 focus:ring-orange-500 outline-none" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Password</label><input type="password" required value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} className="w-full border border-gray-300 rounded-md p-3 focus:ring-2 focus:ring-orange-500 outline-none" /></div>
            {authError && <p className="text-red-600 text-sm font-medium">{authError}</p>}
            <button type="submit" disabled={isAuthenticating} className="w-full bg-gray-900 text-white p-3 rounded-md hover:bg-gray-800 font-medium transition-colors">{isAuthenticating ? 'Authenticating...' : 'Secure Sign In'}</button>
          </form>
        </div>
      </div>
    );
  }

  // ==========================================
  // UI RENDER: MAIN APP
  // ==========================================
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white shadow-sm border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="bg-orange-500 p-2 rounded-lg text-white cursor-pointer" onClick={() => setActiveView('dashboard')}><Users size={24} /></div>
          <div><h1 className="text-xl font-bold text-gray-900">Grace Citadel ChMS</h1><p className="text-sm text-gray-500">Relational Database Core & Outreach Node</p></div>
        </div>
        <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 text-sm border border-red-200 text-red-600 rounded-md hover:bg-red-50 font-medium"><LogOut size={16} /> Sign Out</button>
      </header>

      <main className="flex-1 p-6">
        
        {/* DASHBOARD */}
        {activeView === 'dashboard' && (
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-4">
              <div className="bg-blue-500 p-2 rounded-full text-white shrink-0"><Cake size={20} /></div>
              <div>
                <h3 className="text-blue-900 font-bold text-lg">This Month's Birthdays</h3>
                {birthdays.length > 0 ? (
                  <ul className="mt-2 text-sm text-blue-800 space-y-1">{birthdays.map((b, idx) => <li key={idx}><span className="font-semibold">{b.full_name}</span> - {b.date_of_birth}</li>)}</ul>
                ) : <p className="text-sm text-blue-700 mt-1">No birthdays logged for the current month yet.</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border hover:shadow-md transition-shadow">
                <h2 className="text-lg font-semibold mb-2 text-gray-900 flex items-center gap-2"><UserPlus size={18} className="text-orange-500"/> Registration</h2>
                <p className="text-gray-500 text-sm mb-4">Register First Timers or add regular members.</p>
                <button onClick={() => {setActiveView('members'); setStatusMessage('');}} className="text-blue-600 font-medium text-sm hover:underline">Open Form &rarr;</button>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border hover:shadow-md transition-shadow">
                <h2 className="text-lg font-semibold mb-2 text-gray-900 flex items-center gap-2"><ClipboardList size={18} className="text-orange-500"/> Guest Roster</h2>
                <p className="text-gray-500 text-sm mb-4">View 1st and 2nd Timer details for follow-up.</p>
                <button onClick={() => setActiveView('guests')} className="text-blue-600 font-medium text-sm hover:underline">View Guests &rarr;</button>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border hover:shadow-md transition-shadow">
                <h2 className="text-lg font-semibold mb-2 text-red-700 flex items-center gap-2"><UserMinus size={18} className="text-red-600"/> Absentee Alert</h2>
                <p className="text-gray-500 text-sm mb-4">See members missing for 2 weeks or more.</p>
                <button onClick={() => setActiveView('absentees')} className="text-red-600 font-medium text-sm hover:underline">View Missing &rarr;</button>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border hover:shadow-md transition-shadow">
                <h2 className="text-lg font-semibold mb-2 text-gray-900 flex items-center gap-2"><CheckSquare size={18} className="text-orange-500"/> Check-In</h2>
                <p className="text-gray-500 text-sm mb-4">Track which members attended service.</p>
                <button onClick={() => setActiveView('attendance')} className="text-blue-600 font-medium text-sm hover:underline">Log Attendance &rarr;</button>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border hover:shadow-md transition-shadow lg:col-span-2">
                <h2 className="text-lg font-semibold mb-2 text-gray-900 flex items-center gap-2"><Sparkles size={18} className="text-orange-500"/> AI Outreach</h2>
                <p className="text-gray-500 text-sm mb-4">Draft personalized messages using Gemini.</p>
                <button onClick={() => setActiveView('outreach')} className="text-blue-600 font-medium text-sm hover:underline">Draft Message &rarr;</button>
              </div>
            </div>
          </div>
        )}

        {/* REGISTRATION FORM */}
        {activeView === 'members' && (
          <div className="max-w-4xl mx-auto bg-white p-6 rounded-xl shadow-sm border">
            <button onClick={() => setActiveView('dashboard')} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-6"><ArrowLeft size={16} /> Back to Dashboard</button>
            <h2 className="text-2xl font-bold mb-4">Registration Form</h2>
            <form onSubmit={handleSaveMember} className="flex flex-col gap-4 max-w-md">
              <div className="bg-orange-50 p-4 rounded-lg border border-orange-100 mb-2">
                <label className="block text-sm font-bold text-orange-900 mb-1">Registration Type (Status)</label>
                <select value={memberStatus} onChange={(e) => setMemberStatus(e.target.value)} className="w-full border border-orange-300 rounded-md p-2 bg-white outline-none focus:ring-2 focus:ring-orange-500">
                  <option value="1st Timer">1st Timer</option><option value="2nd Timer">2nd Timer</option><option value="Regular">Regular Member</option>
                </select>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label><input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full border border-gray-300 rounded-md p-2" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Gender</label><select value={gender} onChange={(e) => setGender(e.target.value)} className="w-full border border-gray-300 rounded-md p-2 bg-white"><option value="">Select...</option><option value="Male">Male</option><option value="Female">Female</option></select></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Birthday</label><input type="text" value={dob} onChange={(e) => setDob(e.target.value)} className="w-full border border-gray-300 rounded-md p-2" /></div>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Occupation</label><input type="text" value={occupation} onChange={(e) => setOccupation(e.target.value)} className="w-full border border-gray-300 rounded-md p-2" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Email</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border border-gray-300 rounded-md p-2" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Phone</label><input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full border border-gray-300 rounded-md p-2" /></div>
              <button type="submit" disabled={isSubmitting} className="bg-gray-900 text-white px-4 py-3 rounded-md hover:bg-gray-800 font-medium mt-2">{isSubmitting ? 'Saving...' : 'Save Registration'}</button>
              {statusMessage && <div className={`p-3 rounded-md mt-2 text-sm font-medium ${statusMessage.includes('✅') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{statusMessage}</div>}
            </form>
          </div>
        )}

        {/* GUEST ROSTER */}
        {activeView === 'guests' && (
          <div className="max-w-6xl mx-auto bg-white p-6 rounded-xl shadow-sm border">
            <button onClick={() => setActiveView('dashboard')} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-6"><ArrowLeft size={16} /> Back to Dashboard</button>
            <div className="flex items-center gap-2 mb-4"><ClipboardList className="text-orange-500" size={24} /><h2 className="text-2xl font-bold">Guest Follow-Up Roster</h2></div>
            <div className="overflow-x-auto border border-gray-200 rounded-lg">
              <table className="w-full text-left border-collapse">
                <thead><tr className="bg-gray-50 border-b border-gray-200 text-sm font-semibold text-gray-700"><th className="p-4">Name</th><th className="p-4">Status</th><th className="p-4">Phone</th><th className="p-4">Email</th></tr></thead>
                <tbody className="divide-y divide-gray-200">
                  {guestList.length === 0 ? (<tr><td colSpan={4} className="p-6 text-center text-gray-500">No guests found.</td></tr>) : (
                    guestList.map((guest, idx) => (
                      <tr key={idx} className="hover:bg-orange-50">
                        <td className="p-4 font-medium text-gray-900">{guest.full_name}</td>
                        <td className="p-4"><span className={`px-3 py-1 rounded-full text-xs font-bold ${guest.status === '1st Timer' ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800'}`}>{guest.status}</span></td>
                        <td className="p-4 text-gray-600">{guest.phone_number || '-'}</td>
                        <td className="p-4 text-gray-600">{guest.email || '-'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* NEW: ABSENTEE ALERT ROSTER */}
        {activeView === 'absentees' && (
          <div className="max-w-6xl mx-auto bg-white p-6 rounded-xl shadow-sm border">
            <button onClick={() => setActiveView('dashboard')} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-6"><ArrowLeft size={16} /> Back to Dashboard</button>
            <div className="flex items-center gap-2 mb-4"><UserMinus className="text-red-600" size={24} /><h2 className="text-2xl font-bold text-red-700">Absentee Alert (14+ Days)</h2></div>
            <p className="text-gray-600 mb-6">These members have not checked in to a service within the last 2 weeks.</p>
            
            <div className="overflow-x-auto border border-red-200 rounded-lg">
              <table className="w-full text-left border-collapse">
                <thead><tr className="bg-red-50 border-b border-red-200 text-sm font-semibold text-red-800"><th className="p-4">Name</th><th className="p-4">Phone Number</th><th className="p-4">Email Address</th><th className="p-4">Action</th></tr></thead>
                <tbody className="divide-y divide-gray-200">
                  {absenteeList.length === 0 ? (<tr><td colSpan={4} className="p-6 text-center text-gray-500 font-medium">Amazing! Everyone is accounted for.</td></tr>) : (
                    absenteeList.map((person, idx) => (
                      <tr key={idx} className="hover:bg-red-50 transition-colors">
                        <td className="p-4 font-medium text-gray-900">{person.full_name}</td>
                        <td className="p-4 text-gray-600">{person.phone_number || '-'}</td>
                        <td className="p-4 text-gray-600">{person.email || '-'}</td>
                        <td className="p-4">
                          <button onClick={() => {setActiveView('outreach'); setPromptContext(`Draft a warm, caring "we miss you" message to ${person.full_name} who hasn't been to church in a couple of weeks.`);}} className="text-xs bg-white border border-red-300 text-red-600 px-3 py-1 rounded hover:bg-red-600 hover:text-white transition-colors">
                            Draft Message
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* AI OUTREACH */}
        {activeView === 'outreach' && (
           <div className="max-w-4xl mx-auto bg-white p-6 rounded-xl shadow-sm border">
           <button onClick={() => setActiveView('dashboard')} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-6"><ArrowLeft size={16} /> Back to Dashboard</button>
           <div className="flex items-center gap-2 mb-4"><Sparkles className="text-orange-500" size={24} /><h2 className="text-2xl font-bold">AI Outreach Drafter</h2></div>
           <div className="space-y-4 max-w-2xl">
             <textarea rows={4} value={promptContext} onChange={(e) => setPromptContext(e.target.value)} className="w-full border border-gray-300 rounded-md p-3 resize-none focus:ring-2 focus:ring-orange-500" placeholder="Message details..." />
             <button onClick={handleGenerateMessage} disabled={isGenerating || !promptContext} className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 font-medium">{isGenerating ? 'Drafting...' : 'Generate Message'}</button>
             {generatedMessage && <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg"><h3 className="text-sm font-semibold text-gray-700 mb-2">Drafted Message:</h3><div className="text-gray-800 whitespace-pre-wrap">{generatedMessage}</div></div>}
           </div>
         </div>
        )}

        {/* DYNAMIC MEMBER CHECK-IN */}
        {activeView === 'attendance' && (
          <div className="max-w-4xl mx-auto bg-white p-6 rounded-xl shadow-sm border">
            <button onClick={() => setActiveView('dashboard')} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-6"><ArrowLeft size={16} /> Back to Dashboard</button>
            <div className="flex items-center gap-2 mb-4"><CheckSquare className="text-orange-500" size={24} /><h2 className="text-2xl font-bold">Service Check-In</h2></div>
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1"><label className="block text-sm font-medium text-gray-700 mb-1">Service Date</label><input type="date" value={checkinDate} onChange={(e) => setCheckinDate(e.target.value)} className="w-full border border-gray-300 rounded-md p-2" /></div>
              <div className="flex-[2]"><label className="block text-sm font-medium text-gray-700 mb-1">Quick Search</label><div className="relative"><div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Search size={16} className="text-gray-400" /></div><input type="text" placeholder="Search by name..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full border border-gray-300 rounded-md py-2 pl-10 pr-3" /></div></div>
            </div>
            <div className="border border-gray-200 rounded-lg overflow-hidden mb-4">
              <div className="bg-gray-50 p-3 border-b border-gray-200 font-semibold text-gray-700 text-sm flex justify-between"><span>Congregation Roster</span><span className="text-orange-600">{selectedMembers.length} Selected</span></div>
              <div className="max-h-80 overflow-y-auto p-2 bg-white">
                {memberList.filter(m => m.full_name.toLowerCase().includes(searchTerm.toLowerCase())).map((m, idx) => (
                  <label key={idx} className="flex items-center gap-3 p-3 hover:bg-orange-50 rounded-md cursor-pointer border-b border-gray-100 last:border-0"><input type="checkbox" checked={selectedMembers.includes(m.full_name)} onChange={() => toggleMemberSelection(m.full_name)} className="w-5 h-5 text-orange-500 rounded border-gray-300" /><span className="text-gray-800 font-medium select-none">{m.full_name}</span></label>
                ))}
              </div>
            </div>
            <button onClick={handleSaveCheckins} disabled={isSubmitting || memberList.length === 0} className="w-full md:w-auto bg-orange-500 text-white px-6 py-3 rounded-md hover:bg-orange-600 font-medium disabled:bg-gray-400">{isSubmitting ? 'Saving...' : 'Save Attendance'}</button>
            {checkinStatusMessage && <div className={`p-4 rounded-md mt-4 text-sm font-medium ${checkinStatusMessage.includes('✅') ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-800 border border-red-200'}`}>{checkinStatusMessage}</div>}
          </div>
        )}
      </main>
    </div>
  );
}

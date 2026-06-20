import React, { useState, useEffect } from 'react';
import { Users, ArrowLeft, Sparkles, Lock, LogOut, Cake, CheckSquare, Search, UserPlus, ClipboardList, UserMinus, BarChart3, ShieldCheck, MessageCircle, MessageSquare, Heart, Gift } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

// --- INITIALIZE SUPABASE ---
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// --- MESSAGE TEMPLATES ---
const TEMPLATES = {
  welcome: "Hello {name}, welcome to Grace Citadel! We are so blessed to have you with us. We'd love to see you again this weekend!",
  missed: "Hello {name}, we missed you at service this past Sunday. We hope you are doing well and look forward to seeing you soon!",
  checking_in: "Hello {name}, just checking in on you from Grace Citadel! We haven't seen you in a little while and wanted to make sure everything is okay. Let us know how we can pray for you.",
  birthday: "Happy Birthday {name}! Grace Citadel celebrates you today. We pray this year brings you abundant joy, health, and favor!"
};

export default function App() {
  // --- AUTHENTICATION STATE ---
  const [session, setSession] = useState<any>(null);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState('');

  // --- APP STATE ---
  const [activeView, setActiveView] = useState('dashboard');
  const [template, setTemplate] = useState('welcome');

  // --- BIRTHDAY STATES ---
  const [birthdaysToday, setBirthdaysToday] = useState<any[]>([]);
  const [birthdaysWeek, setBirthdaysWeek] = useState<any[]>([]);
  const [birthdaysMonth, setBirthdaysMonth] = useState<any[]>([]);

  // --- CRM & ROSTER STATES ---
  const [guestList, setGuestList] = useState<any[]>([]);
  const [absenteeList, setAbsenteeList] = useState<any[]>([]);
  const [serviceStats, setServiceStats] = useState<any[]>([]);
  const [memberStats, setMemberStats] = useState<any[]>([]);
  const [crmTasks, setCrmTasks] = useState<any[]>([]);

  // --- FORM STATES ---
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [occupation, setOccupation] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('');
  const [memberStatus, setMemberStatus] = useState('Regular');
  const [statusMessage, setStatusMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- AI OUTREACH & CHECK-IN STATES ---
  const [promptContext, setPromptContext] = useState('');
  const [generatedMessage, setGeneratedMessage] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
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

  const userEmail = session?.user?.email?.toLowerCase() || '';
  const isUsher = userEmail.includes('usher');
  const isAdmin = !isUsher;

  // --- 2. FETCH DASHBOARD DATA ---
  useEffect(() => {
    if (session && isAdmin) {
        if (activeView === 'dashboard') { fetchBirthdays(); fetchCrmTasks(); }
        if (activeView === 'birthdays') fetchBirthdays();
        if (activeView === 'guests') fetchGuests();
        if (activeView === 'absentees') fetchAbsentees();
        if (activeView === 'analytics') fetchAnalytics(); 
        if (activeView === 'tasks') fetchCrmTasks();
    }
    if (session && activeView === 'attendance') {
      fetchMembersForCheckin();
      setSelectedMembers([]); setCheckinStatusMessage(''); setSearchTerm('');
    }
  }, [session, activeView, isAdmin]);

  // --- 🔥 NEW: SMART BIRTHDAY ENGINE 🔥 ---
  const fetchBirthdays = async () => {
    const { data } = await supabase.from('members').select('full_name, date_of_birth, phone_number');
    if (data) {
      const today = new Date();
      const currentMonth = today.getMonth();
      const currentDate = today.getDate();

      const tList: any[] = [];
      const wList: any[] = [];
      const mList: any[] = [];

      data.forEach(m => {
        if (!m.date_of_birth) return;
        
        // Parse the date of birth securely
        const bDateObj = new Date(m.date_of_birth);
        if (isNaN(bDateObj.getTime())) return; 

        const bMonth = bDateObj.getMonth();
        const bDate = bDateObj.getDate();

        // Check if it's today
        if (bMonth === currentMonth && bDate === currentDate) {
          tList.push(m);
        } else {
          // Calculate days until their birthday THIS year
          const thisYearsBirthday = new Date(today.getFullYear(), bMonth, bDate);
          const diffTime = thisYearsBirthday.getTime() - today.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          // If birthday is in the next 7 days
          if (diffDays > 0 && diffDays <= 7) {
            wList.push(m);
          } 
          // If birthday is later this month (and not today or this week)
          else if (bMonth === currentMonth && diffDays > 7) {
            mList.push(m);
          }
        }
      });

      setBirthdaysToday(tList);
      setBirthdaysWeek(wList);
      setBirthdaysMonth(mList);
    }
  };

  const fetchMembersForCheckin = async () => { const { data } = await supabase.from('members').select('full_name').order('full_name'); if (data) setMemberList(data); };
  const fetchGuests = async () => { const { data } = await supabase.from('members').select('*').in('status', ['1st Timer', '2nd Timer']).order('created_at', { ascending: false }); if (data) setGuestList(data); };
  const fetchAnalytics = async () => { const { data } = await supabase.from('member_checkins').select('*'); if (data) { const dateCounts = data.reduce((acc: any, curr: any) => { acc[curr.service_date] = (acc[curr.service_date] || 0) + 1; return acc; }, {}); setServiceStats(Object.keys(dateCounts).map(date => ({ date, count: dateCounts[date] })).sort((a, b) => b.date.localeCompare(a.date))); const memberCounts = data.reduce((acc: any, curr: any) => { acc[curr.member_name] = (acc[curr.member_name] || 0) + 1; return acc; }, {}); setMemberStats(Object.keys(memberCounts).map(name => ({ name, count: memberCounts[name] })).sort((a, b) => b.count - a.count)); } };
  
  const fetchAbsentees = async () => {
    const cutoffDate = new Date(new Date().setDate(new Date().getDate() - 14)).toISOString().split('T')[0];
    const { data: allMembers } = await supabase.from('members').select('*').order('full_name');
    const { data: recentCheckins } = await supabase.from('member_checkins').select('member_name').gte('service_date', cutoffDate);
    if (allMembers && recentCheckins) {
      const recentAttendees = new Set(recentCheckins.map(c => c.member_name));
      setAbsenteeList(allMembers.filter(m => !recentAttendees.has(m.full_name)));
    }
  };

  const fetchCrmTasks = async () => {
    const { data: members } = await supabase.from('members').select('*');
    const { data: checkins } = await supabase.from('member_checkins').select('*');
    if (!members || !checkins) return;

    const today = new Date(); today.setHours(0, 0, 0, 0);
    const sortedDates = [...new Set(checkins.map(c => c.service_date))].sort();
    const lastGlobalServiceDate = sortedDates[sortedDates.length - 1];

    const lastCheckinMap: any = {};
    checkins.forEach(c => { if (!lastCheckinMap[c.member_name] || c.service_date > lastCheckinMap[c.member_name]) lastCheckinMap[c.member_name] = c.service_date; });

    const newTasks: any[] = [];

    members.forEach(member => {
      const createdDate = new Date(member.created_at || today); createdDate.setHours(0, 0, 0, 0);
      const daysSinceCreated = Math.floor((today.getTime() - createdDate.getTime()) / (1000 * 3600 * 24));
      const lastCheckinStr = lastCheckinMap[member.full_name];
      let daysSinceLastCheckin = -1;
      if (lastCheckinStr) { const lastCheckin = new Date(lastCheckinStr); lastCheckin.setHours(0, 0, 0, 0); daysSinceLastCheckin = Math.floor((today.getTime() - lastCheckin.getTime()) / (1000 * 3600 * 24)); }

      if (member.status === '1st Timer' && daysSinceCreated >= 1 && daysSinceCreated <= 3) newTasks.push({ priority: 1, type: 'Day 2 Follow-Up', color: 'bg-green-100 text-green-800', member, description: 'New guest! Send a warm welcome message.', msgTemplate: 'welcome' });
      else if (member.status === '1st Timer' && daysSinceCreated >= 7 && daysSinceCreated <= 10 && (daysSinceLastCheckin === -1 || daysSinceLastCheckin >= 7)) newTasks.push({ priority: 1, type: 'Day 8 (Not Seen)', color: 'bg-red-100 text-red-800', member, description: 'Did not return for week 2. Reach out!', msgTemplate: 'missed' });
      else if (daysSinceLastCheckin >= 14 && daysSinceLastCheckin <= 20) newTasks.push({ priority: 2, type: '14 Days Absent', color: 'bg-orange-100 text-orange-800', member, description: 'Has not attended in over 2 weeks.', msgTemplate: 'checking_in' });
      else if (member.status === 'Regular' && lastGlobalServiceDate && lastCheckinStr !== lastGlobalServiceDate && daysSinceLastCheckin > 0 && daysSinceLastCheckin < 14) newTasks.push({ priority: 3, type: 'Missed Last Service', color: 'bg-blue-100 text-blue-800', member, description: 'Was absent this past Sunday.', msgTemplate: 'missed' });
    });

    newTasks.sort((a, b) => a.priority - b.priority);
    setCrmTasks(newTasks);
  };

  const handleSendMessage = (phone: string | null, name: string, type: 'whatsapp' | 'sms', overrideTemplate?: string) => {
    if (!phone) return alert(`No phone number recorded for ${name}.`);
    const cleanPhone = phone.replace(/\D/g, ''); 
    const activeTemplateKey = overrideTemplate || template;
    const message = TEMPLATES[activeTemplateKey as keyof typeof TEMPLATES].replace('{name}', name);
    const encodedMsg = encodeURIComponent(message);
    if (type === 'whatsapp') window.open(`https://wa.me/${cleanPhone}?text=${encodedMsg}`, '_blank');
    else window.open(`sms:${cleanPhone}?body=${encodedMsg}`, '_blank');
  };

  const handleLogin = async (e: React.FormEvent) => { e.preventDefault(); setIsAuthenticating(true); setAuthError(''); const { error } = await supabase.auth.signInWithPassword({ email: loginEmail, password: loginPassword }); if (error) setAuthError(error.message); setIsAuthenticating(false); };
  const handleLogout = async () => { await supabase.auth.signOut(); setActiveView('dashboard'); };

  const handleSaveMember = async (e: React.FormEvent) => {
    e.preventDefault(); setIsSubmitting(true); setStatusMessage('Saving to secure database...');
    try {
      const { error } = await supabase.from('members').insert([{ full_name: name, email: email, phone_number: phone, occupation: occupation, date_of_birth: dob, gender: gender, status: memberStatus }]);
      if (error) throw error;
      setStatusMessage(`✅ ${memberStatus} successfully registered!`);
      setName(''); setEmail(''); setPhone(''); setOccupation(''); setDob(''); setGender(''); setMemberStatus('Regular');
    } catch (error: any) { setStatusMessage('❌ Error: ' + error.message); } finally { setIsSubmitting(false); }
  };

  const toggleMemberSelection = (memberName: string) => setSelectedMembers(prev => prev.includes(memberName) ? prev.filter(n => n !== memberName) : [...prev, memberName]);
  const handleSaveCheckins = async () => {
    if (selectedMembers.length === 0) return setCheckinStatusMessage('❌ Please select at least one member.');
    setIsSubmitting(true); setCheckinStatusMessage('Saving attendance & upgrading statuses...');
    try {
      const recordsToInsert = selectedMembers.map(n => ({ service_date: checkinDate, member_name: n }));
      const { error: insertError } = await supabase.from('member_checkins').insert(recordsToInsert);
      if (insertError) throw insertError;
      const { data: currentMembers } = await supabase.from('members').select('full_name, status').in('full_name', selectedMembers);
      if (currentMembers) {
        const firstTimersToUpdate = currentMembers.filter(m => m.status === '1st Timer').map(m => m.full_name);
        const secondTimersToUpdate = currentMembers.filter(m => m.status === '2nd Timer').map(m => m.full_name);
        if (firstTimersToUpdate.length > 0) await supabase.from('members').update({ status: '2nd Timer' }).in('full_name', firstTimersToUpdate);
        if (secondTimersToUpdate.length > 0) await supabase.from('members').update({ status: 'Regular' }).in('full_name', secondTimersToUpdate);
      }
      setCheckinStatusMessage(`✅ Successfully checked in ${selectedMembers.length} members & updated automated statuses!`);
      setSelectedMembers([]); setSearchTerm('');
    } catch (error: any) { setCheckinStatusMessage('❌ Error: ' + error.message); } finally { setIsSubmitting(false); }
  };

  const handleGenerateMessage = async () => {
    if (!promptContext) return; setIsGenerating(true); setGeneratedMessage('');
    try { await new Promise(resolve => setTimeout(resolve, 2000)); setGeneratedMessage(`[ Simulated AI Response ]\n\nBlessings!\n\nThis is a placeholder message. Once you connect your Google Billing, the real Gemini AI will read your prompt ("${promptContext}") and automatically draft a beautiful, customized message right here!`); } catch (error: any) { setGeneratedMessage('❌ Error: ' + error.message); } finally { setIsGenerating(false); }
  };

  // --- HELPER COMPONENT FOR BIRTHDAY ROWS ---
  const BirthdayRow = ({ person }: { person: any }) => (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 last:border-0 p-4 hover:bg-gray-50 transition-colors gap-3">
      <div>
        <div className="font-bold text-gray-900 text-lg">{person.full_name}</div>
        <div className="text-gray-500 text-sm">{person.date_of_birth} • {person.phone_number || 'No Phone'}</div>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <button onClick={() => handleSendMessage(person.phone_number, person.full_name, 'whatsapp', 'birthday')} className="flex items-center gap-1 bg-green-50 border border-green-200 text-green-700 px-3 py-1.5 rounded hover:bg-green-100 text-sm font-medium transition-colors"><MessageCircle size={16}/> WhatsApp</button>
        <button onClick={() => handleSendMessage(person.phone_number, person.full_name, 'sms', 'birthday')} className="flex items-center gap-1 bg-blue-50 border border-blue-200 text-blue-700 px-3 py-1.5 rounded hover:bg-blue-100 text-sm font-medium transition-colors"><MessageSquare size={16}/> SMS</button>
        <button onClick={() => { setActiveView('outreach'); setPromptContext(`Draft a highly personalized, joyous, and prophetic birthday blessing for ${person.full_name} who is a member of Grace Citadel church.`); }} className="flex items-center gap-1 bg-purple-50 border border-purple-200 text-purple-700 px-3 py-1.5 rounded hover:bg-purple-100 text-sm font-medium transition-colors"><Sparkles size={16}/> AI Drafter</button>
      </div>
    </div>
  );

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
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Email</label><input type="email" required value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} className="w-full border border-gray-300 rounded-md p-3 focus:ring-2 focus:ring-orange-500 outline-none" /></div>
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
          <div>
            <h1 className="text-xl font-bold text-gray-900">Grace Citadel ChMS</h1>
            <p className="text-sm text-gray-500 flex items-center gap-1">
              {isAdmin ? <><ShieldCheck size={14} className="text-green-600"/> Administrator Access</> : 'Usher Check-In Portal'}
            </p>
          </div>
        </div>
        <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 text-sm border border-red-200 text-red-600 rounded-md hover:bg-red-50 font-medium"><LogOut size={16} /> Sign Out</button>
      </header>

      <main className="flex-1 p-6">
        
        {/* DASHBOARD VIEW */}
        {activeView === 'dashboard' && (
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              
              {/* EVERYONE SEES THESE */}
              <div className="bg-white p-6 rounded-xl shadow-sm border hover:shadow-md transition-shadow">
                <h2 className="text-lg font-semibold mb-2 text-gray-900 flex items-center gap-2"><CheckSquare size={18} className="text-orange-500"/> Check-In</h2>
                <p className="text-gray-500 text-sm mb-4">Track which members attended service.</p>
                <button onClick={() => setActiveView('attendance')} className="text-blue-600 font-medium text-sm hover:underline">Log Attendance &rarr;</button>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border hover:shadow-md transition-shadow">
                <h2 className="text-lg font-semibold mb-2 text-gray-900 flex items-center gap-2"><UserPlus size={18} className="text-orange-500"/> Registration</h2>
                <p className="text-gray-500 text-sm mb-4">Register First Timers or add regular members.</p>
                <button onClick={() => {setActiveView('members'); setStatusMessage('');}} className="text-blue-600 font-medium text-sm hover:underline">Open Form &rarr;</button>
              </div>

              {/* ADMIN ONLY CARDS */}
              {isAdmin && (
                <>
                  {/* NEW BIRTHDAY DASHBOARD CARD */}
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl shadow-sm border border-blue-200 hover:shadow-md transition-shadow relative overflow-hidden">
                      {birthdaysToday.length > 0 && <div className="absolute top-0 right-0 bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">Today!</div>}
                      <h2 className="text-lg font-semibold mb-2 text-blue-800 flex items-center gap-2"><Gift size={18} className="text-blue-600"/> Birthday Dashboard</h2>
                      <p className="text-blue-600 text-sm mb-4">
                        {birthdaysToday.length} today • {birthdaysWeek.length} this week
                      </p>
                      <button onClick={() => setActiveView('birthdays')} className="text-blue-700 font-bold text-sm hover:underline">Manage Birthdays &rarr;</button>
                  </div>

                  {/* CRM DASHBOARD CARD */}
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-orange-200 hover:shadow-md transition-shadow relative overflow-hidden">
                      {crmTasks.length > 0 && <div className="absolute top-0 right-0 bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">{crmTasks.length} Action{crmTasks.length !== 1 ? 's' : ''} Needed</div>}
                      <h2 className="text-lg font-semibold mb-2 text-orange-700 flex items-center gap-2"><Heart size={18} className="text-orange-600"/> Pastoral Care CRM</h2>
                      <p className="text-gray-500 text-sm mb-4">Automated follow-up tasks for guests and missed members.</p>
                      <button onClick={() => setActiveView('tasks')} className="text-orange-600 font-bold text-sm hover:underline">Open Workflow &rarr;</button>
                  </div>

                  <div className="bg-white p-6 rounded-xl shadow-sm border hover:shadow-md transition-shadow"><h2 className="text-lg font-semibold mb-2 text-gray-900 flex items-center gap-2"><BarChart3 size={18} className="text-orange-500"/> Analytics</h2><p className="text-gray-500 text-sm mb-4">View total headcounts and member consistency.</p><button onClick={() => setActiveView('analytics')} className="text-blue-600 font-medium text-sm hover:underline">View Stats &rarr;</button></div>
                  <div className="bg-white p-6 rounded-xl shadow-sm border hover:shadow-md transition-shadow"><h2 className="text-lg font-semibold mb-2 text-red-700 flex items-center gap-2"><UserMinus size={18} className="text-red-600"/> Absentee Alert</h2><p className="text-gray-500 text-sm mb-4">See members missing for 2 weeks or more.</p><button onClick={() => setActiveView('absentees')} className="text-red-600 font-medium text-sm hover:underline">View Missing &rarr;</button></div>
                  <div className="bg-white p-6 rounded-xl shadow-sm border hover:shadow-md transition-shadow"><h2 className="text-lg font-semibold mb-2 text-gray-900 flex items-center gap-2"><ClipboardList size={18} className="text-orange-500"/> Guest Roster</h2><p className="text-gray-500 text-sm mb-4">View 1st and 2nd Timer details for follow-up.</p><button onClick={() => setActiveView('guests')} className="text-blue-600 font-medium text-sm hover:underline">View Guests &rarr;</button></div>
                  <div className="bg-white p-6 rounded-xl shadow-sm border hover:shadow-md transition-shadow"><h2 className="text-lg font-semibold mb-2 text-gray-900 flex items-center gap-2"><Sparkles size={18} className="text-orange-500"/> AI Outreach</h2><p className="text-gray-500 text-sm mb-4">Draft personalized messages using Gemini.</p><button onClick={() => setActiveView('outreach')} className="text-blue-600 font-medium text-sm hover:underline">Draft Message &rarr;</button></div>
                </>
              )}
            </div>
          </div>
        )}

        {/* --- 🔥 NEW: BIRTHDAY DASHBOARD VIEW 🔥 --- */}
        {activeView === 'birthdays' && isAdmin && (
            <div className="max-w-4xl mx-auto space-y-6">
                <button onClick={() => setActiveView('dashboard')} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800"><ArrowLeft size={16} /> Back to Dashboard</button>
                
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-8 rounded-xl shadow-md text-white flex items-center justify-between">
                    <div>
                        <h2 className="text-3xl font-bold mb-2 flex items-center gap-3"><Cake size={32} /> Birthday Management</h2>
                        <p className="text-blue-100">Send blessings, celebrate milestones, and manage upcoming birthdays.</p>
                    </div>
                </div>

                {/* TODAY'S BIRTHDAYS */}
                <div className="bg-white rounded-xl shadow-sm border border-blue-200 overflow-hidden">
                    <div className="bg-blue-50 border-b border-blue-200 p-4 font-bold text-blue-900 flex items-center gap-2 text-lg">
                        <span>🎂</span> Today's Birthdays
                    </div>
                    <div>
                        {birthdaysToday.length === 0 ? (
                            <div className="p-6 text-center text-gray-500">No birthdays today.</div>
                        ) : (
                            birthdaysToday.map((person, idx) => <BirthdayRow key={idx} person={person} />)
                        )}
                    </div>
                </div>

                {/* THIS WEEK'S BIRTHDAYS */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="bg-gray-50 border-b border-gray-200 p-4 font-bold text-gray-800 flex items-center gap-2 text-lg">
                        <span>🎉</span> This Week's Birthdays (Next 7 Days)
                    </div>
                    <div>
                        {birthdaysWeek.length === 0 ? (
                            <div className="p-6 text-center text-gray-500">No upcoming birthdays this week.</div>
                        ) : (
                            birthdaysWeek.map((person, idx) => <BirthdayRow key={idx} person={person} />)
                        )}
                    </div>
                </div>

                {/* THIS MONTH'S BIRTHDAYS */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="bg-gray-50 border-b border-gray-200 p-4 font-bold text-gray-800 flex items-center gap-2 text-lg">
                        <span>🗓️</span> Later This Month
                    </div>
                    <div>
                        {birthdaysMonth.length === 0 ? (
                            <div className="p-6 text-center text-gray-500">No other birthdays later this month.</div>
                        ) : (
                            birthdaysMonth.map((person, idx) => <BirthdayRow key={idx} person={person} />)
                        )}
                    </div>
                </div>
            </div>
        )}

        {/* --- CRM TASK WORKFLOW VIEW --- */}
        {activeView === 'tasks' && isAdmin && (
            <div className="max-w-4xl mx-auto bg-white p-6 rounded-xl shadow-sm border">
                <button onClick={() => setActiveView('dashboard')} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-6"><ArrowLeft size={16} /> Back to Dashboard</button>
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2"><Heart className="text-orange-500" size={28} /><h2 className="text-2xl font-bold text-gray-900">Follow-Up Workflow</h2></div>
                    <span className="bg-orange-100 text-orange-800 px-4 py-1 rounded-full text-sm font-bold">{crmTasks.length} Pending Tasks</span>
                </div>
                <p className="text-gray-600 mb-6">These tasks are automatically generated based on member registration and attendance patterns. Click the message icons to instantly send the appropriate template.</p>
                <div className="space-y-4">
                    {crmTasks.length === 0 ? (
                        <div className="text-center p-8 bg-gray-50 rounded-lg text-gray-500">Amazing! Your follow-up queue is completely empty.</div>
                    ) : (
                        crmTasks.map((task, idx) => (
                            <div key={idx} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div>
                                    <div className="flex items-center gap-3 mb-1"><h3 className="font-bold text-gray-900 text-lg">{task.member.full_name}</h3><span className={`text-xs font-bold px-2 py-1 rounded ${task.color}`}>{task.type}</span></div>
                                    <p className="text-gray-600 text-sm">{task.description}</p>
                                    <p className="text-gray-400 text-xs mt-1">Phone: {task.member.phone_number || 'N/A'}</p>
                                </div>
                                <div className="flex items-center gap-3 shrink-0">
                                    <button onClick={() => handleSendMessage(task.member.phone_number, task.member.full_name, 'whatsapp', task.msgTemplate)} className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded-md hover:bg-green-100 font-medium transition-colors"><MessageCircle size={18}/> WhatsApp</button>
                                    <button onClick={() => handleSendMessage(task.member.phone_number, task.member.full_name, 'sms', task.msgTemplate)} className="flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-700 px-4 py-2 rounded-md hover:bg-blue-100 font-medium transition-colors"><MessageSquare size={18}/> SMS</button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        )}

        {/* ... [ALL PREVIOUS VIEWS - ANALYTICS, GUESTS, ABSENTEES, OUTREACH, REGISTRATION, CHECK-IN] ... */}
        {/* TEMPLATE SELECTOR FOR OUTREACH LISTS */}
        {(activeView === 'guests' || activeView === 'absentees') && (
            <div className="max-w-6xl mx-auto mb-4 bg-white p-4 rounded-xl shadow-sm border flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <label className="font-semibold text-gray-800">Quick Message Template:</label>
                <select value={template} onChange={(e) => setTemplate(e.target.value)} className="border border-gray-300 rounded-md p-2 flex-1 outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500">
                    <option value="welcome">👋 Welcome Guest Message</option>
                    <option value="missed">❤️ We Missed You Message</option>
                    <option value="checking_in">👀 Checking In (Absentee)</option>
                    <option value="birthday">🎂 Birthday Blessing</option>
                </select>
            </div>
        )}

        {activeView === 'analytics' && isAdmin && (<div className="max-w-6xl mx-auto bg-white p-6 rounded-xl shadow-sm border"><button onClick={() => setActiveView('dashboard')} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-6"><ArrowLeft size={16} /> Back to Dashboard</button><div className="flex items-center gap-2 mb-6"><BarChart3 className="text-orange-500" size={24} /><h2 className="text-2xl font-bold text-gray-900">Analytics & Reports</h2></div><div className="grid grid-cols-1 md:grid-cols-2 gap-8"><div><h3 className="text-lg font-bold text-gray-800 mb-3 bg-gray-50 p-3 rounded-t-lg border border-b-0 border-gray-200">Total Headcount per Service</h3><div className="overflow-x-auto border border-gray-200 rounded-b-lg"><table className="w-full text-left border-collapse"><thead><tr className="bg-gray-100 border-b border-gray-200 text-sm font-semibold text-gray-700"><th className="p-3">Service Date</th><th className="p-3">Total Checked In</th></tr></thead><tbody className="divide-y divide-gray-200">{serviceStats.length === 0 ? (<tr><td colSpan={2} className="p-4 text-center text-gray-500">No services logged yet.</td></tr>) : (serviceStats.map((stat, idx) => (<tr key={idx} className="hover:bg-orange-50"><td className="p-3 font-medium text-gray-900">{new Date(stat.date).toLocaleDateString()}</td><td className="p-3 font-bold text-orange-600">{stat.count} members</td></tr>)))}</tbody></table></div></div><div><h3 className="text-lg font-bold text-gray-800 mb-3 bg-gray-50 p-3 rounded-t-lg border border-b-0 border-gray-200">Member Attendance Frequency</h3><div className="overflow-x-auto border border-gray-200 rounded-b-lg max-h-[500px] overflow-y-auto"><table className="w-full text-left border-collapse"><thead><tr className="bg-gray-100 border-b border-gray-200 text-sm font-semibold text-gray-700"><th className="p-3 sticky top-0 bg-gray-100">Member Name</th><th className="p-3 sticky top-0 bg-gray-100">Times Attended</th></tr></thead><tbody className="divide-y divide-gray-200">{memberStats.length === 0 ? (<tr><td colSpan={2} className="p-4 text-center text-gray-500">No attendance data yet.</td></tr>) : (memberStats.map((member, idx) => (<tr key={idx} className="hover:bg-blue-50"><td className="p-3 font-medium text-gray-900">{member.name}</td><td className="p-3 font-bold text-blue-600">{member.count}x</td></tr>)))}</tbody></table></div></div></div></div>)}
        {activeView === 'guests' && isAdmin && (<div className="max-w-6xl mx-auto bg-white p-6 rounded-xl shadow-sm border"><button onClick={() => setActiveView('dashboard')} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-6"><ArrowLeft size={16} /> Back to Dashboard</button><div className="flex items-center gap-2 mb-4"><ClipboardList className="text-orange-500" size={24} /><h2 className="text-2xl font-bold">Guest Follow-Up Roster</h2></div><div className="overflow-x-auto border border-gray-200 rounded-lg"><table className="w-full text-left border-collapse"><thead><tr className="bg-gray-50 border-b border-gray-200 text-sm font-semibold text-gray-700"><th className="p-4">Name</th><th className="p-4">Status</th><th className="p-4">Phone</th><th className="p-4">Send Message</th></tr></thead><tbody className="divide-y divide-gray-200">{guestList.length === 0 ? (<tr><td colSpan={4} className="p-6 text-center text-gray-500">No guests found.</td></tr>) : (guestList.map((guest, idx) => (<tr key={idx} className="hover:bg-orange-50"><td className="p-4 font-medium text-gray-900">{guest.full_name}</td><td className="p-4"><span className={`px-3 py-1 rounded-full text-xs font-bold ${guest.status === '1st Timer' ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800'}`}>{guest.status}</span></td><td className="p-4 text-gray-600">{guest.phone_number || '-'}</td><td className="p-4"><div className="flex items-center gap-3"><button onClick={() => handleSendMessage(guest.phone_number, guest.full_name, 'whatsapp')} className="text-green-600 hover:bg-green-100 p-2 rounded-full transition-colors" title="Send WhatsApp"><MessageCircle size={20} /></button><button onClick={() => handleSendMessage(guest.phone_number, guest.full_name, 'sms')} className="text-blue-600 hover:bg-blue-100 p-2 rounded-full transition-colors" title="Send SMS"><MessageSquare size={20} /></button></div></td></tr>)))}</tbody></table></div></div>)}
        {activeView === 'absentees' && isAdmin && (<div className="max-w-6xl mx-auto bg-white p-6 rounded-xl shadow-sm border"><button onClick={() => setActiveView('dashboard')} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-6"><ArrowLeft size={16} /> Back to Dashboard</button><div className="flex items-center gap-2 mb-4"><UserMinus className="text-red-600" size={24} /><h2 className="text-2xl font-bold text-red-700">Absentee Alert (14+ Days)</h2></div><div className="overflow-x-auto border border-red-200 rounded-lg"><table className="w-full text-left border-collapse"><thead><tr className="bg-red-50 border-b border-red-200 text-sm font-semibold text-red-800"><th className="p-4">Name</th><th className="p-4">Phone Number</th><th className="p-4">Send Message</th><th className="p-4">AI Drafter</th></tr></thead><tbody className="divide-y divide-gray-200">{absenteeList.length === 0 ? (<tr><td colSpan={4} className="p-6 text-center text-gray-500 font-medium">Amazing! Everyone is accounted for.</td></tr>) : (absenteeList.map((person, idx) => (<tr key={idx} className="hover:bg-red-50 transition-colors"><td className="p-4 font-medium text-gray-900">{person.full_name}</td><td className="p-4 text-gray-600">{person.phone_number || '-'}</td><td className="p-4"><div className="flex items-center gap-3"><button onClick={() => handleSendMessage(person.phone_number, person.full_name, 'whatsapp')} className="text-green-600 hover:bg-green-100 p-2 rounded-full transition-colors" title="Send WhatsApp"><MessageCircle size={20} /></button><button onClick={() => handleSendMessage(person.phone_number, person.full_name, 'sms')} className="text-blue-600 hover:bg-blue-100 p-2 rounded-full transition-colors" title="Send SMS"><MessageSquare size={20} /></button></div></td><td className="p-4"><button onClick={() => {setActiveView('outreach'); setPromptContext(`Draft a warm, caring "we miss you" message to ${person.full_name} who hasn't been to church in a couple of weeks.`);}} className="text-xs bg-white border border-red-300 text-red-600 px-3 py-1 rounded hover:bg-red-600 hover:text-white transition-colors">Custom AI Draft</button></td></tr>)))}</tbody></table></div></div>)}
        {activeView === 'outreach' && isAdmin && (<div className="max-w-4xl mx-auto bg-white p-6 rounded-xl shadow-sm border"><button onClick={() => setActiveView('dashboard')} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-6"><ArrowLeft size={16} /> Back to Dashboard</button><div className="flex items-center gap-2 mb-4"><Sparkles className="text-orange-500" size={24} /><h2 className="text-2xl font-bold">AI Outreach Drafter</h2></div><div className="space-y-4 max-w-2xl"><textarea rows={4} value={promptContext} onChange={(e) => setPromptContext(e.target.value)} className="w-full border border-gray-300 rounded-md p-3 resize-none focus:ring-2 focus:ring-orange-500" placeholder="Message details..." /><button onClick={handleGenerateMessage} disabled={isGenerating || !promptContext} className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 font-medium">{isGenerating ? 'Drafting...' : 'Generate Message'}</button>{generatedMessage && <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg"><h3 className="text-sm font-semibold text-gray-700 mb-2">Drafted Message:</h3><div className="text-gray-800 whitespace-pre-wrap">{generatedMessage}</div></div>}</div></div>)}
        {activeView === 'members' && (<div className="max-w-4xl mx-auto bg-white p-6 rounded-xl shadow-sm border"><button onClick={() => setActiveView('dashboard')} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-6"><ArrowLeft size={16} /> Back to Dashboard</button><h2 className="text-2xl font-bold mb-4">Registration Form</h2><form onSubmit={handleSaveMember} className="flex flex-col gap-4 max-w-md"><div className="bg-orange-50 p-4 rounded-lg border border-orange-100 mb-2"><label className="block text-sm font-bold text-orange-900 mb-1">Registration Type (Status)</label><select value={memberStatus} onChange={(e) => setMemberStatus(e.target.value)} className="w-full border border-orange-300 rounded-md p-2 bg-white outline-none focus:ring-2 focus:ring-orange-500"><option value="1st Timer">1st Timer</option><option value="2nd Timer">2nd Timer</option><option value="Regular">Regular Member</option></select></div><div><label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label><input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full border border-gray-300 rounded-md p-2" /></div><div className="grid grid-cols-2 gap-4"><div><label className="block text-sm font-medium text-gray-700 mb-1">Gender</label><select value={gender} onChange={(e) => setGender(e.target.value)} className="w-full border border-gray-300 rounded-md p-2 bg-white"><option value="">Select...</option><option value="Male">Male</option><option value="Female">Female</option></select></div><div><label className="block text-sm font-medium text-gray-700 mb-1">Birthday</label><input type="text" value={dob} onChange={(e) => setDob(e.target.value)} className="w-full border border-gray-300 rounded-md p-2" /></div></div><div><label className="block text-sm font-medium text-gray-700 mb-1">Occupation</label><input type="text" value={occupation} onChange={(e) => setOccupation(e.target.value)} className="w-full border border-gray-300 rounded-md p-2" /></div><div><label className="block text-sm font-medium text-gray-700 mb-1">Email</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border border-gray-300 rounded-md p-2" /></div><div><label className="block text-sm font-medium text-gray-700 mb-1">Phone</label><input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full border border-gray-300 rounded-md p-2" /></div><button type="submit" disabled={isSubmitting} className="bg-gray-900 text-white px-4 py-3 rounded-md hover:bg-gray-800 font-medium mt-2">{isSubmitting ? 'Saving...' : 'Save Registration'}</button>{statusMessage && <div className={`p-3 rounded-md mt-2 text-sm font-medium ${statusMessage.includes('✅') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{statusMessage}</div>}</form></div>)}
        {activeView === 'attendance' && (<div className="max-w-4xl mx-auto bg-white p-6 rounded-xl shadow-sm border"><button onClick={() => setActiveView('dashboard')} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-6"><ArrowLeft size={16} /> Back to Dashboard</button><div className="flex items-center gap-2 mb-4"><CheckSquare className="text-orange-500" size={24} /><h2 className="text-2xl font-bold">Service Check-In</h2></div><div className="flex flex-col md:flex-row gap-4 mb-6"><div className="flex-1"><label className="block text-sm font-medium text-gray-700 mb-1">Service Date</label><input type="date" value={checkinDate} onChange={(e) => setCheckinDate(e.target.value)} className="w-full border border-gray-300 rounded-md p-2" /></div><div className="flex-[2]"><label className="block text-sm font-medium text-gray-700 mb-1">Quick Search</label><div className="relative"><div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Search size={16} className="text-gray-400" /></div><input type="text" placeholder="Search by name..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full border border-gray-300 rounded-md py-2 pl-10 pr-3" /></div></div></div><div className="border border-gray-200 rounded-lg overflow-hidden mb-4"><div className="bg-gray-50 p-3 border-b border-gray-200 font-semibold text-gray-700 text-sm flex justify-between"><span>Congregation Roster</span><span className="text-orange-600">{selectedMembers.length} Selected</span></div><div className="max-h-[60vh] overflow-y-auto p-2 bg-white">{memberList.filter(m => m.full_name.toLowerCase().includes(searchTerm.toLowerCase())).map((m, idx) => (<label key={idx} className="flex items-center gap-4 p-4 hover:bg-orange-50 rounded-md cursor-pointer border-b border-gray-100 last:border-0"><input type="checkbox" checked={selectedMembers.includes(m.full_name)} onChange={() => toggleMemberSelection(m.full_name)} className="w-6 h-6 text-orange-500 rounded border-gray-300" /><span className="text-gray-800 font-medium select-none text-lg">{m.full_name}</span></label>))}</div></div><button onClick={handleSaveCheckins} disabled={isSubmitting || memberList.length === 0} className="w-full md:w-auto bg-orange-500 text-white px-8 py-4 rounded-md hover:bg-orange-600 font-bold text-lg disabled:bg-gray-400 shadow-md">{isSubmitting ? 'Saving...' : 'Save Attendance'}</button>{checkinStatusMessage && <div className={`p-4 rounded-md mt-4 text-sm font-medium ${checkinStatusMessage.includes('✅') ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-800 border border-red-200'}`}>{checkinStatusMessage}</div>}</div>)}
      </main>
    </div>
  );
}

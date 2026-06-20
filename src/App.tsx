import React, { useState, useEffect } from 'react';
import { Users, ArrowLeft, Sparkles, Lock, LogOut, Cake, CheckSquare, Search, UserPlus, ClipboardList, UserMinus, BarChart3, ShieldCheck, MessageCircle, MessageSquare, Heart, Gift, TrendingUp, CalendarDays } from 'lucide-react';
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
  const [crmTasks, setCrmTasks] = useState<any[]>([]);

  // --- VISUAL ANALYTICS STATES ---
  const [monthlyChartData, setMonthlyChartData] = useState<any[]>([]);
  const [selectedMonthData, setSelectedMonthData] = useState<any | null>(null);
  const [memberStats, setMemberStats] = useState<any[]>([]);

  // --- FORM STATES ---
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [occupation, setOccupation] = useState('');
  const [dobMonth, setDobMonth] = useState('');
  const [dobDay, setDobDay] = useState('');    
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
        if (activeView === 'analytics') { fetchAnalytics(); setSelectedMonthData(null); }
        if (activeView === 'tasks') { fetchBirthdays(); fetchCrmTasks(); }
    }
    if (session && activeView === 'attendance') {
      fetchMembersForCheckin();
      setSelectedMembers([]); setCheckinStatusMessage(''); setSearchTerm('');
    }
  }, [session, activeView, isAdmin]);

  // --- FETCHING LOGIC ---
  const fetchBirthdays = async () => {
    const { data } = await supabase.from('members').select('full_name, date_of_birth, phone_number');
    if (data) {
      const today = new Date();
      const currentMonth = today.getMonth();
      const currentDate = today.getDate();
      const tList: any[] = []; const wList: any[] = []; const mList: any[] = [];

      data.forEach(m => {
        if (!m.date_of_birth) return;
        const bDateObj = new Date(m.date_of_birth);
        if (isNaN(bDateObj.getTime())) return; 
        const bMonth = bDateObj.getMonth();
        const bDate = bDateObj.getDate();

        if (bMonth === currentMonth && bDate === currentDate) tList.push(m);
        else {
          const thisYearsBirthday = new Date(today.getFullYear(), bMonth, bDate);
          const diffDays = Math.ceil((thisYearsBirthday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          if (diffDays > 0 && diffDays <= 7) wList.push(m);
          else if (bMonth === currentMonth && diffDays > 7) mList.push(m);
        }
      });
      setBirthdaysToday(tList); setBirthdaysWeek(wList); setBirthdaysMonth(mList);
    }
  };

  const fetchMembersForCheckin = async () => { const { data } = await supabase.from('members').select('full_name').order('full_name'); if (data) setMemberList(data); };
  const fetchGuests = async () => { const { data } = await supabase.from('members').select('*').in('status', ['1st Timer', '2nd Timer']).order('created_at', { ascending: false }); if (data) setGuestList(data); };
  
  const fetchAnalytics = async () => { 
    const { data } = await supabase.from('member_checkins').select('*'); 
    if (data) { 
      const monthMap: any = {};
      data.forEach(checkin => {
        const dateObj = new Date(checkin.service_date);
        const monthKey = dateObj.toLocaleString('default', { month: 'long', year: 'numeric' });
        if (!monthMap[monthKey]) monthMap[monthKey] = { monthName: monthKey, total: 0, sortDate: dateObj.getTime(), services: {} };
        monthMap[monthKey].total += 1;
        if (!monthMap[monthKey].services[checkin.service_date]) monthMap[monthKey].services[checkin.service_date] = 0;
        monthMap[monthKey].services[checkin.service_date] += 1;
      });
      const formattedMonths = Object.values(monthMap).sort((a: any, b: any) => a.sortDate - b.sortDate);
      setMonthlyChartData(formattedMonths);
      const memberCounts = data.reduce((acc: any, curr: any) => { acc[curr.member_name] = (acc[curr.member_name] || 0) + 1; return acc; }, {}); 
      setMemberStats(Object.keys(memberCounts).map(name => ({ name, count: memberCounts[name] })).sort((a, b) => b.count - a.count)); 
    } 
  };
  
  const fetchAbsentees = async () => {
    const { data: allMembers } = await supabase.from('members').select('*').order('full_name');
    const { data: allCheckins } = await supabase.from('member_checkins').select('*');

    if (allMembers && allCheckins) {
      const globalServiceDates = [...new Set(allCheckins.map(c => c.service_date))].sort();
      const lastCheckinMap: any = {};
      allCheckins.forEach(c => {
        if (!lastCheckinMap[c.member_name] || c.service_date > lastCheckinMap[c.member_name]) {
          lastCheckinMap[c.member_name] = c.service_date;
        }
      });

      const smartAbsentees: any[] = [];
      allMembers.forEach(member => {
        let missedCount = 0;
        const lastCheckin = lastCheckinMap[member.full_name];

        if (lastCheckin) missedCount = globalServiceDates.filter(date => date > lastCheckin).length;
        else {
          const createdDate = new Date(member.created_at || new Date()).toISOString().split('T')[0];
          missedCount = globalServiceDates.filter(date => date >= createdDate).length;
        }

        if (missedCount >= 2) {
          let alertLevel = 'Yellow Alert'; let colorClass = 'bg-yellow-100 text-yellow-800 border-yellow-300'; let icon = '🟡';
          if (missedCount >= 8) { alertLevel = 'Red Alert'; colorClass = 'bg-red-100 text-red-800 border-red-300'; icon = '🚨'; } 
          else if (missedCount >= 4) { alertLevel = 'Orange Alert'; colorClass = 'bg-orange-100 text-orange-800 border-orange-300'; icon = '🟧'; }
          smartAbsentees.push({ ...member, missedCount, alertLevel, colorClass, icon });
        }
      });
      smartAbsentees.sort((a, b) => b.missedCount - a.missedCount);
      setAbsenteeList(smartAbsentees);
    }
  };

  const fetchCrmTasks = async () => {
    const { data: members } = await supabase.from('members').select('*');
    const { data: checkins } = await supabase.from('member_checkins').select('*');
    if (!members || !checkins) return;

    const today = new Date(); today.setHours(0, 0, 0, 0);
    const sortedDates = [...new Set(checkins.map(c => c.service_date))].sort();
    
    const lastCheckinMap: any = {};
    checkins.forEach(c => { if (!lastCheckinMap[c.member_name] || c.service_date > lastCheckinMap[c.member_name]) lastCheckinMap[c.member_name] = c.service_date; });

    const newTasks: any[] = [];
    members.forEach(member => {
      const createdDate = new Date(member.created_at || today); createdDate.setHours(0, 0, 0, 0);
      const daysSinceCreated = Math.floor((today.getTime() - createdDate.getTime()) / (1000 * 3600 * 24));
      const lastCheckinStr = lastCheckinMap[member.full_name];
      
      let missedCount = 0;
      if (lastCheckinStr) missedCount = sortedDates.filter(date => date > lastCheckinStr).length;
      else {
        const createdStr = createdDate.toISOString().split('T')[0];
        missedCount = sortedDates.filter(date => date >= createdStr).length;
      }

      if (member.status === '1st Timer' && daysSinceCreated >= 1 && daysSinceCreated <= 3) {
        newTasks.push({ priority: 1, type: 'Day 2 Follow-Up', color: 'bg-green-100 text-green-800', member, description: 'New guest! Send a warm welcome message.', msgTemplate: 'welcome' });
      } else if (member.status === '1st Timer' && missedCount >= 1 && daysSinceCreated >= 7) {
        newTasks.push({ priority: 2, type: 'Guest Check-In', color: 'bg-yellow-100 text-yellow-800', member, description: 'Did not return for their second week. Reach out!', msgTemplate: 'missed' });
      }
      
      if (missedCount >= 8) {
        newTasks.push({ priority: 3, type: '🚨 RED ALERT', color: 'bg-red-100 text-red-800', member, description: `Missed ${missedCount} services. Urgent care needed.`, msgTemplate: 'checking_in' });
      } else if (missedCount >= 4) {
        newTasks.push({ priority: 4, type: '🟧 ORANGE ALERT', color: 'bg-orange-100 text-orange-800', member, description: `Missed ${missedCount} services. Needs follow-up.`, msgTemplate: 'checking_in' });
      } else if (missedCount >= 2 && member.status === 'Regular') {
        newTasks.push({ priority: 5, type: '🟡 YELLOW ALERT', color: 'bg-yellow-100 text-yellow-800', member, description: `Missed ${missedCount} services. Send a quick text.`, msgTemplate: 'missed' });
      }
    });

    newTasks.sort((a, b) => a.priority - b.priority); setCrmTasks(newTasks);
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
    const formattedDob = (dobMonth && dobDay) ? `${dobMonth} ${dobDay}` : null;
    try {
      const { error } = await supabase.from('members').insert([{ full_name: name, email: email, phone_number: phone, occupation: occupation, date_of_birth: formattedDob, gender: gender, status: memberStatus }]);
      if (error) throw error;
      setStatusMessage(`✅ ${memberStatus} successfully registered!`);
      setName(''); setEmail(''); setPhone(''); setOccupation(''); setDobMonth(''); setDobDay(''); setGender(''); setMemberStatus('Regular');
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

  const BirthdayRow = ({ person }: { person: any }) => (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 last:border-0 p-4 hover:bg-gray-50 transition-colors gap-3">
      <div><div className="font-bold text-gray-900 text-lg">{person.full_name}</div><div className="text-gray-500 text-sm">{person.date_of_birth} • {person.phone_number || 'No Phone'}</div></div>
      <div className="flex items-center gap-2 flex-wrap"><button onClick={() => handleSendMessage(person.phone_number, person.full_name, 'whatsapp', 'birthday')} className="flex items-center gap-1 bg-green-50 border border-green-200 text-green-700 px-3 py-1.5 rounded hover:bg-green-100 text-sm font-medium transition-colors"><MessageCircle size={16}/> WhatsApp</button><button onClick={() => handleSendMessage(person.phone_number, person.full_name, 'sms', 'birthday')} className="flex items-center gap-1 bg-blue-50 border border-blue-200 text-blue-700 px-3 py-1.5 rounded hover:bg-blue-100 text-sm font-medium transition-colors"><MessageSquare size={16}/> SMS</button><button onClick={() => { setActiveView('outreach'); setPromptContext(`Draft a highly personalized, joyous, and prophetic birthday blessing for ${person.full_name} who is a member of Grace Citadel church.`); }} className="flex items-center gap-1 bg-purple-50 border border-purple-200 text-purple-700 px-3 py-1.5 rounded hover:bg-purple-100 text-sm font-medium transition-colors"><Sparkles size={16}/> AI Drafter</button></div>
    </div>
  );

  // --- COMMAND CENTER TASK FILTERING ---
  const guestTasks = crmTasks.filter(t => t.member.status === '1st Timer' || t.member.status === '2nd Timer');
  const urgentMissingTasks = crmTasks.filter(t => t.type.includes('RED') || t.type.includes('ORANGE'));
  const routineTasks = crmTasks.filter(t => !guestTasks.includes(t) && !urgentMissingTasks.includes(t));

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

  const maxMonthlyTotal = monthlyChartData.length > 0 ? Math.max(...monthlyChartData.map(d => d.total)) : 1;

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

              {isAdmin && (
                <>
                  <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-xl shadow-sm border border-indigo-200 hover:shadow-md transition-shadow">
                      <h2 className="text-lg font-semibold mb-2 text-indigo-800 flex items-center gap-2"><TrendingUp size={18} className="text-indigo-600"/> Service Analytics</h2>
                      <p className="text-indigo-600 text-sm mb-4">Visual charts of weekly, monthly, and yearly church growth.</p>
                      <button onClick={() => setActiveView('analytics')} className="text-indigo-700 font-bold text-sm hover:underline">Open Dashboard 📊 &rarr;</button>
                  </div>

                  {/* COMMAND CENTER BUTTON */}
                  <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-6 rounded-xl shadow-md border border-gray-700 hover:shadow-lg transition-shadow relative overflow-hidden">
                      {crmTasks.length > 0 && <div className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">{crmTasks.length} Action{crmTasks.length !== 1 ? 's' : ''} Needed</div>}
                      <h2 className="text-lg font-semibold mb-2 text-white flex items-center gap-2"><ShieldCheck size={18} className="text-orange-500"/> Pastoral Command Center</h2>
                      <p className="text-gray-400 text-sm mb-4">Your daily hub for birthdays, guests, and follow-ups.</p>
                      <button onClick={() => setActiveView('tasks')} className="text-orange-400 font-bold text-sm hover:underline">Open Command Center &rarr;</button>
                  </div>

                  <div className="bg-white p-6 rounded-xl shadow-sm border hover:shadow-md transition-shadow">
                      <h2 className="text-lg font-semibold mb-2 text-red-700 flex items-center gap-2"><UserMinus size={18} className="text-red-600"/> Smart Absentee Radar</h2>
                      <p className="text-gray-500 text-sm mb-4">Color-coded alerts for missed services (Yellow, Orange, Red).</p>
                      <button onClick={() => setActiveView('absentees')} className="text-red-600 font-medium text-sm hover:underline">View Radar Triage &rarr;</button>
                  </div>

                  <div className="bg-white p-6 rounded-xl shadow-sm border border-blue-200 hover:shadow-md transition-shadow relative overflow-hidden">
                      {birthdaysToday.length > 0 && <div className="absolute top-0 right-0 bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">Today!</div>}
                      <h2 className="text-lg font-semibold mb-2 text-blue-800 flex items-center gap-2"><Gift size={18} className="text-blue-600"/> Birthday Dashboard</h2>
                      <p className="text-blue-600 text-sm mb-4">{birthdaysToday.length} today • {birthdaysWeek.length} this week</p>
                      <button onClick={() => setActiveView('birthdays')} className="text-blue-700 font-bold text-sm hover:underline">Manage Birthdays &rarr;</button>
                  </div>

                  <div className="bg-white p-6 rounded-xl shadow-sm border hover:shadow-md transition-shadow"><h2 className="text-lg font-semibold mb-2 text-gray-900 flex items-center gap-2"><ClipboardList size={18} className="text-orange-500"/> Guest Roster</h2><p className="text-gray-500 text-sm mb-4">View 1st and 2nd Timer details for follow-up.</p><button onClick={() => setActiveView('guests')} className="text-blue-600 font-medium text-sm hover:underline">View Guests &rarr;</button></div>
                  <div className="bg-white p-6 rounded-xl shadow-sm border hover:shadow-md transition-shadow"><h2 className="text-lg font-semibold mb-2 text-gray-900 flex items-center gap-2"><Sparkles size={18} className="text-orange-500"/> AI Outreach</h2><p className="text-gray-500 text-sm mb-4">Draft personalized messages using Gemini.</p><button onClick={() => setActiveView('outreach')} className="text-blue-600 font-medium text-sm hover:underline">Draft Message &rarr;</button></div>
                </>
              )}
            </div>
          </div>
        )}

        {/* --- 🔥 NEW: PASTORAL COMMAND CENTER 🔥 --- */}
        {activeView === 'tasks' && isAdmin && (
            <div className="max-w-6xl mx-auto space-y-6">
                <button onClick={() => setActiveView('dashboard')} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800"><ArrowLeft size={16} /> Back to Dashboard</button>
                
                <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-8 rounded-xl shadow-md text-white flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
                    <div>
                        <h2 className="text-3xl font-bold mb-2 flex items-center gap-3"><ShieldCheck size={32} className="text-orange-500" /> Pastoral Command Center</h2>
                        <p className="text-gray-300">Your single dashboard for congregational care, birthdays, and automated follow-ups.</p>
                    </div>
                    <div className="bg-gray-800 border border-gray-700 px-6 py-3 rounded-lg text-center shadow-inner">
                        <div className="text-2xl font-black text-orange-500">{crmTasks.length}</div>
                        <div className="text-xs text-gray-400 font-bold uppercase tracking-wider">Tasks Pending</div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* LEFT COLUMN */}
                    <div className="space-y-6">
                        
                        {/* 1. TODAY'S BIRTHDAYS */}
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 shadow-sm">
                            <h3 className="text-lg font-bold text-blue-900 mb-4 flex items-center gap-2"><Gift size={20} className="text-blue-600"/> Today's Birthdays</h3>
                            {birthdaysToday.length === 0 ? (
                                <p className="text-blue-600/70 text-sm font-medium">No birthdays scheduled for today.</p>
                            ) : (
                                <div className="space-y-3">
                                    {birthdaysToday.map((person, idx) => (
                                        <div key={idx} className="bg-white p-4 rounded-lg border border-blue-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
                                            <div>
                                                <p className="font-bold text-gray-900">{person.full_name}</p>
                                                <p className="text-xs text-gray-500">{person.phone_number || 'No Phone'}</p>
                                            </div>
                                            <div className="flex gap-2">
                                                <button onClick={() => handleSendMessage(person.phone_number, person.full_name, 'whatsapp', 'birthday')} className="bg-green-50 text-green-700 px-3 py-1.5 rounded hover:bg-green-100 text-sm font-medium flex items-center gap-1 border border-green-200 transition-colors"><MessageCircle size={14}/> WA</button>
                                                <button onClick={() => handleSendMessage(person.phone_number, person.full_name, 'sms', 'birthday')} className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded hover:bg-blue-100 text-sm font-medium flex items-center gap-1 border border-blue-200 transition-colors"><MessageSquare size={14}/> SMS</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* 2. NEW GUESTS FOLLOW-UP */}
                        <div className="bg-green-50 border border-green-200 rounded-xl p-5 shadow-sm">
                            <h3 className="text-lg font-bold text-green-900 mb-4 flex items-center gap-2"><Sparkles size={20} className="text-green-600"/> New Guests Follow-Up</h3>
                            {guestTasks.length === 0 ? (
                                <p className="text-green-600/70 text-sm font-medium">All guests have been followed up with.</p>
                            ) : (
                                <div className="space-y-3">
                                    {guestTasks.map((task, idx) => (
                                        <div key={idx} className="bg-white p-4 rounded-lg border border-green-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <p className="font-bold text-gray-900">{task.member.full_name}</p>
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${task.color}`}>{task.type}</span>
                                                </div>
                                                <p className="text-xs text-gray-500">{task.description}</p>
                                            </div>
                                            <div className="flex gap-2">
                                                <button onClick={() => handleSendMessage(task.member.phone_number, task.member.full_name, 'whatsapp', task.msgTemplate)} className="bg-green-50 text-green-700 p-2 rounded-full hover:bg-green-100 border border-green-200 transition-colors" title="WhatsApp"><MessageCircle size={16}/></button>
                                                <button onClick={() => handleSendMessage(task.member.phone_number, task.member.full_name, 'sms', task.msgTemplate)} className="bg-blue-50 text-blue-700 p-2 rounded-full hover:bg-blue-100 border border-blue-200 transition-colors" title="SMS"><MessageSquare size={16}/></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                    </div>

                    {/* RIGHT COLUMN */}
                    <div className="space-y-6">
                        
                        {/* 3. MISSING MEMBERS (Red & Orange Alerts) */}
                        <div className="bg-red-50 border border-red-200 rounded-xl p-5 shadow-sm">
                            <h3 className="text-lg font-bold text-red-900 mb-4 flex items-center gap-2"><UserMinus size={20} className="text-red-600"/> Urgent: Missing Members</h3>
                            {urgentMissingTasks.length === 0 ? (
                                <p className="text-red-600/70 text-sm font-medium">No urgent absentee alerts triggered.</p>
                            ) : (
                                <div className="space-y-3">
                                    {urgentMissingTasks.map((task, idx) => (
                                        <div key={idx} className="bg-white p-4 rounded-lg border border-red-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <p className="font-bold text-gray-900">{task.member.full_name}</p>
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${task.color}`}>{task.type}</span>
                                                </div>
                                                <p className="text-xs text-gray-500">{task.description}</p>
                                            </div>
                                            <div className="flex gap-2">
                                                <button onClick={() => handleSendMessage(task.member.phone_number, task.member.full_name, 'whatsapp', task.msgTemplate)} className="bg-green-50 text-green-700 p-2 rounded-full hover:bg-green-100 border border-green-200 transition-colors" title="WhatsApp"><MessageCircle size={16}/></button>
                                                <button onClick={() => handleSendMessage(task.member.phone_number, task.member.full_name, 'sms', task.msgTemplate)} className="bg-blue-50 text-blue-700 p-2 rounded-full hover:bg-blue-100 border border-blue-200 transition-colors" title="SMS"><MessageSquare size={16}/></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* 4. ROUTINE FOLLOW-UPS (Yellow Alerts & Missed Last Service) */}
                        <div className="bg-orange-50 border border-orange-200 rounded-xl p-5 shadow-sm">
                            <h3 className="text-lg font-bold text-orange-900 mb-4 flex items-center gap-2"><Heart size={20} className="text-orange-600"/> Routine Follow-Ups</h3>
                            {routineTasks.length === 0 ? (
                                <p className="text-orange-600/70 text-sm font-medium">No routine tasks pending.</p>
                            ) : (
                                <div className="space-y-3">
                                    {routineTasks.map((task, idx) => (
                                        <div key={idx} className="bg-white p-4 rounded-lg border border-orange-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <p className="font-bold text-gray-900">{task.member.full_name}</p>
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${task.color}`}>{task.type}</span>
                                                </div>
                                                <p className="text-xs text-gray-500">{task.description}</p>
                                            </div>
                                            <div className="flex gap-2">
                                                <button onClick={() => handleSendMessage(task.member.phone_number, task.member.full_name, 'whatsapp', task.msgTemplate)} className="bg-green-50 text-green-700 p-2 rounded-full hover:bg-green-100 border border-green-200 transition-colors" title="WhatsApp"><MessageCircle size={16}/></button>
                                                <button onClick={() => handleSendMessage(task.member.phone_number, task.member.full_name, 'sms', task.msgTemplate)} className="bg-blue-50 text-blue-700 p-2 rounded-full hover:bg-blue-100 border border-blue-200 transition-colors" title="SMS"><MessageSquare size={16}/></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                    </div>
                </div>
            </div>
        )}

        {/* ... [ALL OTHER EXISTING VIEWS (GUESTS, ANALYTICS, BIRTHDAYS, ABSENTEES, OUTREACH)] ... */}
        {(activeView === 'guests') && (<div className="max-w-6xl mx-auto mb-4 bg-white p-4 rounded-xl shadow-sm border flex flex-col sm:flex-row items-start sm:items-center gap-4"><label className="font-semibold text-gray-800">Quick Message Template:</label><select value={template} onChange={(e) => setTemplate(e.target.value)} className="border border-gray-300 rounded-md p-2 flex-1 outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"><option value="welcome">👋 Welcome Guest Message</option><option value="missed">❤️ We Missed You Message</option><option value="checking_in">👀 Checking In (Absentee)</option><option value="birthday">🎂 Birthday Blessing</option></select></div>)}
        
        {activeView === 'absentees' && isAdmin && (<div className="max-w-6xl mx-auto space-y-6"><button onClick={() => setActiveView('dashboard')} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800"><ArrowLeft size={16} /> Back to Dashboard</button><div className="bg-gradient-to-r from-red-600 to-orange-600 p-8 rounded-xl shadow-md text-white flex items-center justify-between mb-2"><div><h2 className="text-3xl font-bold mb-2 flex items-center gap-3"><UserMinus size={32} /> Smart Absentee Radar</h2><p className="text-red-100">Automatically tracks missed services to prioritize pastoral care and follow-ups.</p></div></div><div className="grid grid-cols-3 gap-4 mb-6"><div className="bg-white p-4 rounded-lg border border-yellow-300 text-center shadow-sm"><div className="text-2xl font-black text-yellow-500 mb-1">🟡</div><div className="text-sm font-bold text-gray-800">Yellow Alert</div><div className="text-xs text-gray-500">Missed 2+ Services</div></div><div className="bg-white p-4 rounded-lg border border-orange-300 text-center shadow-sm"><div className="text-2xl font-black text-orange-500 mb-1">🟧</div><div className="text-sm font-bold text-gray-800">Orange Alert</div><div className="text-xs text-gray-500">Missed 4+ Services</div></div><div className="bg-white p-4 rounded-lg border border-red-300 text-center shadow-sm"><div className="text-2xl font-black text-red-500 mb-1">🚨</div><div className="text-sm font-bold text-gray-800">Red Alert</div><div className="text-xs text-gray-500">Missed 8+ Services</div></div></div><div className="overflow-x-auto border border-gray-200 rounded-xl bg-white shadow-sm"><table className="w-full text-left border-collapse"><thead><tr className="bg-gray-50 border-b border-gray-200 text-sm font-semibold text-gray-700"><th className="p-4">Member Profile</th><th className="p-4">Missed Count</th><th className="p-4">Triage Status</th><th className="p-4">Quick Actions</th><th className="p-4">AI Drafter</th></tr></thead><tbody className="divide-y divide-gray-100">{absenteeList.length === 0 ? (<tr><td colSpan={5} className="p-8 text-center text-gray-500 font-medium text-lg">Amazing! Everyone is accounted for.</td></tr>) : (absenteeList.map((person, idx) => (<tr key={idx} className="hover:bg-gray-50 transition-colors"><td className="p-4"><div className="font-bold text-gray-900 text-lg">{person.full_name}</div><div className="text-gray-500 text-sm">{person.phone_number || 'No Phone'}</div></td><td className="p-4 font-black text-gray-700 text-xl">{person.missedCount} <span className="text-sm font-medium text-gray-500">services</span></td><td className="p-4"><span className={`px-3 py-1.5 rounded-full text-xs font-bold border flex items-center gap-2 w-max ${person.colorClass}`}>{person.icon} {person.alertLevel}</span></td><td className="p-4"><div className="flex items-center gap-2"><button onClick={() => handleSendMessage(person.phone_number, person.full_name, 'whatsapp', person.missedCount >= 8 ? 'checking_in' : 'missed')} className="text-green-600 hover:bg-green-100 p-2 rounded-full transition-colors" title="Send WhatsApp"><MessageCircle size={20} /></button><button onClick={() => handleSendMessage(person.phone_number, person.full_name, 'sms', person.missedCount >= 8 ? 'checking_in' : 'missed')} className="text-blue-600 hover:bg-blue-100 p-2 rounded-full transition-colors" title="Send SMS"><MessageSquare size={20} /></button></div></td><td className="p-4"><button onClick={() => {setActiveView('outreach'); setPromptContext(`Draft a highly empathetic and pastoral check-in message for ${person.full_name} who has missed ${person.missedCount} church services. We want them to know they are deeply loved and missed, without sounding condemning.`);}} className="text-xs bg-white border border-gray-300 text-gray-700 px-3 py-2 rounded hover:bg-gray-100 font-medium transition-colors">Custom AI Draft</button></td></tr>)))}</tbody></table></div></div>)}
        {activeView === 'analytics' && isAdmin && (<div className="max-w-6xl mx-auto space-y-6"><button onClick={() => setActiveView('dashboard')} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800"><ArrowLeft size={16} /> Back to Dashboard</button><div className="bg-gradient-to-r from-indigo-700 to-purple-800 p-8 rounded-xl shadow-md text-white flex items-center justify-between mb-8"><div><h2 className="text-3xl font-bold mb-2 flex items-center gap-3"><TrendingUp size={32} /> Service Analytics Dashboard</h2><p className="text-indigo-200">Track monthly trends, measure service attendance, and identify church growth patterns.</p></div></div><div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"><h3 className="text-xl font-bold text-gray-800 mb-6 border-b pb-4 flex items-center gap-2"><BarChart3 className="text-indigo-600"/> Monthly Growth Trend</h3>{monthlyChartData.length === 0 ? (<div className="text-center p-12 text-gray-500 bg-gray-50 rounded-lg">No attendance data recorded yet.</div>) : (<div className="flex items-end gap-2 md:gap-6 h-64 mt-8 pb-4 border-b-2 border-gray-100 overflow-x-auto">{monthlyChartData.map((data, idx) => { const barHeight = Math.max((data.total / maxMonthlyTotal) * 100, 5); const isSelected = selectedMonthData?.monthName === data.monthName; return (<div key={idx} onClick={() => setSelectedMonthData(data)} className="flex flex-col items-center flex-1 min-w-[60px] group cursor-pointer"><span className={`text-xs font-bold mb-2 transition-colors ${isSelected ? 'text-indigo-700 scale-110' : 'text-gray-400 group-hover:text-indigo-500'}`}>{data.total}</span><div style={{ height: `${barHeight}%` }} className={`w-full rounded-t-md transition-all duration-300 ${isSelected ? 'bg-indigo-600 shadow-lg' : 'bg-indigo-200 group-hover:bg-indigo-400'}`}></div><span className={`text-xs mt-3 whitespace-nowrap font-medium ${isSelected ? 'text-indigo-900' : 'text-gray-500'}`}>{data.monthName.split(' ')[0]}</span></div>); })}</div>)}</div><div className="grid grid-cols-1 lg:grid-cols-2 gap-6"><div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"><div className="bg-indigo-50 p-4 border-b border-indigo-100"><h3 className="text-lg font-bold text-indigo-900 flex items-center gap-2"><CalendarDays size={20} className="text-indigo-600"/> {selectedMonthData ? `Service Breakdown: ${selectedMonthData.monthName}` : 'Select a month to see breakdown'}</h3></div><div className="p-0">{!selectedMonthData ? (<div className="p-12 text-center text-gray-500">Click a bar on the chart above to view individual service numbers for that month.</div>) : (<table className="w-full text-left border-collapse"><thead><tr className="bg-gray-50 border-b text-sm text-gray-600"><th className="p-4 font-semibold">Service Date</th><th className="p-4 font-semibold">Total Attendance</th></tr></thead><tbody className="divide-y divide-gray-100">{Object.entries(selectedMonthData.services).sort().map(([date, count]: [string, any], idx) => (<tr key={idx} className="hover:bg-indigo-50 transition-colors"><td className="p-4 font-medium text-gray-900">{new Date(date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</td><td className="p-4 font-bold text-indigo-700">{count} members</td></tr>))}<tr className="bg-indigo-600 text-white font-bold"><td className="p-4 text-right uppercase text-xs tracking-wider">Monthly Total</td><td className="p-4 text-xl">{selectedMonthData.total}</td></tr></tbody></table>)}</div></div><div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"><div className="bg-gray-50 p-4 border-b border-gray-200"><h3 className="text-lg font-bold text-gray-900 flex items-center gap-2"><Users size={20} className="text-orange-500"/> Consistency Leaderboard</h3></div><div className="max-h-[400px] overflow-y-auto"><table className="w-full text-left border-collapse"><thead><tr className="bg-white border-b text-sm text-gray-600 sticky top-0 shadow-sm"><th className="p-4 font-semibold">Member Name</th><th className="p-4 font-semibold">Total Services Attended</th></tr></thead><tbody className="divide-y divide-gray-100">{memberStats.length === 0 ? (<tr><td colSpan={2} className="p-4 text-center text-gray-500">No attendance data yet.</td></tr>) : (memberStats.map((member, idx) => (<tr key={idx} className="hover:bg-orange-50"><td className="p-4 font-medium text-gray-900 flex items-center gap-2">{idx < 3 && <span className="text-lg" title={`Top ${idx+1}`}>🏆</span>}{member.name}</td><td className="p-4 font-bold text-orange-600">{member.count}x</td></tr>)))}</tbody></table></div></div></div></div>)}
        {activeView === 'birthdays' && isAdmin && (<div className="max-w-4xl mx-auto space-y-6"><button onClick={() => setActiveView('dashboard')} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800"><ArrowLeft size={16} /> Back to Dashboard</button><div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-8 rounded-xl shadow-md text-white flex items-center justify-between"><div><h2 className="text-3xl font-bold mb-2 flex items-center gap-3"><Cake size={32} /> Birthday Management</h2><p className="text-blue-100">Send blessings, celebrate milestones, and manage upcoming birthdays.</p></div></div><div className="bg-white rounded-xl shadow-sm border border-blue-200 overflow-hidden"><div className="bg-blue-50 border-b border-blue-200 p-4 font-bold text-blue-900 flex items-center gap-2 text-lg"><span>🎂</span> Today's Birthdays</div><div>{birthdaysToday.length === 0 ? (<div className="p-6 text-center text-gray-500">No birthdays today.</div>) : (birthdaysToday.map((person, idx) => <BirthdayRow key={idx} person={person} />))}</div></div><div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"><div className="bg-gray-50 border-b border-gray-200 p-4 font-bold text-gray-800 flex items-center gap-2 text-lg"><span>🎉</span> This Week's Birthdays (Next 7 Days)</div><div>{birthdaysWeek.length === 0 ? (<div className="p-6 text-center text-gray-500">No upcoming birthdays this week.</div>) : (birthdaysWeek.map((person, idx) => <BirthdayRow key={idx} person={person} />))}</div></div><div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"><div className="bg-gray-50 border-b border-gray-200 p-4 font-bold text-gray-800 flex items-center gap-2 text-lg"><span>🗓️</span> Later This Month</div><div>{birthdaysMonth.length === 0 ? (<div className="p-6 text-center text-gray-500">No other birthdays later this month.</div>) : (birthdaysMonth.map((person, idx) => <BirthdayRow key={idx} person={person} />))}</div></div></div>)}
        {activeView === 'guests' && isAdmin && (<div className="max-w-6xl mx-auto bg-white p-6 rounded-xl shadow-sm border"><button onClick={() => setActiveView('dashboard')} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-6"><ArrowLeft size={16} /> Back to Dashboard</button><div className="flex items-center gap-2 mb-4"><ClipboardList className="text-orange-500" size={24} /><h2 className="text-2xl font-bold">Guest Follow-Up Roster</h2></div><div className="overflow-x-auto border border-gray-200 rounded-lg"><table className="w-full text-left border-collapse"><thead><tr className="bg-gray-50 border-b border-gray-200 text-sm font-semibold text-gray-700"><th className="p-4">Name</th><th className="p-4">Status</th><th className="p-4">Phone</th><th className="p-4">Send Message</th></tr></thead><tbody className="divide-y divide-gray-200">{guestList.length === 0 ? (<tr><td colSpan={4} className="p-6 text-center text-gray-500">No guests found.</td></tr>) : (guestList.map((guest, idx) => (<tr key={idx} className="hover:bg-orange-50"><td className="p-4 font-medium text-gray-900">{guest.full_name}</td><td className="p-4"><span className={`px-3 py-1 rounded-full text-xs font-bold ${guest.status === '1st Timer' ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800'}`}>{guest.status}</span></td><td className="p-4 text-gray-600">{guest.phone_number || '-'}</td><td className="p-4"><div className="flex items-center gap-3"><button onClick={() => handleSendMessage(guest.phone_number, guest.full_name, 'whatsapp')} className="text-green-600 hover:bg-green-100 p-2 rounded-full transition-colors" title="Send WhatsApp"><MessageCircle size={20} /></button><button onClick={() => handleSendMessage(guest.phone_number, guest.full_name, 'sms')} className="text-blue-600 hover:bg-blue-100 p-2 rounded-full transition-colors" title="Send SMS"><MessageSquare size={20} /></button></div></td></tr>)))}</tbody></table></div></div>)}
        {activeView === 'outreach' && isAdmin && (<div className="max-w-4xl mx-auto bg-white p-6 rounded-xl shadow-sm border"><button onClick={() => setActiveView('dashboard')} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-6"><ArrowLeft size={16} /> Back to Dashboard</button><div className="flex items-center gap-2 mb-4"><Sparkles className="text-orange-500" size={24} /><h2 className="text-2xl font-bold">AI Outreach Drafter</h2></div><div className="space-y-4 max-w-2xl"><textarea rows={4} value={promptContext} onChange={(e) => setPromptContext(e.target.value)} className="w-full border border-gray-300 rounded-md p-3 resize-none focus:ring-2 focus:ring-orange-500" placeholder="Message details..." /><button onClick={handleGenerateMessage} disabled={isGenerating || !promptContext} className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 font-medium">{isGenerating ? 'Drafting...' : 'Generate Message'}</button>{generatedMessage && <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg"><h3 className="text-sm font-semibold text-gray-700 mb-2">Drafted Message:</h3><div className="text-gray-800 whitespace-pre-wrap">{generatedMessage}</div></div>}</div></div>)}
        {activeView === 'members' && (<div className="max-w-4xl mx-auto bg-white p-6 rounded-xl shadow-sm border"><button onClick={() => setActiveView('dashboard')} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-6"><ArrowLeft size={16} /> Back to Dashboard</button><h2 className="text-2xl font-bold mb-4">Registration Form</h2><form onSubmit={handleSaveMember} className="flex flex-col gap-4 max-w-md"><div className="bg-orange-50 p-4 rounded-lg border border-orange-100 mb-2"><label className="block text-sm font-bold text-orange-900 mb-1">Registration Type (Status)</label><select value={memberStatus} onChange={(e) => setMemberStatus(e.target.value)} className="w-full border border-orange-300 rounded-md p-2 bg-white outline-none focus:ring-2 focus:ring-orange-500"><option value="1st Timer">1st Timer</option><option value="2nd Timer">2nd Timer</option><option value="Regular">Regular Member</option></select></div><div><label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label><input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full border border-gray-300 rounded-md p-2" /></div><div className="grid grid-cols-2 gap-4"><div><label className="block text-sm font-medium text-gray-700 mb-1">Gender</label><select value={gender} onChange={(e) => setGender(e.target.value)} className="w-full border border-gray-300 rounded-md p-2 bg-white"><option value="">Select...</option><option value="Male">Male</option><option value="Female">Female</option></select></div><div><label className="block text-sm font-medium text-gray-700 mb-1">Birthday</label><div className="flex gap-2"><select value={dobMonth} onChange={(e) => setDobMonth(e.target.value)} className="w-1/2 border border-gray-300 rounded-md p-2 bg-white outline-none focus:ring-2 focus:ring-orange-500"><option value="">Month</option>{['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(m => <option key={m} value={m}>{m}</option>)}</select><select value={dobDay} onChange={(e) => setDobDay(e.target.value)} className="w-1/2 border border-gray-300 rounded-md p-2 bg-white outline-none focus:ring-2 focus:ring-orange-500"><option value="">Day</option>{[...Array(31)].map((_, i) => <option key={i+1} value={i+1}>{i+1}</option>)}</select></div></div></div><div><label className="block text-sm font-medium text-gray-700 mb-1">Occupation</label><input type="text" value={occupation} onChange={(e) => setOccupation(e.target.value)} className="w-full border border-gray-300 rounded-md p-2" /></div><div><label className="block text-sm font-medium text-gray-700 mb-1">Email</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border border-gray-300 rounded-md p-2" /></div><div><label className="block text-sm font-medium text-gray-700 mb-1">Phone</label><input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full border border-gray-300 rounded-md p-2" /></div><button type="submit" disabled={isSubmitting} className="bg-gray-900 text-white px-4 py-3 rounded-md hover:bg-gray-800 font-medium mt-2">{isSubmitting ? 'Saving...' : 'Save Registration'}</button>{statusMessage && <div className={`p-3 rounded-md mt-2 text-sm font-medium ${statusMessage.includes('✅') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{statusMessage}</div>}</form></div>)}
        {activeView === 'attendance' && (<div className="max-w-4xl mx-auto bg-white p-6 rounded-xl shadow-sm border"><button onClick={() => setActiveView('dashboard')} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-6"><ArrowLeft size={16} /> Back to Dashboard</button><div className="flex items-center gap-2 mb-4"><CheckSquare className="text-orange-500" size={24} /><h2 className="text-2xl font-bold">Service Check-In</h2></div><div className="flex flex-col md:flex-row gap-4 mb-6"><div className="flex-1"><label className="block text-sm font-medium text-gray-700 mb-1">Service Date</label><input type="date" value={checkinDate} onChange={(e) => setCheckinDate(e.target.value)} className="w-full border border-gray-300 rounded-md p-2" /></div><div className="flex-[2]"><label className="block text-sm font-medium text-gray-700 mb-1">Quick Search</label><div className="relative"><div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Search size={16} className="text-gray-400" /></div><input type="text" placeholder="Search by name..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full border border-gray-300 rounded-md py-2 pl-10 pr-3" /></div></div></div><div className="border border-gray-200 rounded-lg overflow-hidden mb-4"><div className="bg-gray-50 p-3 border-b border-gray-200 font-semibold text-gray-700 text-sm flex justify-between"><span>Congregation Roster</span><span className="text-orange-600">{selectedMembers.length} Selected</span></div><div className="max-h-[60vh] overflow-y-auto p-2 bg-white">{memberList.filter(m => m.full_name.toLowerCase().includes(searchTerm.toLowerCase())).map((m, idx) => (<label key={idx} className="flex items-center gap-4 p-4 hover:bg-orange-50 rounded-md cursor-pointer border-b border-gray-100 last:border-0"><input type="checkbox" checked={selectedMembers.includes(m.full_name)} onChange={() => toggleMemberSelection(m.full_name)} className="w-6 h-6 text-orange-500 rounded border-gray-300" /><span className="text-gray-800 font-medium select-none text-lg">{m.full_name}</span></label>))}</div></div><button onClick={handleSaveCheckins} disabled={isSubmitting || memberList.length === 0} className="w-full md:w-auto bg-orange-500 text-white px-8 py-4 rounded-md hover:bg-orange-600 font-bold text-lg disabled:bg-gray-400 shadow-md">{isSubmitting ? 'Saving...' : 'Save Attendance'}</button>{checkinStatusMessage && <div className={`p-4 rounded-md mt-4 text-sm font-medium ${checkinStatusMessage.includes('✅') ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-800 border border-red-200'}`}>{checkinStatusMessage}</div>}</div>)}
      </main>
    </div>
  );
}

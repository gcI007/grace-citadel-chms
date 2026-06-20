import React, { useState, useEffect } from 'react';
import { Users, ArrowLeft, Sparkles, Lock, LogOut, Cake, CheckSquare, Search, UserPlus, ClipboardList, UserMinus, BarChart3, ShieldCheck, MessageCircle, MessageSquare, Heart, Gift, TrendingUp, CalendarDays, Share2, FileText } from 'lucide-react';
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
  birthday: "Happy Birthday {name}! Grace Citadel celebrates you today. We pray this year brings you abundant joy, health, and favor!",
  bulk_student: "Greetings Students! This is a special update from Grace Citadel concerning our upcoming youth/campus fellowship. See you there!",
  bulk_men: "Greetings Men of Honor! This is a direct update from the Grace Citadel Men's Fellowship regarding our upcoming gathering."
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

  // --- BULK MESSAGE STATE ---
  const [bulkGroup, setBulkGroup] = useState('Student');
  const [bulkText, setBulkText] = useState(TEMPLATES.bulk_student);

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
        if (activeView === 'tasks') { fetchBirthdays(); fetchCrmTasks(); fetchAbsentees(); }
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
      const today = new Date(); const currentMonth = today.getMonth(); const currentDate = today.getDate();
      const tList: any[] = []; const wList: any[] = []; const mList: any[] = [];
      data.forEach(m => {
        if (!m.date_of_birth) return;
        const bDateObj = new Date(m.date_of_birth); if (isNaN(bDateObj.getTime())) return; 
        const bMonth = bDateObj.getMonth(); const bDate = bDateObj.getDate();
        if (bMonth === currentMonth && bDate === currentDate) tList.push(m);
        else {
          const thisYearsBirthday = new Date(today.getFullYear(), bMonth, bDate);
          const diffDays = Math.ceil((thisYearsBirthday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          if (diffDays > 0 && diffDays <= 7) wList.push(m); else if (bMonth === currentMonth && diffDays > 7) mList.push(m);
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
        const dateObj = new Date(checkin.service_date); const monthKey = dateObj.toLocaleString('default', { month: 'long', year: 'numeric' });
        if (!monthMap[monthKey]) monthMap[monthKey] = { monthName: monthKey, total: 0, sortDate: dateObj.getTime(), services: {} };
        monthMap[monthKey].total += 1;
        if (!monthMap[monthKey].services[checkin.service_date]) monthMap[monthKey].services[checkin.service_date] = 0;
        monthMap[monthKey].services[checkin.service_date] += 1;
      });
      setMonthlyChartData(Object.values(monthMap).sort((a: any, b: any) => a.sortDate - b.sortDate));
      const memberCounts = data.reduce((acc: any, curr: any) => { acc[curr.member_name] = (acc[curr.member_name] || 0) + 1; return acc; }, {}); 
      setMemberStats(Object.keys(memberCounts).map(name => ({ name, count: memberCounts[name] })).sort((a, b) => b.count - a.count)); 
    } 
  };
  
  const fetchAbsentees = async () => {
    const { data: allMembers } = await supabase.from('members').select('*').order('full_name');
    const { data: allCheckins } = await supabase.from('member_checkins').select('*');
    if (allMembers && allCheckins) {
      const globalServiceDates = [...new Set(allCheckins.map(c => c.service_date))].sort();
      const lastCheckinMap: any = {}; allCheckins.forEach(c => { if (!lastCheckinMap[c.member_name] || c.service_date > lastCheckinMap[c.member_name]) lastCheckinMap[c.member_name] = c.service_date; });
      const smartAbsentees: any[] = [];
      allMembers.forEach(member => {
        let missedCount = 0; const lastCheckin = lastCheckinMap[member.full_name];
        if (lastCheckin) missedCount = globalServiceDates.filter(date => date > lastCheckin).length;
        else missedCount = globalServiceDates.filter(date => date >= new Date(member.created_at || new Date()).toISOString().split('T')[0]).length;
        if (missedCount >= 2) {
          let alertLevel = 'Yellow Alert'; let colorClass = 'bg-yellow-100 text-yellow-800 border-yellow-300'; let icon = '🟡';
          if (missedCount >= 8) { alertLevel = 'Red Alert'; colorClass = 'bg-red-100 text-red-800 border-red-300'; icon = '🚨'; } 
          else if (missedCount >= 4) { alertLevel = 'Orange Alert'; colorClass = 'bg-orange-100 text-orange-800 border-orange-300'; icon = '🟧'; }
          smartAbsentees.push({ ...member, missedCount, alertLevel, colorClass, icon });
        }
      });
      setAbsenteeList(smartAbsentees.sort((a, b) => b.missedCount - a.missedCount));
    }
  };

  const fetchCrmTasks = async () => {
    const { data: members } = await supabase.from('members').select('*');
    const { data: checkins } = await supabase.from('member_checkins').select('*');
    if (!members || !checkins) return;
    const today = new Date(); today.setHours(0, 0, 0, 0); const sortedDates = [...new Set(checkins.map(c => c.service_date))].sort();
    const lastCheckinMap: any = {}; checkins.forEach(c => { if (!lastCheckinMap[c.member_name] || c.service_date > lastCheckinMap[c.member_name]) lastCheckinMap[c.member_name] = c.service_date; });
    const newTasks: any[] = [];
    members.forEach(member => {
      const createdDate = new Date(member.created_at || today); createdDate.setHours(0, 0, 0, 0);
      const daysSinceCreated = Math.floor((today.getTime() - createdDate.getTime()) / (1000 * 3600 * 24));
      const lastCheckinStr = lastCheckinMap[member.full_name];
      let missedCount = 0; if (lastCheckinStr) missedCount = sortedDates.filter(date => date > lastCheckinStr).length; else missedCount = sortedDates.filter(date => date >= createdDate.toISOString().split('T')[0]).length;
      if (member.status === '1st Timer' && daysSinceCreated >= 1 && daysSinceCreated <= 3) newTasks.push({ priority: 1, type: 'Day 2 Follow-Up', color: 'bg-green-100 text-green-800', member, description: 'New guest! Send a warm welcome message.', msgTemplate: 'welcome' });
      else if (member.status === '1st Timer' && missedCount >= 1 && daysSinceCreated >= 7) newTasks.push({ priority: 2, type: 'Guest Check-In', color: 'bg-yellow-100 text-yellow-800', member, description: 'Did not return for week 2.', msgTemplate: 'missed' });
      if (missedCount >= 8) newTasks.push({ priority: 3, type: '🚨 RED ALERT', color: 'bg-red-100 text-red-800', member, description: `Missed ${missedCount} services.`, msgTemplate: 'checking_in' });
      else if (missedCount >= 4) newTasks.push({ priority: 4, type: '🟧 ORANGE ALERT', color: 'bg-orange-100 text-orange-800', member, description: `Missed ${missedCount} services.`, msgTemplate: 'checking_in' });
      else if (missedCount >= 2 && member.status === 'Regular') newTasks.push({ priority: 5, type: '🟡 YELLOW ALERT', color: 'bg-yellow-100 text-yellow-800', member, description: `Missed ${missedCount} services.`, msgTemplate: 'missed' });
    });
    setCrmTasks(newTasks.sort((a, b) => a.priority - b.priority));
  };

  // --- 🔥 MONDAY EXECUTIVE REPORT ENGINE 🔥 ---
  const handleGenerateMondayReport = async () => {
    setIsSubmitting(true);
    const { data: checkins } = await supabase.from('member_checkins').select('*');
    const { data: members } = await supabase.from('members').select('*');
    setIsSubmitting(false);

    if (!checkins || !members) return alert('No data available to generate report.');

    // 1. Get the most recent service
    const sortedDates = [...new Set(checkins.map(c => c.service_date))].sort();
    const lastDate = sortedDates[sortedDates.length - 1];
    
    if (!lastDate) return alert('No services have been logged yet to summarize.');

    // 2. Calculate the metrics
    const lastServiceAttendance = checkins.filter(c => c.service_date === lastDate).length;
    const activeFirstTimers = members.filter(m => m.status === '1st Timer').length;
    const activeSecondTimers = members.filter(m => m.status === '2nd Timer').length;
    
    // Using our absentee list logic (Red Alerts = 8+ missed services)
    const redAlerts = absenteeList.filter(a => a.missedCount >= 8).length;
    const birthdays = birthdaysWeek.length;

    // 3. Format the beautiful WhatsApp Report
    const reportText = `📊 *GRACE CITADEL WEEKLY SUMMARY* 📊
*Service Date:* ${new Date(lastDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}

👥 *Total Attendance:* ${lastServiceAttendance} members
🌟 *Active 1st Timers:* ${activeFirstTimers}
⭐ *Active 2nd Timers:* ${activeSecondTimers}

🚨 *Urgent Absentees (Red Alert):* ${redAlerts} members
🎂 *Birthdays This Week:* ${birthdays} members

_Auto-generated by Grace Citadel ChMS_`;

    // 4. Fire to WhatsApp Broadcast
    window.open(`https://wa.me/?text=${encodeURIComponent(reportText)}`, '_blank');
  };

  const handleSendMessage = (phone: string | null, name: string, type: 'whatsapp' | 'sms', overrideTemplate?: string) => {
    if (!phone) return alert(`No phone number recorded for ${name}.`);
    const cleanPhone = phone.replace(/\D/g, ''); 
    const message = TEMPLATES[Math.max(0, Object.keys(TEMPLATES).indexOf(overrideTemplate || template)) ? (overrideTemplate || template) as keyof typeof TEMPLATES : 'welcome'].replace('{name}', name);
    if (type === 'whatsapp') window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');
    else window.open(`sms:${cleanPhone}?body=${encodeURIComponent(message)}`, '_blank');
  };

  const handleSendBulkMessage = async (type: 'whatsapp' | 'sms') => {
    setIsSubmitting(true);
    const { data: targets } = await supabase.from('members').select('phone_number, gender, status, occupation');
    if (!targets || targets.length === 0) { setIsSubmitting(false); return alert('No members found.'); }
    
    let filtered = [];
    if (bulkGroup === 'Student') filtered = targets.filter(m => m.status === 'Student' || m.occupation?.toLowerCase().includes('student'));
    if (bulkGroup === 'Men') filtered = targets.filter(m => m.gender === 'Male');
    if (bulkGroup === 'Women') filtered = targets.filter(m => m.gender === 'Female');
    
    const phones = filtered.map(m => m.phone_number).filter(p => p !== null) as string[];
    if (phones.length === 0) { setIsSubmitting(false); return alert('No valid phone numbers found for this group.'); }

    const cleanPhones = phones.map(p => p.replace(/\D/g, ''));
    const encodedText = encodeURIComponent(bulkText);

    if (type === 'whatsapp') window.open(`https://wa.me/?phone=${cleanPhones.join(',')}&text=${encodedText}`, '_blank');
    else window.open(`sms:${cleanPhones.join(navigator.userAgent.includes('Mac') ? ',' : ';')}?body=${encodedText}`, '_blank');
    setIsSubmitting(false);
  };

  const handleLogin = async (e: React.FormEvent) => { e.preventDefault(); setIsAuthenticating(true); setAuthError(''); const { error } = await supabase.auth.signInWithPassword({ email: loginEmail, password: loginPassword }); if (error) setAuthError(error.message); setIsAuthenticating(false); };
  const handleLogout = async () => { await supabase.auth.signOut(); setActiveView('dashboard'); };

  const handleSaveMember = async (e: React.FormEvent) => {
    e.preventDefault(); setIsSubmitting(true); setStatusMessage('Saving to secure database...');
    const formattedDob = (dobMonth && dobDay) ? `${dobMonth} ${dobDay}` : null;
    try {
      const { error } = await supabase.from('members').insert([{ full_name: name, email: email, phone_number: phone, occupation: occupation, date_of_birth: formattedDob, gender: gender, status: memberStatus }]);
      if (error) throw error;
      setStatusMessage(`✅ Registered successfully!`);
      setName(''); setEmail(''); setPhone(''); setOccupation(''); setDobMonth(''); setDobDay(''); setGender(''); setMemberStatus('Regular');
    } catch (error: any) { setStatusMessage('❌ Error: ' + error.message); } finally { setIsSubmitting(false); }
  };

  const toggleMemberSelection = (memberName: string) => setSelectedMembers(prev => prev.includes(memberName) ? prev.filter(n => n !== memberName) : [...prev, memberName]);
  const handleSaveCheckins = async () => {
    if (selectedMembers.length === 0) return setCheckinStatusMessage('❌ Please select at least one member.');
    setIsSubmitting(true); setCheckinStatusMessage('Saving attendance...');
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
      setCheckinStatusMessage(`✅ Successfully logged attendance!`); setSelectedMembers([]); setSearchTerm('');
    } catch (error: any) { setCheckinStatusMessage('❌ Error: ' + error.message); } finally { setIsSubmitting(false); }
  };

  // --- COMMAND CENTER LIST SPLITTING ---
  const guestTasks = crmTasks.filter(t => t.member.status === '1st Timer' || t.member.status === '2nd Timer');
  const urgentMissingTasks = crmTasks.filter(t => t.type.includes('RED') || t.type.includes('ORANGE'));

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full border border-gray-200">
          <div className="flex justify-center mb-6"><div className="bg-orange-500 p-3 rounded-full text-white"><Lock size={32} /></div></div>
          <h1 className="text-2xl font-bold text-center text-gray-900 mb-2">Grace Citadel ChMS</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Email</label><input type="email" required value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} className="w-full border border-gray-300 rounded-md p-3 focus:ring-2 focus:ring-orange-500 outline-none" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Password</label><input type="password" required value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} className="w-full border border-gray-300 rounded-md p-3 focus:ring-2 focus:ring-orange-500 outline-none" /></div>
            {authError && <p className="text-red-600 text-sm font-medium">{authError}</p>}
            <button type="submit" className="w-full bg-gray-900 text-white p-3 rounded-md font-medium transition-colors">Secure Sign In</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white shadow-sm border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4"><div className="bg-orange-500 p-2 rounded-lg text-white cursor-pointer" onClick={() => setActiveView('dashboard')}><Users size={24} /></div><div><h1 className="text-xl font-bold text-gray-900">Grace Citadel ChMS</h1></div></div>
        <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 text-sm border border-red-200 text-red-600 rounded-md hover:bg-red-50 font-medium"><LogOut size={16} /> Sign Out</button>
      </header>

      <main className="flex-1 p-6">
        
        {/* DASHBOARD VIEW */}
        {activeView === 'dashboard' && (
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border hover:shadow-md transition-shadow"><h2 className="text-lg font-semibold mb-2 text-gray-900 flex items-center gap-2"><CheckSquare size={18} className="text-orange-500"/> Check-In</h2><button onClick={() => setActiveView('attendance')} className="text-blue-600 font-medium text-sm hover:underline">Log Attendance &rarr;</button></div>
              <div className="bg-white p-6 rounded-xl shadow-sm border hover:shadow-md transition-shadow"><h2 className="text-lg font-semibold mb-2 text-gray-900 flex items-center gap-2"><UserPlus size={18} className="text-orange-500"/> Registration</h2><button onClick={() => setActiveView('members')} className="text-blue-600 font-medium text-sm hover:underline">Open Form &rarr;</button></div>
              
              {isAdmin && (
                <>
                  <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-6 rounded-xl shadow-md border border-gray-700 hover:shadow-lg transition-shadow relative overflow-hidden"><h2 className="text-lg font-semibold mb-2 text-white flex items-center gap-2"><ShieldCheck size={18} className="text-orange-500"/> Pastoral Command Center</h2><p className="text-gray-400 text-sm mb-4">Your daily hub for birthdays, guests, and follow-ups.</p><button onClick={() => setActiveView('tasks')} className="text-orange-400 font-bold text-sm hover:underline">Open Command Center &rarr;</button></div>
                  <div className="bg-gradient-to-br from-green-900 to-emerald-800 p-6 rounded-xl shadow-md border border-emerald-700 hover:shadow-lg transition-shadow"><h2 className="text-lg font-semibold mb-2 text-white flex items-center gap-2"><Share2 size={18} className="text-green-400"/> Bulk Outreach Node</h2><p className="text-emerald-200 text-sm mb-4">Send instant broadcast messages to all Students, Men, or Women.</p><button onClick={() => setActiveView('bulk')} className="text-emerald-300 font-bold text-sm hover:underline">Open Bulk Engine 🚀 &rarr;</button></div>
                  <div className="bg-white p-6 rounded-xl shadow-sm border hover:shadow-md transition-shadow"><h2 className="text-lg font-semibold mb-2 text-indigo-700 flex items-center gap-2"><TrendingUp size={18} className="text-indigo-600"/> Service Analytics</h2><button onClick={() => setActiveView('analytics')} className="text-indigo-700 font-bold text-sm hover:underline">Open Dashboard &rarr;</button></div>
                  <div className="bg-white p-6 rounded-xl shadow-sm border hover:shadow-md transition-shadow"><h2 className="text-lg font-semibold mb-2 text-red-700 flex items-center gap-2"><UserMinus size={18} className="text-red-600"/> Smart Absentee Radar</h2><button onClick={() => setActiveView('absentees')} className="text-red-600 font-medium text-sm hover:underline">View Radar Triage &rarr;</button></div>
                  <div className="bg-white p-6 rounded-xl shadow-sm border hover:shadow-md transition-shadow"><h2 className="text-lg font-semibold mb-2 text-blue-800 flex items-center gap-2"><Gift size={18} className="text-blue-600"/> Birthday Dashboard</h2><button onClick={() => setActiveView('birthdays')} className="text-blue-700 font-bold text-sm hover:underline">Manage Birthdays &rarr;</button></div>
                </>
              )}
            </div>
          </div>
        )}

        {/* --- 🔥 PASTORAL COMMAND CENTER VIEW 🔥 --- */}
        {activeView === 'tasks' && isAdmin && (
            <div className="max-w-6xl mx-auto space-y-6">
                <button onClick={() => setActiveView('dashboard')} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800"><ArrowLeft size={16} /> Back to Dashboard</button>
                <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-6 rounded-xl shadow-md text-white flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold flex items-center gap-2"><ShieldCheck className="text-orange-500"/> Pastoral Command Center</h2>
                        <p className="text-gray-400 text-sm">Aggregated real-time oversight node.</p>
                    </div>
                    
                    {/* NEW MONDAY REPORT BUTTON */}
                    <div className="flex gap-4">
                        <button onClick={handleGenerateMondayReport} disabled={isSubmitting} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 border border-indigo-500 px-4 py-2 rounded-lg font-bold text-sm transition-colors shadow-sm">
                            <FileText size={18} /> Generate Monday Report
                        </button>
                        <div className="bg-gray-800 border border-gray-700 px-6 py-2 rounded-lg text-center shadow-inner">
                            <div className="text-xl font-black text-orange-500">{crmTasks.length}</div>
                            <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Tasks</div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-6">
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 shadow-sm">
                            <h3 className="text-lg font-bold text-blue-900 mb-3 flex items-center gap-2"><Gift size={18}/> Today's Birthdays</h3>
                            {birthdaysToday.length === 0 ? <p className="text-blue-600 text-sm">No birthdays today.</p> : birthdaysToday.map((p, i) => (<div key={i} className="bg-white p-3 rounded border flex justify-between items-center mb-2"><span className="font-bold text-gray-900">{p.full_name}</span><div className="flex gap-1"><button onClick={() => handleSendMessage(p.phone_number, p.full_name, 'whatsapp', 'birthday')} className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded">WA</button><button onClick={() => handleSendMessage(p.phone_number, p.full_name, 'sms', 'birthday')} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">SMS</button></div></div>))}
                        </div>
                        <div className="bg-green-50 border border-green-200 rounded-xl p-4 shadow-sm">
                            <h3 className="text-lg font-bold text-green-900 mb-3 flex items-center gap-2"><Sparkles size={18}/> New Guests Follow-Up</h3>
                            {guestTasks.length === 0 ? <p className="text-green-600 text-sm">All clear.</p> : guestTasks.map((t, i) => (<div key={i} className="bg-white p-3 rounded border flex justify-between items-center mb-2"><div><span className="font-bold">{t.member.full_name}</span><p className="text-xs text-gray-500">{t.type}</p></div><div className="flex gap-1"><button onClick={() => handleSendMessage(t.member.phone_number, t.member.full_name, 'whatsapp', t.msgTemplate)} className="text-xs bg-green-50 p-2 rounded-full"><MessageCircle size={14}/></button></div></div>))}
                        </div>
                    </div>
                    <div className="space-y-6">
                        <div className="bg-red-50 border border-red-200 rounded-xl p-4 shadow-sm">
                            <h3 className="text-lg font-bold text-red-900 mb-3 flex items-center gap-2"><UserMinus size={18}/> Urgent: Missing Members</h3>
                            {urgentMissingTasks.length === 0 ? <p className="text-red-600 text-sm">All clear.</p> : urgentMissingTasks.map((t, i) => (<div key={i} className="bg-white p-3 rounded border flex justify-between items-center mb-2"><div><span className="font-bold">{t.member.full_name}</span><p className="text-xs text-red-500">{t.description}</p></div><div className="flex gap-1"><button onClick={() => handleSendMessage(t.member.phone_number, t.member.full_name, 'whatsapp', t.msgTemplate)} className="text-xs bg-green-50 p-2 rounded-full"><MessageCircle size={14}/></button></div></div>))}
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* --- OTHER EXISTING VIEWS (BULK, MEMBERS, ATTENDANCE, ABSENTEES, ANALYTICS) MINIMIZED FOR STABILITY --- */}
        {activeView === 'bulk' && isAdmin && (<div className="max-w-4xl mx-auto bg-white p-6 rounded-xl shadow-sm border border-gray-200"><button onClick={() => setActiveView('dashboard')} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-6"><ArrowLeft size={16} /> Back to Dashboard</button><div className="flex items-center gap-2 mb-4"><Share2 className="text-green-600" size={28} /><h2 className="text-2xl font-bold text-gray-900">Bulk Broadcast Engine</h2></div><p className="text-gray-600 text-sm mb-6">Select a targeted group, verify your script, and broadcast.</p><div className="space-y-5 max-w-2xl"><div><label className="block text-sm font-bold text-gray-700 mb-2">Target Segment</label><div className="flex gap-4">{['Student', 'Men', 'Women'].map(group => (<label key={group} className="flex items-center gap-2 bg-gray-50 border px-4 py-3 rounded-md cursor-pointer flex-1 hover:bg-gray-100"><input type="radio" checked={bulkGroup === group} onChange={() => {setBulkGroup(group); setBulkText(group === 'Student' ? TEMPLATES.bulk_student : TEMPLATES.bulk_men);}} className="w-4 h-4 text-green-600" /><span className="font-semibold text-gray-800">{group} Only</span></label>))}</div></div><div><label className="block text-sm font-bold text-gray-700 mb-1">Announcement Script</label><textarea rows={5} value={bulkText} onChange={(e) => setBulkText(e.target.value)} className="w-full border border-gray-300 rounded-md p-3 font-medium outline-none focus:ring-2 focus:ring-green-500" /></div><div className="flex gap-4 pt-2"><button onClick={() => handleSendBulkMessage('whatsapp')} className="flex-1 bg-green-600 text-white font-bold py-4 rounded-xl shadow hover:bg-green-700 flex justify-center gap-2"><MessageCircle size={22}/> WhatsApp Group</button><button onClick={() => handleSendBulkMessage('sms')} className="flex-1 bg-blue-600 text-white font-bold py-4 rounded-xl shadow hover:bg-blue-700 flex justify-center gap-2"><MessageSquare size={22}/> Bulk SMS</button></div></div></div>)}
        {activeView === 'members' && (<div className="max-w-4xl mx-auto bg-white p-6 rounded-xl shadow-sm border"><button onClick={() => setActiveView('dashboard')} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-6"><ArrowLeft size={16} /> Back to Dashboard</button><h2 className="text-2xl font-bold mb-4">Registration Form</h2><form onSubmit={handleSaveMember} className="flex flex-col gap-4 max-w-md"><div className="bg-orange-50 p-4 rounded-lg border border-orange-100 mb-2"><label className="block text-sm font-bold text-orange-900 mb-1">Status Profile</label><select value={memberStatus} onChange={(e) => setMemberStatus(e.target.value)} className="w-full border border-orange-300 rounded-md p-2 bg-white"><option value="1st Timer">1st Timer</option><option value="2nd Timer">2nd Timer</option><option value="Student">Student Demographic</option><option value="Regular">Regular Member</option></select></div><div><label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label><input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full border border-gray-300 rounded-md p-2" /></div><div className="grid grid-cols-2 gap-4"><div><label className="block text-sm font-medium text-gray-700 mb-1">Gender</label><select value={gender} onChange={(e) => setGender(e.target.value)} className="w-full border border-gray-300 rounded-md p-2 bg-white"><option value="">Select...</option><option value="Male">Male</option><option value="Female">Female</option></select></div><div><label className="block text-sm font-medium text-gray-700 mb-1">Guarded Birthday</label><div className="flex gap-2"><select value={dobMonth} onChange={(e) => setDobMonth(e.target.value)} className="w-1/2 border border-gray-300 rounded-md p-2 bg-white"><option value="">Month</option>{['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(m => <option key={m} value={m}>{m}</option>)}</select><select value={dobDay} onChange={(e) => setDobDay(e.target.value)} className="w-1/2 border border-gray-300 rounded-md p-2 bg-white"><option value="">Day</option>{[...Array(31)].map((_, i) => <option key={i+1} value={i+1}>{i+1}</option>)}</select></div></div></div><div><label className="block text-sm font-medium text-gray-700 mb-1">Phone</label><input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full border border-gray-300 rounded-md p-2" /></div><button type="submit" className="bg-gray-900 text-white px-4 py-3 rounded-md font-medium">Save Registration</button>{statusMessage && <div className="p-3 bg-green-100 text-green-800 rounded-md text-sm">{statusMessage}</div>}</form></div>)}
        {activeView === 'attendance' && (<div className="max-w-4xl mx-auto bg-white p-6 rounded-xl shadow-sm border"><button onClick={() => setActiveView('dashboard')} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-6"><ArrowLeft size={16} /> Back to Dashboard</button><div className="flex items-center gap-2 mb-4"><CheckSquare className="text-orange-500" size={24} /><h2 className="text-2xl font-bold">Service Check-In</h2></div><div className="flex flex-col md:flex-row gap-4 mb-6"><div className="flex-1"><label className="block text-sm font-medium text-gray-700 mb-1">Service Date</label><input type="date" value={checkinDate} onChange={(e) => setCheckinDate(e.target.value)} className="w-full border border-gray-300 rounded-md p-2" /></div><div className="flex-[2]"><label className="block text-sm font-medium text-gray-700 mb-1">Quick Search</label><div className="relative"><input type="text" placeholder="Search by name..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full border border-gray-300 rounded-md py-2 px-3" /></div></div></div><div className="border border-gray-200 rounded-lg overflow-hidden mb-4"><div className="max-h-[60vh] overflow-y-auto p-2 bg-white">{memberList.filter(m => m.full_name.toLowerCase().includes(searchTerm.toLowerCase())).map((m, idx) => (<label key={idx} className="flex items-center gap-4 p-4 hover:bg-orange-50 rounded-md cursor-pointer border-b"><input type="checkbox" checked={selectedMembers.includes(m.full_name)} onChange={() => toggleMemberSelection(m.full_name)} className="w-6 h-6 text-orange-500" /><span className="text-gray-800 font-medium select-none text-lg">{m.full_name}</span></label>))}</div></div><button onClick={handleSaveCheckins} className="w-full md:w-auto bg-orange-500 text-white px-8 py-4 rounded-md font-bold text-lg shadow-md">Save Attendance</button>{checkinStatusMessage && <div className="p-4 bg-green-100 text-green-800 rounded-md mt-4">{checkinStatusMessage}</div>}</div>)}
        {activeView === 'absentees' && isAdmin && (<div className="max-w-6xl mx-auto space-y-6"><button onClick={() => setActiveView('dashboard')} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800"><ArrowLeft size={16} /> Back to Dashboard</button><div className="overflow-x-auto border border-gray-200 rounded-xl bg-white p-4"><h3 className="font-bold text-xl mb-4">Smart Absentee Radar Triage</h3>{absenteeList.map((person, idx) => (<div key={idx} className="p-3 border-b flex justify-between items-center"><div><p className="font-bold">{person.full_name} ({person.alertLevel})</p><p className="text-xs text-gray-500">Missed: {person.missedCount} services</p></div><button onClick={() => handleSendMessage(person.phone_number, person.full_name, 'whatsapp', 'checking_in')} className="text-xs bg-green-50 border px-3 py-1 text-green-700 rounded">Message</button></div>))}</div></div>)}
        {activeView === 'analytics' && isAdmin && (<div className="max-w-6xl mx-auto space-y-6"><button onClick={() => setActiveView('dashboard')} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800"><ArrowLeft size={16} /> Back to Dashboard</button><div className="bg-white p-6 rounded-xl border"><h3 className="font-bold text-lg mb-4">Monthly Trends Chart</h3><div className="flex items-end h-48 border-b-2 gap-4 pb-2">{monthlyChartData.map((d, i) => (<div key={i} className="flex-1 flex flex-col items-center"><div style={{ height: `${(d.total / maxMonthlyTotal) * 100}%` }} className="w-full bg-indigo-500 rounded-t"></div><span className="text-xs text-gray-600 mt-1">{d.monthName.split(' ')[0]}</span></div>))}</div></div></div>)}
      </main>
    </div>
  );
}

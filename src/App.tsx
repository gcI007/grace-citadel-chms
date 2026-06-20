import React, { useState, useEffect } from 'react';
import { Users, ArrowLeft, Sparkles, Lock, LogOut, Cake, CheckSquare, Search, UserPlus, ClipboardList, UserMinus, BarChart3, ShieldCheck, MessageCircle, MessageSquare, Heart, Gift, TrendingUp, CalendarDays, Share2, FileText, Home, Activity } from 'lucide-react';
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
  const [analyticsTab, setAnalyticsTab] = useState('service'); 

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
  
  // 🔥 NEW: WHATSAPP QUEUE STATES 🔥
  const [bulkQueue, setBulkQueue] = useState<{ name: string; phone: string }[]>([]);
  const [bulkQueueIndex, setBulkQueueIndex] = useState(0);

  // --- VISUAL ANALYTICS STATES ---
  const [monthlyChartData, setMonthlyChartData] = useState<any[]>([]);
  const [selectedMonthData, setSelectedMonthData] = useState<any | null>(null);
  const [memberStats, setMemberStats] = useState<any[]>([]);
  const [cellStats, setCellStats] = useState({ overallAvg: 0, bestCell: '-', fastestGrowing: '-', trendData: [] as any[], cellsArray: [] as any[] });

  // --- FORM STATES (Registration) ---
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

  // --- FORM STATES (Cell Meeting) ---
  const [cellName, setCellName] = useState('');
  const [cellLeader, setCellLeader] = useState('');
  const [cellDate, setCellDate] = useState(new Date().toISOString().split('T')[0]);
  const [cellAttendance, setCellAttendance] = useState('');
  const [cellNotes, setCellNotes] = useState('');
  const [cellStatusMessage, setCellStatusMessage] = useState('');

  // --- AI OUTREACH & CHECK-IN STATES ---
  const [promptContext, setPromptContext] = useState('');
  const [generatedMessage, setGeneratedMessage] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [memberList, setMemberList] = useState<any[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [checkinDate, setCheckinDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [checkinStatusMessage, setCheckinStatusMessage] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session));
    return () => subscription.unsubscribe();
  }, []);

  const userEmail = session?.user?.email?.toLowerCase() || '';
  const isUsher = userEmail.includes('usher');
  const isAdmin = !isUsher;

  useEffect(() => {
    if (session && isAdmin) {
        if (activeView === 'dashboard') { fetchBirthdays(); fetchCrmTasks(); }
        if (activeView === 'birthdays') fetchBirthdays();
        if (activeView === 'guests') fetchGuests();
        if (activeView === 'absentees') fetchAbsentees();
        if (activeView === 'analytics') { fetchAnalytics(); setSelectedMonthData(null); setAnalyticsTab('service'); }
        if (activeView === 'tasks') { fetchBirthdays(); fetchCrmTasks(); fetchAbsentees(); }
    }
    if (session && activeView === 'attendance') {
      fetchMembersForCheckin();
      setSelectedMembers([]); setCheckinStatusMessage(''); setSearchTerm('');
    }
  }, [session, activeView, isAdmin]);

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

  const fetchMembersForCheckin = async () => { const { data } = await supabase.from('members').select('id, full_name, phone_number').order('full_name'); if (data) setMemberList(data); };
  const fetchGuests = async () => { const { data } = await supabase.from('members').select('*').in('status', ['1st Timer', '2nd Timer']).order('created_at', { ascending: false }); if (data) setGuestList(data); };
  
  const fetchAnalytics = async () => { 
    const { data: checkins } = await supabase.from('member_checkins').select('*'); 
    if (checkins) { 
      const monthMap: any = {};
      checkins.forEach(checkin => {
        const dateObj = new Date(checkin.service_date); const monthKey = dateObj.toLocaleString('default', { month: 'long', year: 'numeric' });
        if (!monthMap[monthKey]) monthMap[monthKey] = { monthName: monthKey, total: 0, sortDate: dateObj.getTime(), services: {} };
        monthMap[monthKey].total += 1;
        if (!monthMap[monthKey].services[checkin.service_date]) monthMap[monthKey].services[checkin.service_date] = 0;
        monthMap[monthKey].services[checkin.service_date] += 1;
      });
      setMonthlyChartData(Object.values(monthMap).sort((a: any, b: any) => a.sortDate - b.sortDate));
      const memberCounts = checkins.reduce((acc: any, curr: any) => { acc[curr.member_name] = (acc[curr.member_name] || 0) + 1; return acc; }, {}); 
      setMemberStats(Object.keys(memberCounts).map(name => ({ name, count: memberCounts[name] })).sort((a, b) => b.count - a.count)); 
    } 
    const { data: cellData } = await supabase.from('cell_meetings').select('*');
    if (cellData && cellData.length > 0) {
        let totalAtt = 0; const cellGroups: any = {}; const monthlyTrend: any = {};
        cellData.forEach(c => {
            totalAtt += c.attendance_count;
            if (!cellGroups[c.cell_name]) cellGroups[c.cell_name] = { name: c.cell_name, total: 0, count: 0, history: [] };
            cellGroups[c.cell_name].total += c.attendance_count; cellGroups[c.cell_name].count += 1; cellGroups[c.cell_name].history.push({ date: c.meeting_date, count: c.attendance_count });
            const d = new Date(c.meeting_date); const mKey = d.toLocaleString('default', { month: 'short', year: 'numeric' });
            if (!monthlyTrend[mKey]) monthlyTrend[mKey] = { monthName: mKey, sortDate: d.getTime(), total: 0 };
            monthlyTrend[mKey].total += c.attendance_count;
        });
        const overallAvg = Math.round(totalAtt / cellData.length);
        const cellsArray = Object.values(cellGroups).map((cg: any) => {
            cg.history.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
            const avg = Math.round(cg.total / cg.count);
            const growth = cg.history.length > 1 ? (cg.history[cg.history.length - 1].count - cg.history[0].count) : 0;
            return { ...cg, avg, growth };
        });
        setCellStats({ overallAvg, bestCell: [...cellsArray].sort((a, b) => b.avg - a.avg)[0]?.name || 'N/A', fastestGrowing: [...cellsArray].sort((a, b) => b.growth - a.growth)[0]?.name || 'N/A', trendData: Object.values(monthlyTrend).sort((a: any, b: any) => a.sortDate - b.sortDate), cellsArray: cellsArray.sort((a, b) => b.avg - a.avg) });
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

  const handleGenerateMondayReport = async () => {
    setIsSubmitting(true);
    const { data: checkins } = await supabase.from('member_checkins').select('*');
    const { data: members } = await supabase.from('members').select('*');
    setIsSubmitting(false);
    if (!checkins || !members) return alert('No data available to generate report.');
    const sortedDates = [...new Set(checkins.map(c => c.service_date))].sort();
    const lastDate = sortedDates[sortedDates.length - 1];
    if (!lastDate) return alert('No services have been logged yet to summarize.');
    const lastServiceAttendance = checkins.filter(c => c.service_date === lastDate).length;
    const activeFirstTimers = members.filter(m => m.status === '1st Timer').length;
    const activeSecondTimers = members.filter(m => m.status === '2nd Timer').length;
    const redAlerts = absenteeList.filter(a => a.missedCount >= 8).length;
    const birthdays = birthdaysWeek.length;
    const reportText = `📊 *GRACE CITADEL WEEKLY SUMMARY* 📊\n*Service Date:* ${new Date(lastDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}\n\n👥 *Total Attendance:* ${lastServiceAttendance} members\n🌟 *Active 1st Timers:* ${activeFirstTimers}\n⭐ *Active 2nd Timers:* ${activeSecondTimers}\n\n🚨 *Urgent Absentees (Red Alert):* ${redAlerts} members\n🎂 *Birthdays This Week:* ${birthdays} members\n\n_Auto-generated by Grace Citadel ChMS_`;
    window.open(`https://wa.me/?text=${encodeURIComponent(reportText)}`, '_blank');
  };

  const handleSendMessage = (phone: string | null, name: string, type: 'whatsapp' | 'sms', overrideTemplate?: string) => {
    if (!phone) return alert(`No phone number recorded for ${name}.`);
    const cleanPhone = phone.replace(/\D/g, ''); 
    const message = TEMPLATES[Math.max(0, Object.keys(TEMPLATES).indexOf(overrideTemplate || template)) ? (overrideTemplate || template) as keyof typeof TEMPLATES : 'welcome'].replace('{name}', name);
    if (type === 'whatsapp') window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');
    else window.open(`sms:${cleanPhone}?body=${encodeURIComponent(message)}`, '_blank');
  };

  // 🔥 NEW: WHATSAPP QUEUE LOGIC 🔥
  const prepareBulkQueue = async () => {
    setIsSubmitting(true);
    const { data: targets } = await supabase.from('members').select('full_name, phone_number, gender, status, occupation');
    setIsSubmitting(false);
    if (!targets || targets.length === 0) return alert('No members found.');

    let filtered = targets;
    if (bulkGroup === 'Student') filtered = targets.filter(m => m.status === 'Student' || m.occupation?.toLowerCase().includes('student'));
    if (bulkGroup === 'Men') filtered = targets.filter(m => m.gender === 'Male');
    if (bulkGroup === 'Women') filtered = targets.filter(m => m.gender === 'Female');

    const queue = filtered
      .filter(m => m.phone_number)
      .map(m => ({ name: m.full_name, phone: m.phone_number as string }));

    if (queue.length === 0) return alert('No valid phone numbers found for this group.');
    
    // Set the queue active
    setBulkQueue(queue);
    setBulkQueueIndex(0);
  };

  const sendNextInQueue = () => {
    const recipient = bulkQueue[bulkQueueIndex];
    if (!recipient) return;
    
    // Replace {name} placeholder if it exists in the bulk script
    const personalizedText = bulkText.replace('{name}', recipient.name);
    const cleanPhone = recipient.phone.replace(/\D/g, '');
    
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(personalizedText)}`, '_blank');
    setBulkQueueIndex(prev => prev + 1);
  };

  const handleSendBulkSMS = async () => {
    setIsSubmitting(true);
    const { data: targets } = await supabase.from('members').select('phone_number, gender, status, occupation');
    if (!targets || targets.length === 0) { setIsSubmitting(false); return alert('No members found.'); }
    let filtered = targets;
    if (bulkGroup === 'Student') filtered = targets.filter(m => m.status === 'Student' || m.occupation?.toLowerCase().includes('student'));
    if (bulkGroup === 'Men') filtered = targets.filter(m => m.gender === 'Male');
    if (bulkGroup === 'Women') filtered = targets.filter(m => m.gender === 'Female');
    const phones = filtered.map(m => m.phone_number).filter(p => p !== null) as string[];
    if (phones.length === 0) { setIsSubmitting(false); return alert('No valid phone numbers found for this group.'); }
    const cleanPhones = phones.map(p => p.replace(/\D/g, ''));
    window.open(`sms:${cleanPhones.join(navigator.userAgent.includes('Mac') ? ',' : ';')}?body=${encodeURIComponent(bulkText)}`, '_blank');
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

  const handleSaveCellMeeting = async (e: React.FormEvent) => {
    e.preventDefault(); setIsSubmitting(true); setCellStatusMessage('Submitting report...');
    try {
      const { error } = await supabase.from('cell_meetings').insert([{ cell_name: cellName, leader_name: cellLeader, meeting_date: cellDate, attendance_count: parseInt(cellAttendance) || 0, notes: cellNotes }]);
      if (error) throw error;
      setCellStatusMessage('✅ Cell Report saved successfully!');
      setCellName(''); setCellLeader(''); setCellAttendance(''); setCellNotes('');
    } catch (error: any) { setCellStatusMessage('❌ Error: ' + error.message); } finally { setIsSubmitting(false); }
  };

  const toggleMemberSelection = (id: string) => setSelectedMembers(prev => prev.includes(id) ? prev.filter(n => n !== id) : [...prev, id]);
  
  const handleSaveCheckins = async () => {
    if (selectedMembers.length === 0) return setCheckinStatusMessage('❌ Please select at least one member.');
    setIsSubmitting(true); 
    setCheckinStatusMessage('Verifying against duplicates and saving...');
    try {
      const selectedObjects = memberList.filter(m => selectedMembers.includes(m.id));
      const namesToInsert = selectedObjects.map(m => m.full_name);
      const { data: existingCheckins } = await supabase.from('member_checkins').select('member_name').eq('service_date', checkinDate).in('member_name', namesToInsert);
      const alreadyCheckedIn = new Set(existingCheckins?.map(c => c.member_name) || []);
      const validObjects = selectedObjects.filter(m => !alreadyCheckedIn.has(m.full_name));
      if (validObjects.length === 0) { setCheckinStatusMessage('⚠️ Alert: Everyone selected has already been checked in for this date.'); setIsSubmitting(false); return; }
      const recordsToInsert = validObjects.map(m => ({ service_date: checkinDate, member_name: m.full_name }));
      const { error: insertError } = await supabase.from('member_checkins').insert(recordsToInsert);
      if (insertError) throw insertError;
      const validNames = validObjects.map(m => m.full_name);
      const { data: currentMembers } = await supabase.from('members').select('full_name, status').in('full_name', validNames);
      if (currentMembers) {
        const firstTimersToUpdate = currentMembers.filter(m => m.status === '1st Timer').map(m => m.full_name);
        const secondTimersToUpdate = currentMembers.filter(m => m.status === '2nd Timer').map(m => m.full_name);
        if (firstTimersToUpdate.length > 0) await supabase.from('members').update({ status: '2nd Timer' }).in('full_name', firstTimersToUpdate);
        if (secondTimersToUpdate.length > 0) await supabase.from('members').update({ status: 'Regular' }).in('full_name', secondTimersToUpdate);
      }
      setCheckinStatusMessage(`✅ Logged ${validObjects.length} members! ${alreadyCheckedIn.size > 0 ? `(${alreadyCheckedIn.size} duplicates skipped)` : ''}`);
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
              <div className="bg-white p-6 rounded-xl shadow-sm border hover:shadow-md transition-shadow"><h2 className="text-lg font-semibold mb-2 text-gray-900 flex items-center gap-2"><CheckSquare size={18} className="text-orange-500"/> Service Check-In</h2><button onClick={() => setActiveView('attendance')} className="text-blue-600 font-medium text-sm hover:underline">Log Attendance &rarr;</button></div>
              <div className="bg-white p-6 rounded-xl shadow-sm border hover:shadow-md transition-shadow"><h2 className="text-lg font-semibold mb-2 text-gray-900 flex items-center gap-2"><UserPlus size={18} className="text-orange-500"/> Registration</h2><button onClick={() => {setActiveView('members'); setStatusMessage('');}} className="text-blue-600 font-medium text-sm hover:underline">Open Form &rarr;</button></div>
              <div className="bg-white p-6 rounded-xl shadow-sm border hover:shadow-md transition-shadow"><h2 className="text-lg font-semibold mb-2 text-gray-900 flex items-center gap-2"><Home size={18} className="text-orange-500"/> Cell Meeting Log</h2><p className="text-gray-500 text-sm mb-4">Record weekly home fellowship attendance.</p><button onClick={() => {setActiveView('cell_log'); setCellStatusMessage('');}} className="text-blue-600 font-medium text-sm hover:underline">Submit Report &rarr;</button></div>

              {isAdmin && (
                <>
                  <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-6 rounded-xl shadow-md border border-gray-700 hover:shadow-lg transition-shadow relative overflow-hidden"><h2 className="text-lg font-semibold mb-2 text-white flex items-center gap-2"><ShieldCheck size={18} className="text-orange-500"/> Pastoral Command Center</h2><p className="text-gray-400 text-sm mb-4">Your daily hub for birthdays, guests, and follow-ups.</p><button onClick={() => setActiveView('tasks')} className="text-orange-400 font-bold text-sm hover:underline">Open Command Center &rarr;</button></div>
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-indigo-200 hover:shadow-md transition-shadow"><h2 className="text-lg font-semibold mb-2 text-indigo-800 flex items-center gap-2"><TrendingUp size={18} className="text-indigo-600"/> Service & Cell Analytics</h2><p className="text-gray-500 text-sm mb-4">Visual charts of Sunday and Cell Group growth.</p><button onClick={() => setActiveView('analytics')} className="text-indigo-700 font-bold text-sm hover:underline">Open Dashboard 📊 &rarr;</button></div>
                  <div className="bg-gradient-to-br from-green-900 to-emerald-800 p-6 rounded-xl shadow-md border border-emerald-700 hover:shadow-lg transition-shadow"><h2 className="text-lg font-semibold mb-2 text-white flex items-center gap-2"><Share2 size={18} className="text-green-400"/> Bulk Outreach Node</h2><p className="text-emerald-200 text-sm mb-4">Broadcast messages to Students, Men, or Women.</p><button onClick={() => setActiveView('bulk')} className="text-emerald-300 font-bold text-sm hover:underline">Open Bulk Engine 🚀 &rarr;</button></div>
                  <div className="bg-white p-6 rounded-xl shadow-sm border hover:shadow-md transition-shadow"><h2 className="text-lg font-semibold mb-2 text-red-700 flex items-center gap-2"><UserMinus size={18} className="text-red-600"/> Smart Absentee Radar</h2><p className="text-gray-500 text-sm mb-4">Alerts for missed services.</p><button onClick={() => setActiveView('absentees')} className="text-red-600 font-medium text-sm hover:underline">View Radar Triage &rarr;</button></div>
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-blue-200 hover:shadow-md transition-shadow relative overflow-hidden">{birthdaysToday.length > 0 && <div className="absolute top-0 right-0 bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">Today!</div>}<h2 className="text-lg font-semibold mb-2 text-blue-800 flex items-center gap-2"><Gift size={18} className="text-blue-600"/> Birthday Dashboard</h2><p className="text-blue-600 text-sm mb-4">{birthdaysToday.length} today • {birthdaysWeek.length} this week</p><button onClick={() => setActiveView('birthdays')} className="text-blue-700 font-bold text-sm hover:underline">Manage Birthdays &rarr;</button></div>
                </>
              )}
            </div>
          </div>
        )}

        {/* --- 🔥 NEW: BULK OUTREACH WITH WHATSAPP QUEUE UI 🔥 --- */}
        {activeView === 'bulk' && isAdmin && (
            <div className="max-w-4xl mx-auto bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <button onClick={() => { setActiveView('dashboard'); setBulkQueue([]); }} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-6"><ArrowLeft size={16} /> Back to Dashboard</button>
                <div className="flex items-center gap-2 mb-4"><Share2 className="text-green-600" size={28} /><h2 className="text-2xl font-bold text-gray-900">Bulk Broadcast Engine</h2></div>
                <p className="text-gray-600 text-sm mb-6">Select a targeted group, verify your script, and launch the broadcast queue.</p>
                
                {bulkQueue.length > 0 ? (
                    /* ACTIVE QUEUE UI */
                    <div className="bg-green-50 p-6 rounded-xl border border-green-200">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="font-bold text-green-900 text-xl flex items-center gap-2"><MessageCircle /> WhatsApp Queue Active</h3>
                                <p className="text-sm text-green-700 mt-1">Sending to {bulkGroup} Group</p>
                            </div>
                            <div className="bg-green-200 text-green-800 font-bold px-4 py-2 rounded-lg">
                                {bulkQueueIndex} / {bulkQueue.length} Sent
                            </div>
                        </div>

                        {bulkQueueIndex < bulkQueue.length ? (
                            <div className="bg-white p-6 rounded-lg border border-green-100 shadow-sm text-center">
                                <p className="text-gray-500 mb-1">Up Next:</p>
                                <p className="text-2xl font-bold text-gray-900 mb-6">{bulkQueue[bulkQueueIndex].name}</p>
                                <div className="flex flex-col sm:flex-row justify-center gap-4">
                                    <button onClick={sendNextInQueue} className="bg-green-600 text-white px-8 py-4 rounded-xl font-bold hover:bg-green-700 shadow-md transition-colors flex items-center justify-center gap-2">
                                        Send & Load Next &rarr;
                                    </button>
                                    <button onClick={() => setBulkQueue([])} className="bg-red-50 text-red-600 border border-red-200 px-8 py-4 rounded-xl font-bold hover:bg-red-100 transition-colors">
                                        Cancel Queue
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-white p-8 rounded-lg border border-green-100 shadow-sm text-center">
                                <div className="text-4xl mb-4">🎉</div>
                                <h3 className="text-2xl font-bold text-green-900 mb-2">Broadcast Complete!</h3>
                                <p className="text-gray-600 mb-6">All {bulkQueue.length} messages have been sent.</p>
                                <button onClick={() => setBulkQueue([])} className="bg-green-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-green-700">
                                    Start New Broadcast
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    /* SETUP UI */
                    <div className="space-y-5 max-w-2xl">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Target Segment</label>
                            <div className="flex gap-4">
                                {['Student', 'Men', 'Women'].map(group => (
                                    <label key={group} className="flex items-center gap-2 bg-gray-50 border px-4 py-3 rounded-md cursor-pointer select-none flex-1 hover:bg-gray-100 transition-colors">
                                        <input type="radio" checked={bulkGroup === group} onChange={() => {
                                            setBulkGroup(group); 
                                            setBulkText(group === 'Student' ? TEMPLATES.bulk_student : TEMPLATES.bulk_men);
                                        }} className="w-4 h-4 text-green-600" />
                                        <span className="font-semibold text-gray-800">{group}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Announcement Script</label>
                            <p className="text-xs text-gray-500 mb-2">You can use <b>{`{name}`}</b> in the script to automatically insert their name!</p>
                            <textarea rows={5} value={bulkText} onChange={(e) => setBulkText(e.target.value)} className="w-full border border-gray-300 rounded-md p-3 font-medium outline-none focus:ring-2 focus:ring-green-500" />
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 pt-2">
                            <button onClick={prepareBulkQueue} disabled={isSubmitting} className="flex-1 bg-green-600 text-white font-bold py-4 rounded-xl shadow hover:bg-green-700 flex items-center justify-center gap-2 transition-colors disabled:opacity-50">
                                {isSubmitting ? 'Loading...' : <><MessageCircle size={22}/> Start WhatsApp Queue</>}
                            </button>
                            <button onClick={handleSendBulkSMS} disabled={isSubmitting} className="flex-1 bg-blue-600 text-white font-bold py-4 rounded-xl shadow hover:bg-blue-700 flex items-center justify-center gap-2 transition-colors disabled:opacity-50">
                                <MessageSquare size={22}/> Send Bulk SMS
                            </button>
                        </div>
                    </div>
                )}
            </div>
        )}

        {/* ... [ALL PREVIOUS MINIMIZED VIEWS: MEMBERS, ATTENDANCE, CELL_LOG, TASKS, ANALYTICS, ABSENTEES, BIRTHDAYS] ... */}
        {activeView === 'members' && (<div className="max-w-4xl mx-auto bg-white p-6 rounded-xl shadow-sm border"><button onClick={() => setActiveView('dashboard')} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-6"><ArrowLeft size={16} /> Back to Dashboard</button><h2 className="text-2xl font-bold mb-4">Registration Form</h2><form onSubmit={handleSaveMember} className="flex flex-col gap-4 max-w-md"><div className="bg-orange-50 p-4 rounded-lg border border-orange-100 mb-2"><label className="block text-sm font-bold text-orange-900 mb-1">Status Profile</label><select value={memberStatus} onChange={(e) => setMemberStatus(e.target.value)} className="w-full border border-orange-300 rounded-md p-2 bg-white"><option value="1st Timer">1st Timer</option><option value="2nd Timer">2nd Timer</option><option value="Student">Student Demographic</option><option value="Regular">Regular Member</option></select></div><div><label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label><input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full border border-gray-300 rounded-md p-2" /></div><div className="grid grid-cols-2 gap-4"><div><label className="block text-sm font-medium text-gray-700 mb-1">Gender</label><select value={gender} onChange={(e) => setGender(e.target.value)} className="w-full border border-gray-300 rounded-md p-2 bg-white"><option value="">Select...</option><option value="Male">Male</option><option value="Female">Female</option></select></div><div><label className="block text-sm font-medium text-gray-700 mb-1">Guarded Birthday</label><div className="flex gap-2"><select value={dobMonth} onChange={(e) => setDobMonth(e.target.value)} className="w-1/2 border border-gray-300 rounded-md p-2 bg-white"><option value="">Month</option>{['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(m => <option key={m} value={m}>{m}</option>)}</select><select value={dobDay} onChange={(e) => setDobDay(e.target.value)} className="w-1/2 border border-gray-300 rounded-md p-2 bg-white"><option value="">Day</option>{[...Array(31)].map((_, i) => <option key={i+1} value={i+1}>{i+1}</option>)}</select></div></div></div><div><label className="block text-sm font-medium text-gray-700 mb-1">Phone</label><input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full border border-gray-300 rounded-md p-2" /></div><button type="submit" className="bg-gray-900 text-white px-4 py-3 rounded-md font-medium">Save Registration</button>{statusMessage && <div className="p-3 bg-green-100 text-green-800 rounded-md text-sm">{statusMessage}</div>}</form></div>)}
        {activeView === 'attendance' && (<div className="max-w-4xl mx-auto bg-white p-6 rounded-xl shadow-sm border"><button onClick={() => setActiveView('dashboard')} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-6"><ArrowLeft size={16} /> Back to Dashboard</button><div className="flex items-center gap-2 mb-4"><CheckSquare className="text-orange-500" size={24} /><h2 className="text-2xl font-bold">Service Check-In</h2></div><div className="flex flex-col md:flex-row gap-4 mb-6"><div className="flex-1"><label className="block text-sm font-medium text-gray-700 mb-1">Service Date</label><input type="date" value={checkinDate} onChange={(e) => setCheckinDate(e.target.value)} className="w-full border border-gray-300 rounded-md p-2" /></div><div className="flex-[2]"><label className="block text-sm font-medium text-gray-700 mb-1">Quick Search</label><div className="relative"><input type="text" placeholder="Search by name..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full border border-gray-300 rounded-md py-2 px-3" /></div></div></div><div className="border border-gray-200 rounded-lg overflow-hidden mb-4"><div className="max-h-[60vh] overflow-y-auto p-2 bg-white">{memberList.filter(m => m.full_name.toLowerCase().includes(searchTerm.toLowerCase())).map((m, idx) => (<label key={idx} className="flex items-center gap-4 p-4 hover:bg-orange-50 rounded-md cursor-pointer border-b"><input type="checkbox" checked={selectedMembers.includes(m.id)} onChange={() => toggleMemberSelection(m.id)} className="w-6 h-6 text-orange-500" /><span className="text-gray-800 font-medium select-none text-lg">{m.full_name}</span></label>))}</div></div><button onClick={handleSaveCheckins} className="w-full md:w-auto bg-orange-500 text-white px-8 py-4 rounded-md font-bold text-lg shadow-md">Save Attendance</button>{checkinStatusMessage && <div className="p-4 bg-green-100 text-green-800 rounded-md mt-4">{checkinStatusMessage}</div>}</div>)}
        {activeView === 'cell_log' && (<div className="max-w-4xl mx-auto bg-white p-6 rounded-xl shadow-sm border"><button onClick={() => setActiveView('dashboard')} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-6"><ArrowLeft size={16} /> Back to Dashboard</button><div className="flex items-center gap-2 mb-2"><Home className="text-orange-500" size={28} /><h2 className="text-2xl font-bold">Cell Meeting Report</h2></div><form onSubmit={handleSaveCellMeeting} className="flex flex-col gap-4 max-w-lg mt-6"><div><label className="block text-sm font-medium text-gray-700 mb-1">Cell Group Name</label><input type="text" required value={cellName} onChange={(e) => setCellName(e.target.value)} className="w-full border border-gray-300 rounded-md p-3 focus:border-orange-500" /></div><div className="grid grid-cols-2 gap-4"><div><label className="block text-sm font-medium text-gray-700 mb-1">Leader Name</label><input type="text" required value={cellLeader} onChange={(e) => setCellLeader(e.target.value)} className="w-full border border-gray-300 rounded-md p-3" /></div><div><label className="block text-sm font-medium text-gray-700 mb-1">Attendance</label><input type="number" required min="1" value={cellAttendance} onChange={(e) => setCellAttendance(e.target.value)} className="w-full border border-gray-300 rounded-md p-3" /></div></div><div><label className="block text-sm font-medium text-gray-700 mb-1">Meeting Date</label><input type="date" required value={cellDate} onChange={(e) => setCellDate(e.target.value)} className="w-full border border-gray-300 rounded-md p-3" /></div><div><label className="block text-sm font-medium text-gray-700 mb-1">Notes / Testimonies</label><textarea rows={4} value={cellNotes} onChange={(e) => setCellNotes(e.target.value)} className="w-full border border-gray-300 rounded-md p-3" /></div><button type="submit" disabled={isSubmitting} className="bg-gray-900 text-white p-4 rounded-md font-bold mt-2 hover:bg-gray-800">Submit Report</button>{cellStatusMessage && <div className="p-3 bg-green-100 text-green-800 rounded-md text-sm">{cellStatusMessage}</div>}</form></div>)}
        {activeView === 'tasks' && isAdmin && (<div className="max-w-6xl mx-auto space-y-6"><button onClick={() => setActiveView('dashboard')} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800"><ArrowLeft size={16} /> Back to Dashboard</button><div className="bg-gradient-to-r from-gray-900 to-gray-800 p-6 rounded-xl shadow-md text-white flex flex-col sm:flex-row items-center justify-between gap-4"><div><h2 className="text-2xl font-bold flex items-center gap-2"><ShieldCheck className="text-orange-500"/> Pastoral Command Center</h2></div><div className="flex gap-4"><button onClick={handleGenerateMondayReport} className="flex items-center gap-2 bg-indigo-600 px-4 py-2 rounded-lg font-bold text-sm"><FileText size={18} /> Monday Report</button><div className="bg-gray-800 border px-6 py-2 rounded-lg text-center"><div className="text-xl font-black text-orange-500">{crmTasks.length}</div><div className="text-[10px] text-gray-400">TASKS</div></div></div></div><div className="grid grid-cols-1 lg:grid-cols-2 gap-6"><div className="space-y-6"><div className="bg-blue-50 border border-blue-200 rounded-xl p-4 shadow-sm"><h3 className="text-lg font-bold text-blue-900 mb-3 flex items-center gap-2"><Gift size={18}/> Today's Birthdays</h3>{birthdaysToday.map((p, i) => (<div key={i} className="bg-white p-3 rounded border flex justify-between mb-2"><span className="font-bold">{p.full_name}</span><div className="flex gap-1"><button onClick={() => handleSendMessage(p.phone_number, p.full_name, 'whatsapp', 'birthday')} className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded">WA</button></div></div>))}</div><div className="bg-green-50 border border-green-200 rounded-xl p-4 shadow-sm"><h3 className="text-lg font-bold text-green-900 mb-3 flex items-center gap-2"><Sparkles size={18}/> Guests Follow-Up</h3>{guestTasks.map((t, i) => (<div key={i} className="bg-white p-3 rounded border flex justify-between mb-2"><div><span className="font-bold">{t.member.full_name}</span><p className="text-xs text-gray-500">{t.type}</p></div><button onClick={() => handleSendMessage(t.member.phone_number, t.member.full_name, 'whatsapp', t.msgTemplate)} className="text-xs bg-green-50 p-2 rounded-full"><MessageCircle size={14}/></button></div>))}</div></div><div className="space-y-6"><div className="bg-red-50 border border-red-200 rounded-xl p-4 shadow-sm"><h3 className="text-lg font-bold text-red-900 mb-3 flex items-center gap-2"><UserMinus size={18}/> Urgent: Missing</h3>{urgentMissingTasks.map((t, i) => (<div key={i} className="bg-white p-3 rounded border flex justify-between mb-2"><div><span className="font-bold">{t.member.full_name}</span><p className="text-xs text-red-500">{t.description}</p></div><button onClick={() => handleSendMessage(t.member.phone_number, t.member.full_name, 'whatsapp', t.msgTemplate)} className="text-xs bg-green-50 p-2 rounded-full"><MessageCircle size={14}/></button></div>))}</div></div></div></div>)}
        {activeView === 'absentees' && isAdmin && (<div className="max-w-6xl mx-auto space-y-6"><button onClick={() => setActiveView('dashboard')} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800"><ArrowLeft size={16} /> Back to Dashboard</button><div className="overflow-x-auto border border-gray-200 rounded-xl bg-white p-4"><h3 className="font-bold text-xl mb-4">Smart Absentee Radar Triage</h3>{absenteeList.map((person, idx) => (<div key={idx} className="p-3 border-b flex justify-between items-center"><div><p className="font-bold">{person.full_name} ({person.alertLevel})</p><p className="text-xs text-gray-500">Missed: {person.missedCount} services</p></div><button onClick={() => handleSendMessage(person.phone_number, person.full_name, 'whatsapp', 'checking_in')} className="text-xs bg-green-50 border px-3 py-1 text-green-700 rounded">Message</button></div>))}</div></div>)}
        {activeView === 'analytics' && isAdmin && (<div className="max-w-6xl mx-auto space-y-6"><button onClick={() => setActiveView('dashboard')} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800"><ArrowLeft size={16} /> Back to Dashboard</button><div className="bg-gradient-to-r from-indigo-700 to-purple-800 p-8 rounded-xl shadow-md text-white flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4"><div><h2 className="text-3xl font-bold mb-2 flex items-center gap-3"><TrendingUp size={32} /> Central Analytics Hub</h2></div><div className="flex bg-indigo-900/50 p-1 rounded-lg border border-indigo-600"><button onClick={() => setAnalyticsTab('service')} className={`px-6 py-2 rounded-md font-bold text-sm ${analyticsTab === 'service' ? 'bg-white text-indigo-900' : 'text-indigo-200'}`}>Sunday Services</button><button onClick={() => setAnalyticsTab('cells')} className={`px-6 py-2 rounded-md font-bold text-sm ${analyticsTab === 'cells' ? 'bg-white text-indigo-900' : 'text-indigo-200'}`}>Cell Groups</button></div></div>{analyticsTab === 'service' && (<><div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"><h3 className="text-xl font-bold text-gray-800 mb-6 border-b pb-4"><BarChart3 className="inline"/> Monthly Growth</h3><div className="flex items-end gap-2 md:gap-6 h-64 mt-8 pb-4 border-b-2 overflow-x-auto">{monthlyChartData.map((data, idx) => { const barHeight = Math.max((data.total / maxMonthlyTotal) * 100, 5); return (<div key={idx} onClick={() => setSelectedMonthData(data)} className="flex flex-col items-center flex-1 min-w-[60px] cursor-pointer"><span className="text-xs font-bold mb-2">{data.total}</span><div style={{ height: `${barHeight}%` }} className="w-full rounded-t-md bg-indigo-600"></div><span className="text-xs mt-3 font-medium">{data.monthName.split(' ')[0]}</span></div>); })}</div></div></>)}{analyticsTab === 'cells' && (<><div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6"><div className="bg-white p-6 rounded-xl border flex items-center gap-4"><div className="bg-blue-100 p-3 rounded-full"><Users size={24} className="text-blue-600"/></div><div><p className="text-sm font-bold">Avg Size</p><p className="text-3xl font-black">{cellStats.overallAvg}</p></div></div><div className="bg-white p-6 rounded-xl border flex items-center gap-4"><div className="bg-yellow-100 p-3 rounded-full">🏆</div><div><p className="text-sm font-bold">Best Cell</p><p className="text-xl font-black">{cellStats.bestCell}</p></div></div><div className="bg-white p-6 rounded-xl border flex items-center gap-4"><div className="bg-green-100 p-3 rounded-full"><Activity size={24} className="text-green-600"/></div><div><p className="text-sm font-bold">Fastest Growth</p><p className="text-xl font-black">{cellStats.fastestGrowing}</p></div></div></div></>)}</div>)}
        {activeView === 'birthdays' && isAdmin && (<div className="max-w-4xl mx-auto space-y-6"><button onClick={() => setActiveView('dashboard')} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800"><ArrowLeft size={16} /> Back to Dashboard</button><div className="bg-white p-4 border rounded-xl"><h3 className="font-bold text-lg mb-4">This Month's Birthdays</h3>{birthdaysMonth.map((p, idx) => <BirthdayRow key={idx} person={p} />)}</div></div>)}
      </main>
    </div>
  );
}

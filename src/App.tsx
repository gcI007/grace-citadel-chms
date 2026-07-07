import React, { useState, useEffect } from 'react';
import { Users, ArrowLeft, Sparkles, Lock, LogOut, Cake, CheckSquare, Search, UserPlus, ClipboardList, UserMinus, BarChart3, ShieldCheck, MessageCircle, MessageSquare, Phone, Heart, Gift, TrendingUp, CalendarDays, Share2, FileText, Home, Activity, History, Mail } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

// --- INITIALIZE SUPABASE ---
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// --- DESIGN SYSTEM: OFFICIAL LOGO ---
const GraceCrest = ({ className = "h-24 w-auto", opacity = 1 }) => (
  <img 
    src="https://tijlitzryjdhfebpjrao.supabase.co/storage/v1/object/public/Assets/WHITE.png" 
    alt="Grace Citadel Int'l Logo" 
    className={`object-contain ${className}`} 
    style={{ opacity }} 
  />
);

// --- MESSAGE TEMPLATES ---
const TEMPLATES = {
  welcome: "Hello {name}, welcome to Grace Citadel! We are so blessed to have you with us. We'd love to see you again this weekend!",
  missed: "Hello {name}, we missed you at service this past Sunday. We hope you are doing well and look forward to seeing you soon!",
  checking_in: "Hello {name}, just checking in on you from Grace Citadel! We haven't seen you in a little while and wanted to make sure everything is okay. Let us know how we can pray for you.",
  birthday: "Happy Birthday {name}! Grace Citadel celebrates you today. We pray this year brings you abundant joy, health, and favor!",
  bulk_student: "Greetings Students! This is a special update from Grace Citadel concerning our upcoming youth/campus fellowship. See you there!",
  bulk_men: "Greetings Men of Honor! This is a direct update from the Grace Citadel Men's Fellowship regarding our upcoming gathering.",
  bulk_present: "Hello {name}, it was wonderful fellowshipping with you at our last service! Have a blessed and highly favored week ahead.",
  bulk_absent: "Hello {name}, we really missed your presence at our last gathering! We hope you are doing well and look forward to fellowshipping with you soon."
};

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState('');

  const [activeView, setActiveView] = useState('dashboard');
  const [template, setTemplate] = useState('welcome');
  const [analyticsTab, setAnalyticsTab] = useState('service'); 

  const [birthdaysToday, setBirthdaysToday] = useState<any[]>([]);
  const [birthdaysWeek, setBirthdaysWeek] = useState<any[]>([]);
  const [birthdaysMonth, setBirthdaysMonth] = useState<any[]>([]);

  const [guestList, setGuestList] = useState<any[]>([]);
  const [absenteeList, setAbsenteeList] = useState<any[]>([]);
  const [crmTasks, setCrmTasks] = useState<any[]>([]);

  const [bulkGroup, setBulkGroup] = useState('Student');
  const [bulkText, setBulkText] = useState(TEMPLATES.bulk_student);
  const [bulkQueue, setBulkQueue] = useState<{ name: string; phone: string }[]>([]);
  const [bulkQueueIndex, setBulkQueueIndex] = useState(0);
  const [bulkDate, setBulkDate] = useState(new Date().toISOString().split('T')[0]);

  const [monthlyChartData, setMonthlyChartData] = useState<any[]>([]);
  const [selectedMonthData, setSelectedMonthData] = useState<any | null>(null);
  const [memberStats, setMemberStats] = useState<any[]>([]);
  const [cellStats, setCellStats] = useState({ overallAvg: 0, bestCell: '-', fastestGrowing: '-', trendData: [] as any[], cellsArray: [] as any[] });

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

  const [cellName, setCellName] = useState('');
  const [cellLeader, setCellLeader] = useState('');
  const [cellDate, setCellDate] = useState(new Date().toISOString().split('T')[0]);
  const [cellAttendance, setCellAttendance] = useState('');
  const [cellNotes, setCellNotes] = useState('');
  const [cellStatusMessage, setCellStatusMessage] = useState('');

  const [promptContext, setPromptContext] = useState('');
  const [generatedMessage, setGeneratedMessage] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [memberList, setMemberList] = useState<any[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [checkinDate, setCheckinDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [checkinStatusMessage, setCheckinStatusMessage] = useState('');

  const [trackingSearchTerm, setTrackingSearchTerm] = useState('');
  const [selectedTrackingMember, setSelectedTrackingMember] = useState<any>(null);
  const [trackingSundayHistory, setTrackingHistory] = useState<any[]>([]);
  const [trackingMidweekHistory, setTrackingMidweekHistory] = useState<any[]>([]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session));
    return () => subscription.unsubscribe();
  }, []);

  const userEmail = session?.user?.email?.toLowerCase() || '';
  const isCellLeader = userEmail.includes('cell') || userEmail.includes('leader');
  const isUsher = userEmail.includes('usher') && !isCellLeader;
  const isAdmin = !isUsher && !isCellLeader;

  useEffect(() => {
    if (session && isCellLeader) {
      setActiveView('cell_log');
    }
  }, [session, isCellLeader]);

  useEffect(() => {
    if (session && isAdmin) {
        if (activeView === 'dashboard') { fetchBirthdays(); fetchCrmTasks(); }
        if (activeView === 'birthdays') fetchBirthdays();
        if (activeView === 'guests') fetchGuests();
        if (activeView === 'absentees') fetchAbsentees();
        if (activeView === 'analytics') { fetchAnalytics(); setSelectedMonthData(null); setAnalyticsTab('service'); }
        if (activeView === 'tasks') { fetchBirthdays(); fetchCrmTasks(); fetchAbsentees(); }
    }
    if (session && (activeView === 'attendance' || activeView === 'member_history') && !isCellLeader) {
      fetchMembersForCheckin();
      setSelectedMembers([]); setCheckinStatusMessage(''); setSearchTerm('');
      setTrackingSearchTerm(''); setSelectedTrackingMember(null); setTrackingHistory([]); setTrackingMidweekHistory([]);
    }
  }, [session, activeView, isAdmin, isCellLeader]);

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

  const fetchMembersForCheckin = async () => { const { data } = await supabase.from('members').select('*').order('full_name'); if (data) setMemberList(data); };
  
  const fetchGuests = async () => { 
      const { data: guests } = await supabase.from('members').select('*').in('status', ['1st Timer', '2nd Timer']).order('created_at', { ascending: false }); 
      if (guests && guests.length > 0) { 
          const names = guests.map(g => g.full_name);
          const { data: checkins } = await supabase.from('member_checkins').select('service_date, member_name').in('member_name', names);
          
          const enrichedGuests = guests.map(g => {
              const myCheckins = checkins?.filter(c => c.member_name === g.full_name).map(c => c.service_date).sort() || [];
              
              const fallbackFirstVisit = g.created_at ? new Date(g.created_at).toISOString().split('T')[0] : null;
              
              return { 
                  ...g, 
                  firstVisit: myCheckins.length > 0 ? myCheckins[0] : fallbackFirstVisit, 
                  secondVisit: myCheckins.length > 1 ? myCheckins[1] : null 
              };
          });
          setGuestList(enrichedGuests); 
      } else {
          setGuestList([]);
      }
  };
  
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
        setCellStats({ overallAvg, bestCell: [...cellsArray].sort((a, b) => b.avg - a.avg)[0]?.name || '-', fastestGrowing: [...cellsArray].sort((a, b) => b.growth - a.growth)[0]?.name || '-', trendData: Object.values(monthlyTrend).sort((a: any, b: any) => a.sortDate - b.sortDate), cellsArray: cellsArray.sort((a, b) => b.avg - a.avg) });
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
          let alertLevel = 'Yellow Alert'; let colorClass = 'bg-[#C8A24D]/10 text-[#C8A24D] border-[#C8A24D]/30'; let icon = '🟡';
          if (missedCount >= 8) { alertLevel = 'Red Alert'; colorClass = 'bg-[#6E1E2B]/10 text-[#6E1E2B] border-[#6E1E2B]/30'; icon = '🚨'; } 
          else if (missedCount >= 4) { alertLevel = 'Orange Alert'; colorClass = 'bg-[#C8A24D]/20 text-[#C8A24D] border-[#C8A24D]'; icon = '🟧'; }
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
      let createdDate = new Date(today);
      if (member.created_at) {
          const parsed = new Date(member.created_at);
          if (!isNaN(parsed.getTime())) createdDate = parsed;
      }
      createdDate.setHours(0, 0, 0, 0);
      
      const daysSinceCreated = Math.floor((today.getTime() - createdDate.getTime()) / (1000 * 3600 * 24));
      const lastCheckinStr = lastCheckinMap[member.full_name];
      let missedCount = 0; if (lastCheckinStr) missedCount = sortedDates.filter(date => date > lastCheckinStr).length; else missedCount = sortedDates.filter(date => date >= createdDate.toISOString().split('T')[0]).length;
      
      if (member.status === '1st Timer' && daysSinceCreated >= 1 && daysSinceCreated <= 3) newTasks.push({ priority: 1, type: 'Day 2 Follow-Up', color: 'bg-[#0B1330]/10 text-[#0B1330]', member, description: 'New guest! Send a warm welcome message.', msgTemplate: 'welcome' });
      else if (member.status === '1st Timer' && missedCount >= 1 && daysSinceCreated >= 7) newTasks.push({ priority: 2, type: 'Guest Check-In', color: 'bg-[#C8A24D]/10 text-[#C8A24D]', member, description: 'Did not return for week 2.', msgTemplate: 'missed' });
      
      if (missedCount >= 8) newTasks.push({ priority: 3, type: '🚨 RED ALERT', color: 'bg-[#6E1E2B]/10 text-[#6E1E2B]', member, description: `Missed ${missedCount} services.`, msgTemplate: 'checking_in' });
      else if (missedCount >= 4) newTasks.push({ priority: 4, type: '🟧 ORANGE ALERT', color: 'bg-[#C8A24D]/20 text-[#C8A24D]', member, description: `Missed ${missedCount} services.`, msgTemplate: 'checking_in' });
      else if (missedCount >= 2 && member.status === 'Regular') newTasks.push({ priority: 5, type: '🟡 YELLOW ALERT', color: 'bg-[#C8A24D]/10 text-[#C8A24D]', member, description: `Missed ${missedCount} services.`, msgTemplate: 'missed' });
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

  const handleSendMessage = (phone: string | null, name: string, type: 'whatsapp' | 'sms' | 'call', overrideTemplate?: string) => {
    if (!phone) return alert(`No phone number recorded for ${name}.`);
    const cleanPhone = phone.replace(/\D/g, ''); 
    if (type === 'call') {
      window.open(`tel:${cleanPhone}`, '_self');
      return;
    }
    const message = TEMPLATES[Math.max(0, Object.keys(TEMPLATES).indexOf(overrideTemplate || template)) ? (overrideTemplate || template) as keyof typeof TEMPLATES : 'welcome'].replace('{name}', name);
    if (type === 'whatsapp') window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');
    else window.open(`sms:${cleanPhone}?body=${encodeURIComponent(message)}`, '_blank');
  };

  const handleSelectTrackingMember = async (member: any) => {
      setSelectedTrackingMember(member);
      
      const { data: sundays } = await supabase.from('member_checkins').select('service_date').eq('member_name', member.full_name).order('service_date', { ascending: false });
      setTrackingHistory(sundays || []);
      
      const { data: midweek } = await supabase.from('cell_meetings').select('meeting_date, cell_name').eq('leader_name', member.full_name).order('meeting_date', { ascending: false });
      setTrackingMidweekHistory(midweek || []);

      const { data: fullMember } = await supabase.from('members').select('*').eq('id', member.id).single();
      if (fullMember) setSelectedTrackingMember(fullMember);
  };

  const prepareBulkQueue = async () => {
    setIsSubmitting(true);
    const { data: targets } = await supabase.from('members').select('full_name, phone_number, email, gender, status, occupation');
    const { data: checkins } = await supabase.from('member_checkins').select('service_date, member_name');
    setIsSubmitting(false);

    if (!targets || targets.length === 0) return alert('No members found.');

    let presentNames: string[] = [];
    if (['Present', 'Absent'].includes(bulkGroup)) {
        const hasCheckins = checkins?.some(c => c.service_date === bulkDate);
        if (!hasCheckins) return alert(`⚠️ No attendance records found for ${bulkDate}. Please select a valid service date from the calendar.`);
        if (checkins) {
            presentNames = checkins.filter(c => c.service_date === bulkDate).map(c => c.member_name);
        }
    }

    let filtered = targets;
    if (bulkGroup === 'Student') filtered = targets.filter(m => m.status === 'Student' || m.occupation?.toLowerCase().includes('student'));
    if (bulkGroup === 'Men') filtered = targets.filter(m => m.gender === 'Male');
    if (bulkGroup === 'Women') filtered = targets.filter(m => m.gender === 'Female');
    if (bulkGroup === 'Present') filtered = targets.filter(m => presentNames.includes(m.full_name));
    if (bulkGroup === 'Absent') filtered = targets.filter(m => !presentNames.includes(m.full_name));

    const queue = filtered.filter(m => m.phone_number).map(m => ({ name: m.full_name, phone: m.phone_number as string }));
    if (queue.length === 0) return alert('No valid phone numbers found for this group on the selected date.');
    
    setBulkQueue(queue); setBulkQueueIndex(0);
  };

  const sendNextInQueue = () => {
    const recipient = bulkQueue[bulkQueueIndex];
    if (!recipient) return;
    const personalizedText = bulkText.replace('{name}', recipient.name);
    const cleanPhone = recipient.phone.replace(/\D/g, '');
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(personalizedText)}`, '_blank');
    setBulkQueueIndex(prev => prev + 1);
  };

  const handleSendBulkSMS = async () => {
    setIsSubmitting(true);
    const { data: targets } = await supabase.from('members').select('full_name, phone_number, email, gender, status, occupation');
    const { data: checkins } = await supabase.from('member_checkins').select('service_date, member_name');
    
    if (!targets || targets.length === 0) { setIsSubmitting(false); return alert('No members found.'); }

    let presentNames: string[] = [];
    if (['Present', 'Absent'].includes(bulkGroup)) {
        const hasCheckins = checkins?.some(c => c.service_date === bulkDate);
        if (!hasCheckins) { setIsSubmitting(false); return alert(`⚠️ No attendance records found for ${bulkDate}. Please select a valid service date from the calendar.`); }
        if (checkins) {
            presentNames = checkins.filter(c => c.service_date === bulkDate).map(c => c.member_name);
        }
    }

    let filtered = targets;
    if (bulkGroup === 'Student') filtered = targets.filter(m => m.status === 'Student' || m.occupation?.toLowerCase().includes('student'));
    if (bulkGroup === 'Men') filtered = targets.filter(m => m.gender === 'Male');
    if (bulkGroup === 'Women') filtered = targets.filter(m => m.gender === 'Female');
    if (bulkGroup === 'Present') filtered = targets.filter(m => presentNames.includes(m.full_name));
    if (bulkGroup === 'Absent') filtered = targets.filter(m => !presentNames.includes(m.full_name));

    const phones = filtered.map(m => m.phone_number).filter(p => p !== null) as string[];
    if (phones.length === 0) { setIsSubmitting(false); return alert('No valid phone numbers found for this group on the selected date.'); }
    
    const cleanPhones = phones.map(p => p.replace(/\D/g, ''));
    window.open(`sms:${cleanPhones.join(navigator.userAgent.includes('Mac') ? ',' : ';')}?body=${encodeURIComponent(bulkText)}`, '_blank');
    setIsSubmitting(false);
  };

  const handleSendBulkEmail = async () => {
    setIsSubmitting(true);
    const { data: targets } = await supabase.from('members').select('full_name, phone_number, email, gender, status, occupation');
    const { data: checkins } = await supabase.from('member_checkins').select('service_date, member_name');
    
    if (!targets || targets.length === 0) { setIsSubmitting(false); return alert('No members found.'); }

    let presentNames: string[] = [];
    if (['Present', 'Absent'].includes(bulkGroup)) {
        const hasCheckins = checkins?.some(c => c.service_date === bulkDate);
        if (!hasCheckins) { setIsSubmitting(false); return alert(`⚠️ No attendance records found for ${bulkDate}. Please select a valid service date from the calendar.`); }
        if (checkins) {
            presentNames = checkins.filter(c => c.service_date === bulkDate).map(c => c.member_name);
        }
    }

    let filtered = targets;
    if (bulkGroup === 'Student') filtered = targets.filter(m => m.status === 'Student' || m.occupation?.toLowerCase().includes('student'));
    if (bulkGroup === 'Men') filtered = targets.filter(m => m.gender === 'Male');
    if (bulkGroup === 'Women') filtered = targets.filter(m => m.gender === 'Female');
    if (bulkGroup === 'Present') filtered = targets.filter(m => presentNames.includes(m.full_name));
    if (bulkGroup === 'Absent') filtered = targets.filter(m => !presentNames.includes(m.full_name));

    const emails = filtered.map(m => m.email).filter(e => e !== null && e.trim() !== '') as string[];
    if (emails.length === 0) { setIsSubmitting(false); return alert('No valid email addresses found for this group on the selected date.'); }
    
    const bccList = emails.join(',');
    const subject = encodeURIComponent("Update from Grace Citadel");
    const body = encodeURIComponent(bulkText);
    
    window.location.href = `mailto:?bcc=${bccList}&subject=${subject}&body=${body}`;
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
    setIsSubmitting(true); setCheckinStatusMessage('Verifying against duplicates and saving...');
    try {
      const selectedObjects = memberList.filter(m => selectedMembers.includes(m.id));
      const namesToInsert = selectedObjects.map(m => m.full_name);
      
      const { data: existingCheckins, error: checkError } = await supabase.from('member_checkins').select('member_name').eq('service_date', checkinDate).in('member_name', namesToInsert);
      
      if (checkError) throw checkError;

      const alreadyCheckedIn = new Set(existingCheckins?.map(c => c.member_name) || []);
      const validObjects = selectedObjects.filter(m => !alreadyCheckedIn.has(m.full_name));
      
      if (validObjects.length === 0) { setCheckinStatusMessage('⚠️ Alert: Everyone selected is already checked in.'); setIsSubmitting(false); return; }
      
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
      setCheckinStatusMessage(`✅ Logged ${validObjects.length} members! ${alreadyCheckedIn.size > 0 ? `(${alreadyCheckedIn.size} skipped)` : ''}`);
      setSelectedMembers([]); setSearchTerm('');
    } catch (error: any) { setCheckinStatusMessage('❌ Error: ' + error.message); } finally { setIsSubmitting(false); }
  };

  const BirthdayRow = ({ person }: { person: any }) => (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#C8A24D]/10 last:border-0 p-4 hover:bg-[#C8A24D]/5 transition-colors gap-3">
      <div><div className="font-bold text-[#1C1730] text-lg font-inter">{person.full_name}</div><div className="text-[#1C1730]/60 text-sm font-plex">{person.date_of_birth} • {person.phone_number || 'No Phone'}</div></div>
      <div className="flex items-center gap-2 flex-wrap">
        <button onClick={() => handleSendMessage(person.phone_number, person.full_name, 'whatsapp', 'birthday')} className="flex items-center gap-1 bg-[#0B1330] text-[#F6F1E4] px-3 py-1.5 rounded hover:bg-[#2F1B4D] text-xs font-bold font-inter transition-colors"><MessageCircle size={14}/> WA</button>
        <button onClick={() => handleSendMessage(person.phone_number, person.full_name, 'sms', 'birthday')} className="flex items-center gap-1 bg-transparent border border-[#0B1330]/30 text-[#0B1330] px-3 py-1.5 rounded hover:bg-[#0B1330]/5 text-xs font-bold font-inter transition-colors"><MessageSquare size={14}/> SMS</button>
        <button onClick={() => handleSendMessage(person.phone_number, person.full_name, 'call')} className="flex items-center gap-1 bg-[#C8A24D] text-[#0B1330] px-3 py-1.5 rounded hover:bg-[#b59040] text-xs font-bold font-inter transition-colors"><Phone size={14}/> Call</button>
      </div>
    </div>
  );

  const guestTasks = crmTasks.filter(t => t.member.status === '1st Timer' || t.member.status === '2nd Timer');
  const urgentMissingTasks = crmTasks.filter(t => t.type.includes('RED') || t.type.includes('ORANGE'));

  if (!session) {
    return (
      <div className="min-h-screen bg-[#0B1330] flex items-center justify-center p-4 relative overflow-hidden font-inter">
        <style dangerouslySetInnerHTML={{__html: `
          @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700&family=Cormorant+Garamond:wght@600;700&family=IBM+Plex+Mono:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap');
          .font-cinzel { font-family: 'Cinzel', serif; }
          .font-cormorant { font-family: 'Cormorant Garamond', serif; }
          .font-plex { font-family: 'IBM Plex Mono', monospace; }
          .font-inter { font-family: 'Inter', sans-serif; }
        `}} />
        <GraceCrest className="absolute w-[150vw] h-[150vw] -right-[30vw] -bottom-[30vw] pointer-events-none" opacity={0.03} />
        
        <div className="bg-[#F6F1E4] p-10 rounded-2xl shadow-2xl max-w-md w-full border border-[#C8A24D]/30 relative z-10">
          <div className="flex justify-center mb-4"><GraceCrest className="h-28 w-auto" opacity={1} /></div>
          <h1 className="text-3xl font-cinzel font-bold text-center text-[#0B1330] mb-6 tracking-wide">Grace Citadel</h1>
          <form onSubmit={handleLogin} className="space-y-5">
            <div><label className="block text-sm font-bold text-[#1C1730] mb-1 font-inter">Email</label><input type="email" required value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} className="w-full bg-white border border-[#C8A24D]/40 rounded-md p-3 focus:border-[#C8A24D] focus:ring-1 focus:ring-[#C8A24D] outline-none text-[#1C1730] font-inter" /></div>
            <div><label className="block text-sm font-bold text-[#1C1730] mb-1 font-inter">Password</label><input type="password" required value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} className="w-full bg-white border border-[#C8A24D]/40 rounded-md p-3 focus:border-[#C8A24D] focus:ring-1 focus:ring-[#C8A24D] outline-none text-[#1C1730] font-inter" /></div>
            {authError && <p className="text-[#6E1E2B] text-sm font-bold font-inter">{authError}</p>}
            <button type="submit" disabled={isAuthenticating} className="w-full bg-[#0B1330] text-[#C8A24D] p-4 rounded-md font-bold font-inter tracking-wide hover:bg-[#2F1B4D] transition-colors shadow-lg border border-[#0B1330]">
                {isAuthenticating ? 'Authorizing...' : 'Secure Sign In'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const maxMonthlyTotal = monthlyChartData.length > 0 ? Math.max(...monthlyChartData.map(d => d.total)) : 1;
  const maxCellMonthlyTotal = cellStats.trendData.length > 0 ? Math.max(...cellStats.trendData.map(d => d.total)) : 1;

  return (
    <div className="min-h-screen bg-[#EBE7DD] flex flex-col font-inter">
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700&family=Cormorant+Garamond:wght@600;700&family=IBM+Plex+Mono:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap');
        .font-cinzel { font-family: 'Cinzel', serif; }
        .font-cormorant { font-family: 'Cormorant Garamond', serif; }
        .font-plex { font-family: 'IBM Plex Mono', monospace; }
        .font-inter { font-family: 'Inter', sans-serif; }
      `}} />

      <header className="bg-[#0B1330] border-b-2 border-[#C8A24D] px-6 py-4 flex items-center justify-between shadow-md relative z-20">
        <div className="flex items-center gap-4 cursor-pointer group" onClick={() => !isCellLeader && setActiveView('dashboard')}>
          <GraceCrest className="h-16 w-auto transform group-hover:scale-105 transition-transform" />
          <div>
            <h1 className="text-2xl font-cinzel font-bold text-[#C8A24D] tracking-wide leading-none">Grace Citadel</h1>
          </div>
        </div>
        <div className="flex items-center gap-4">
            <span className="text-[#F6F1E4]/70 font-plex text-xs hidden md:inline">
                {isAdmin ? 'ADMIN CLEARANCE' : isCellLeader ? 'CELL LEADER PORTAL' : 'USHER PORTAL'}
            </span>
            <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 text-sm border border-[#C8A24D]/30 text-[#C8A24D] rounded-md hover:bg-[#2F1B4D] hover:border-[#C8A24D] font-bold transition-colors">
                <LogOut size={16} /> Exit
            </button>
        </div>
      </header>

      <main className="flex-1 p-6 relative">
        <GraceCrest className="absolute w-[60vw] h-[60vw] -left-[10vw] top-[10vw] pointer-events-none fixed" opacity={0.03} />
        
        {!isCellLeader && activeView === 'dashboard' && (
          <div className="max-w-7xl mx-auto space-y-6 relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              
              <div className="bg-[#F6F1E4] p-6 rounded-xl shadow-sm border border-[#C8A24D]/20 hover:shadow-md hover:border-[#C8A24D]/50 transition-all cursor-pointer group" onClick={() => setActiveView('attendance')}>
                  <h2 className="text-2xl font-cormorant font-bold mb-2 text-[#0B1330] flex items-center gap-3"><CheckSquare size={22} className="text-[#C8A24D]"/> Service Check-In</h2>
                  <p className="text-[#1C1730]/70 text-sm font-inter">Log weekend service attendance roster.</p>
              </div>
              <div className="bg-[#F6F1E4] p-6 rounded-xl shadow-sm border border-[#C8A24D]/20 hover:shadow-md hover:border-[#C8A24D]/50 transition-all cursor-pointer group" onClick={() => {setActiveView('members'); setStatusMessage('');}}>
                  <h2 className="text-2xl font-cormorant font-bold mb-2 text-[#0B1330] flex items-center gap-3"><UserPlus size={22} className="text-[#C8A24D]"/> Registration Form</h2>
                  <p className="text-[#1C1730]/70 text-sm font-inter">Register new members and 1st timers.</p>
              </div>

              {isAdmin && (
                <div className="bg-[#F6F1E4] p-6 rounded-xl shadow-sm border border-[#C8A24D]/20 hover:shadow-md hover:border-[#C8A24D]/50 transition-all cursor-pointer group" onClick={() => {setActiveView('cell_log'); setCellStatusMessage('');}}>
                    <h2 className="text-2xl font-cormorant font-bold mb-2 text-[#0B1330] flex items-center gap-3"><Home size={22} className="text-[#C8A24D]"/> Cell Meeting Log</h2>
                    <p className="text-[#1C1730]/70 text-sm font-inter">Record weekly mid-week fellowship data.</p>
                </div>
              )}

              {isAdmin && (
                <>
                  <div className="bg-[#F6F1E4] p-6 rounded-xl shadow-sm border border-[#C8A24D]/20 hover:shadow-md hover:border-[#C8A24D]/50 transition-all cursor-pointer group" onClick={() => { setActiveView('member_history'); fetchMembersForCheckin(); }}>
                      <h2 className="text-2xl font-cormorant font-bold mb-2 text-[#0B1330] flex items-center gap-3"><History size={22} className="text-[#C8A24D]"/> Member History</h2>
                      <p className="text-[#1C1730]/70 text-sm font-inter">Search individual attendance and profile records.</p>
                  </div>
                  <div className="bg-[#2F1B4D] p-6 rounded-xl shadow-lg border border-[#C8A24D]/50 hover:shadow-xl hover:border-[#C8A24D] transition-all cursor-pointer relative overflow-hidden group" onClick={() => setActiveView('tasks')}>
                      <div className="absolute top-0 right-0 bg-[#6E1E2B] text-[#F6F1E4] font-plex text-xs font-bold px-3 py-1 rounded-bl-lg shadow-md">{crmTasks.length} PENDING</div>
                      <h2 className="text-2xl font-cormorant font-bold mb-2 text-[#F6F1E4] flex items-center gap-3"><ShieldCheck size={22} className="text-[#C8A24D]"/> Pastoral Command Center</h2>
                      <p className="text-[#F6F1E4]/70 text-sm font-inter">Centralized hub for all pastoral tasks.</p>
                  </div>
                  <div className="bg-[#0B1330] p-6 rounded-xl shadow-lg border border-[#C8A24D]/50 hover:shadow-xl hover:border-[#C8A24D] transition-all cursor-pointer group" onClick={() => setActiveView('analytics')}>
                      <h2 className="text-2xl font-cormorant font-bold mb-2 text-[#F6F1E4] flex items-center gap-3"><TrendingUp size={22} className="text-[#C8A24D]"/> Service & Cell Analytics</h2>
                      <p className="text-[#F6F1E4]/70 text-sm font-inter">Visual analytics for structural church growth.</p>
                  </div>
                  <div className="bg-[#0B1330] p-6 rounded-xl shadow-lg border border-[#C8A24D]/50 hover:shadow-xl hover:border-[#C8A24D] transition-all cursor-pointer group" onClick={() => setActiveView('bulk')}>
                      <h2 className="text-2xl font-cormorant font-bold mb-2 text-[#F6F1E4] flex items-center gap-3"><Share2 size={22} className="text-[#C8A24D]"/> Bulk Outreach Node</h2>
                      <p className="text-[#F6F1E4]/70 text-sm font-inter">Execute targeted demographic broadcast queues.</p>
                  </div>

                  <div className="bg-[#F6F1E4] p-6 rounded-xl shadow-sm border border-[#C8A24D]/20 hover:shadow-md hover:border-[#C8A24D]/50 transition-all cursor-pointer" onClick={() => setActiveView('absentees')}>
                      <h2 className="text-2xl font-cormorant font-bold mb-2 text-[#0B1330] flex items-center gap-3"><UserMinus size={22} className="text-[#6E1E2B]"/> Smart Absentee Radar</h2>
                      <p className="text-[#1C1730]/70 text-sm font-inter">Absentee heat-map and alert levels.</p>
                  </div>
                  <div className="bg-[#F6F1E4] p-6 rounded-xl shadow-sm border border-[#C8A24D]/20 hover:shadow-md hover:border-[#C8A24D]/50 transition-all cursor-pointer relative" onClick={() => setActiveView('birthdays')}>
                      {birthdaysToday.length > 0 && <div className="absolute top-0 right-0 bg-[#0B1330] text-[#C8A24D] font-plex text-xs font-bold px-3 py-1 rounded-bl-lg shadow-sm border-l border-b border-[#C8A24D]/50">TODAY!</div>}
                      <h2 className="text-2xl font-cormorant font-bold mb-2 text-[#0B1330] flex items-center gap-3"><Gift size={22} className="text-[#C8A24D]"/> Birthday Dashboard</h2>
                      <p className="text-[#1C1730]/70 text-sm font-inter">Manage upcoming congregational milestones.</p>
                  </div>
                  <div className="bg-[#F6F1E4] p-6 rounded-xl shadow-sm border border-[#C8A24D]/20 hover:shadow-md hover:border-[#C8A24D]/50 transition-all cursor-pointer" onClick={() => setActiveView('guests')}>
                      <h2 className="text-2xl font-cormorant font-bold mb-2 text-[#0B1330] flex items-center gap-3"><ClipboardList size={22} className="text-[#C8A24D]"/> Guest Follow-Up Roster</h2>
                      <p className="text-[#1C1730]/70 text-sm font-inter">Direct access to 1st and 2nd Timers.</p>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {!isCellLeader && activeView === 'attendance' && (
          <div className="max-w-4xl mx-auto bg-[#F6F1E4] p-8 rounded-xl shadow-xl border border-[#C8A24D]/30 relative z-10">
            <button onClick={() => setActiveView('dashboard')} className="flex items-center gap-2 text-sm font-bold font-inter text-[#0B1330] hover:text-[#C8A24D] mb-6 transition-colors"><ArrowLeft size={16} /> Back to Dashboard</button>
            <div className="flex items-center gap-3 mb-8 border-b-2 border-[#C8A24D]/20 pb-4"><CheckSquare className="text-[#C8A24D]" size={32} /><h2 className="text-3xl font-cormorant font-bold text-[#0B1330]">Service Check-In</h2></div>
            
            <div className="flex flex-col md:flex-row gap-6 mb-8">
              <div className="flex-1"><label className="block text-xs font-bold font-inter uppercase tracking-widest text-[#1C1730]/70 mb-2">Service Date</label><input type="date" value={checkinDate} onChange={(e) => setCheckinDate(e.target.value)} className="w-full bg-white border border-[#C8A24D]/30 rounded p-3 text-[#1C1730] font-inter outline-none focus:border-[#C8A24D]" /></div>
              <div className="flex-[2]">
                <label className="block text-xs font-bold font-inter uppercase tracking-widest text-[#1C1730]/70 mb-2">Search by Name or Phone</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Search size={18} className="text-[#C8A24D]" /></div>
                  <input type="text" placeholder="e.g. John Doe or 080..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-white border border-[#C8A24D]/30 rounded p-3 pl-12 text-[#1C1730] font-inter outline-none focus:border-[#C8A24D]" />
                </div>
              </div>
            </div>
            
            <div className="border border-[#C8A24D]/40 rounded-lg overflow-hidden mb-6 shadow-sm bg-white">
              <div className="bg-[#0B1330] p-4 font-bold text-[#F6F1E4] text-sm flex justify-between font-inter uppercase tracking-widest">
                  <span>Congregation Roster</span><span className="text-[#C8A24D] font-plex">{selectedMembers.length} Selected</span>
              </div>
              <div className="max-h-[50vh] overflow-y-auto p-2 bg-[#F6F1E4]">
                {memberList.filter(m => m.full_name.toLowerCase().includes(searchTerm.toLowerCase()) || (m.phone_number && m.phone_number.includes(searchTerm))).map((m, idx) => (
                  <label key={m.id || idx} className="flex items-start gap-4 p-4 hover:bg-white rounded cursor-pointer border-b border-[#C8A24D]/10 last:border-0 transition-colors">
                    <input type="checkbox" checked={selectedMembers.includes(m.id)} onChange={() => toggleMemberSelection(m.id)} className="w-6 h-6 mt-0.5 text-[#0B1330] rounded border-[#C8A24D]/40 focus:ring-[#C8A24D]" />
                    <div className="flex flex-col">
                        <span className="text-[#1C1730] font-bold font-inter text-lg">{m.full_name}</span>
                        <span className="text-[#1C1730]/50 text-sm font-plex">{m.phone_number || 'No phone number on file'}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>
            
            <button onClick={handleSaveCheckins} disabled={isSubmitting || memberList.length === 0} className="w-full md:w-auto bg-[#C8A24D] text-[#0B1330] px-10 py-4 rounded font-bold font-inter uppercase tracking-widest text-lg disabled:opacity-50 shadow-lg hover:bg-[#b59040] transition-colors">
                {isSubmitting ? 'Verifying...' : 'Save Attendance'}
            </button>
            
            {checkinStatusMessage && (
                <div className={`p-4 rounded mt-6 text-sm font-bold font-inter border ${checkinStatusMessage.includes('✅') ? 'bg-[#C8A24D]/10 text-[#0B1330] border-[#C8A24D]' : checkinStatusMessage.includes('⚠️') ? 'bg-white text-[#0B1330] border-[#0B1330]' : 'bg-[#6E1E2B]/10 text-[#6E1E2B] border-[#6E1E2B]'}`}>
                    {checkinStatusMessage}
                </div>
            )}
          </div>
        )}

        {!isCellLeader && activeView === 'members' && (
          <div className="max-w-4xl mx-auto bg-[#F6F1E4] p-8 rounded-xl shadow-xl border border-[#C8A24D]/30 relative z-10">
            <button onClick={() => setActiveView('dashboard')} className="flex items-center gap-2 text-sm font-bold font-inter text-[#0B1330] hover:text-[#C8A24D] mb-6 transition-colors"><ArrowLeft size={16} /> Back to Dashboard</button>
            <h2 className="text-3xl font-cormorant font-bold text-[#0B1330] mb-8 border-b-2 border-[#C8A24D]/20 pb-4">Registration Form</h2>
            
            <form onSubmit={handleSaveMember} className="flex flex-col gap-6 max-w-lg">
              <div className="bg-white p-5 rounded-lg border border-[#C8A24D]/40 shadow-sm border-l-4 border-l-[#C8A24D]">
                <label className="block text-xs font-bold font-inter uppercase tracking-widest text-[#1C1730]/70 mb-2">Registration Type / Status Profile</label>
                <select value={memberStatus} onChange={(e) => setMemberStatus(e.target.value)} className="w-full border border-[#C8A24D]/30 rounded p-3 bg-[#F6F1E4] text-[#0B1330] font-bold font-inter outline-none focus:border-[#C8A24D] focus:ring-1 focus:ring-[#C8A24D]">
                  <option value="1st Timer">1st Timer</option>
                  <option value="2nd Timer">2nd Timer</option>
                  <option value="Student">Student Demographic</option>
                  <option value="Regular">Regular Member</option>
                </select>
              </div>

              <div><label className="block text-xs font-bold font-inter uppercase tracking-widest text-[#1C1730]/70 mb-2">Full Name</label><input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-white border border-[#C8A24D]/30 rounded p-3 text-[#1C1730] font-inter outline-none focus:border-[#C8A24D]" /></div>
              
              <div className="grid grid-cols-2 gap-6">
                <div><label className="block text-xs font-bold font-inter uppercase tracking-widest text-[#1C1730]/70 mb-2">Gender</label><select value={gender} onChange={(e) => setGender(e.target.value)} className="w-full bg-white border border-[#C8A24D]/30 rounded p-3 text-[#1C1730] font-inter outline-none focus:border-[#C8A24D]"><option value="">Select...</option><option value="Male">Male</option><option value="Female">Female</option></select></div>
                <div>
                  <label className="block text-xs font-bold font-inter uppercase tracking-widest text-[#1C1730]/70 mb-2">Birthday</label>
                  <div className="flex gap-2">
                    <select value={dobMonth} onChange={(e) => setDobMonth(e.target.value)} className="w-1/2 bg-white border border-[#C8A24D]/30 rounded p-3 text-[#1C1730] font-inter outline-none focus:border-[#C8A24D]"><option value="">Mo</option>{['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(m => <option key={m} value={m}>{m.substring(0,3)}</option>)}</select>
                    <select value={dobDay} onChange={(e) => setDobDay(e.target.value)} className="w-1/2 bg-white border border-[#C8A24D]/30 rounded p-3 text-[#1C1730] font-inter outline-none focus:border-[#C8A24D]"><option value="">Day</option>{[...Array(31)].map((_, i) => <option key={i+1} value={i+1}>{i+1}</option>)}</select>
                  </div>
                </div>
              </div>

              <div><label className="block text-xs font-bold font-inter uppercase tracking-widest text-[#1C1730]/70 mb-2">Occupation</label><input type="text" value={occupation} onChange={(e) => setOccupation(e.target.value)} className="w-full bg-white border border-[#C8A24D]/30 rounded p-3 text-[#1C1730] font-inter outline-none focus:border-[#C8A24D]" /></div>
              <div><label className="block text-xs font-bold font-inter uppercase tracking-widest text-[#1C1730]/70 mb-2">Email</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-white border border-[#C8A24D]/30 rounded p-3 text-[#1C1730] font-plex outline-none focus:border-[#C8A24D]" /></div>
              <div><label className="block text-xs font-bold font-inter uppercase tracking-widest text-[#1C1730]/70 mb-2">Phone</label><input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full bg-white border border-[#C8A24D]/30 rounded p-3 text-[#1C1730] font-plex outline-none focus:border-[#C8A24D]" /></div>
              
              <button type="submit" disabled={isSubmitting} className="bg-[#0B1330] text-[#C8A24D] px-4 py-4 rounded font-bold font-inter uppercase tracking-widest hover:bg-[#2F1B4D] shadow-lg transition-colors border border-[#0B1330] mt-4 disabled:opacity-50">
                Save Registration
              </button>
              
              {statusMessage && <div className={`p-4 rounded border font-inter font-bold text-sm ${statusMessage.includes('✅') ? 'bg-[#C8A24D]/10 text-[#0B1330] border-[#C8A24D]' : 'bg-[#6E1E2B]/10 text-[#6E1E2B] border-[#6E1E2B]'}`}>{statusMessage}</div>}
            </form>
          </div>
        )}

        {activeView === 'cell_log' && (
          <div className="max-w-4xl mx-auto bg-[#F6F1E4] p-8 rounded-xl shadow-xl border border-[#C8A24D]/30 relative z-10">
            {!isCellLeader && <button onClick={() => setActiveView('dashboard')} className="flex items-center gap-2 text-sm font-bold font-inter text-[#0B1330] hover:text-[#C8A24D] mb-6 transition-colors"><ArrowLeft size={16} /> Back to Dashboard</button>}
            <div className="flex items-center gap-3 mb-8 border-b-2 border-[#C8A24D]/20 pb-4"><Home className="text-[#C8A24D]" size={32} /><h2 className="text-3xl font-cormorant font-bold text-[#0B1330]">Cell Meeting Report</h2></div>
            
            <form onSubmit={handleSaveCellMeeting} className="flex flex-col gap-6 max-w-lg">
              <div><label className="block text-xs font-bold font-inter uppercase tracking-widest text-[#1C1730]/70 mb-2">Cell Group Name</label><input type="text" required value={cellName} onChange={(e) => setCellName(e.target.value)} placeholder="e.g. Grace Fellowship - Downtown" className="w-full bg-white border border-[#C8A24D]/30 rounded p-3 text-[#1C1730] font-inter outline-none focus:border-[#C8A24D]" /></div>
              <div className="grid grid-cols-2 gap-6">
                  <div><label className="block text-xs font-bold font-inter uppercase tracking-widest text-[#1C1730]/70 mb-2">Leader Name</label><input type="text" required value={cellLeader} onChange={(e) => setCellLeader(e.target.value)} className="w-full bg-white border border-[#C8A24D]/30 rounded p-3 text-[#1C1730] font-inter outline-none focus:border-[#C8A24D]" /></div>
                  <div><label className="block text-xs font-bold font-inter uppercase tracking-widest text-[#1C1730]/70 mb-2">Attendance</label><input type="number" required min="1" value={cellAttendance} onChange={(e) => setCellAttendance(e.target.value)} className="w-full bg-white border border-[#C8A24D]/30 rounded p-3 text-[#1C1730] font-plex outline-none focus:border-[#C8A24D]" /></div>
              </div>
              <div><label className="block text-xs font-bold font-inter uppercase tracking-widest text-[#1C1730]/70 mb-2">Meeting Date</label><input type="date" required value={cellDate} onChange={(e) => setCellDate(e.target.value)} className="w-full bg-white border border-[#C8A24D]/30 rounded p-3 text-[#1C1730] font-inter outline-none focus:border-[#C8A24D]" /></div>
              <div><label className="block text-xs font-bold font-inter uppercase tracking-widest text-[#1C1730]/70 mb-2">Notes / Testimonies</label><textarea rows={4} value={cellNotes} onChange={(e) => setCellNotes(e.target.value)} className="w-full bg-white border border-[#C8A24D]/30 rounded p-3 text-[#1C1730] font-inter outline-none focus:border-[#C8A24D]" /></div>
              <button type="submit" disabled={isSubmitting} className="bg-[#0B1330] text-[#C8A24D] px-4 py-4 rounded font-bold font-inter uppercase tracking-widest hover:bg-[#2F1B4D] shadow-lg transition-colors border border-[#0B1330] mt-4 disabled:opacity-50">Submit Report</button>
              {cellStatusMessage && <div className={`p-4 rounded border font-inter font-bold text-sm ${cellStatusMessage.includes('✅') ? 'bg-[#C8A24D]/10 text-[#0B1330] border-[#C8A24D]' : 'bg-[#6E1E2B]/10 text-[#6E1E2B] border-[#6E1E2B]'}`}>{cellStatusMessage}</div>}
            </form>
          </div>
        )}

        {!isCellLeader && activeView === 'member_history' && isAdmin && (
          <div className="max-w-5xl mx-auto bg-[#F6F1E4] p-8 rounded-xl shadow-xl border border-[#C8A24D]/30 relative z-10">
            <button onClick={() => { if(selectedTrackingMember) setSelectedTrackingMember(null); else setActiveView('dashboard'); }} className="flex items-center gap-2 text-sm font-bold font-inter text-[#0B1330] hover:text-[#C8A24D] mb-6 transition-colors">
                <ArrowLeft size={16} /> {selectedTrackingMember ? 'Back to Search' : 'Back to Dashboard'}
            </button>
            <div className="flex items-center gap-3 mb-8 border-b-2 border-[#C8A24D]/20 pb-4">
                <History className="text-[#C8A24D]" size={32} />
                <h2 className="text-3xl font-cormorant font-bold text-[#0B1330]">Individual Tracking Profile</h2>
            </div>
            
            {!selectedTrackingMember ? (
                <>
                    <div className="mb-6">
                        <label className="block text-xs font-bold font-inter uppercase tracking-widest text-[#1C1730]/70 mb-2">Search Member</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Search size={18} className="text-[#C8A24D]" /></div>
                            <input type="text" placeholder="Search by name, phone, or birthday (e.g., March)..." value={trackingSearchTerm} onChange={(e) => setTrackingSearchTerm(e.target.value)} className="w-full bg-white border border-[#C8A24D]/30 rounded p-3 pl-12 text-[#1C1730] font-inter outline-none focus:border-[#C8A24D]" />
                        </div>
                    </div>
                    <div className="border border-[#C8A24D]/40 rounded-lg overflow-hidden bg-white shadow-sm">
                        <div className="max-h-[50vh] overflow-y-auto p-2 bg-[#F6F1E4]">
                            {memberList.filter(m => {
                                const term = trackingSearchTerm.toLowerCase();
                                return (m.full_name?.toLowerCase().includes(term)) || 
                                       (m.phone_number?.includes(term)) || 
                                       (m.date_of_birth?.toLowerCase().includes(term));
                            }).map((m, idx) => (
                                <div key={m.id || idx} onClick={() => handleSelectTrackingMember(m)} className="p-4 hover:bg-white rounded cursor-pointer border-b border-[#C8A24D]/10 last:border-0 transition-colors flex justify-between items-center group">
                                    <span className="text-[#1C1730] font-bold font-inter text-lg">{m.full_name}</span>
                                    <span className="text-[#C8A24D] font-bold text-sm opacity-0 group-hover:opacity-100 transition-opacity">View Profile Record &rarr;</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            ) : (
                <div className="space-y-6">
                    <div className="bg-[#0B1330] p-6 rounded-xl text-[#F6F1E4] shadow-md border border-[#C8A24D]/50 flex flex-col lg:flex-row justify-between lg:items-center gap-6">
                        <div className="flex items-center gap-6">
                            <div className="w-24 h-24 min-w-[96px] rounded border-2 border-[#C8A24D] bg-[#1C1730] flex flex-col items-center justify-center shadow-inner overflow-hidden relative group">
                                <div className="text-4xl text-[#C8A24D] font-cinzel font-bold">{selectedTrackingMember.full_name.charAt(0)}</div>
                                <div className="absolute bottom-0 w-full bg-[#C8A24D]/90 text-[#0B1330] text-[8px] font-bold font-inter text-center py-0.5 uppercase tracking-widest opacity-80">Biometric</div>
                            </div>
                            <div>
                                <h3 className="text-3xl font-cormorant font-bold text-[#C8A24D] mb-2">{selectedTrackingMember.full_name}</h3>
                                <div className="text-xs font-plex opacity-80 flex gap-x-4 gap-y-2 flex-wrap mb-3">
                                    <span className="flex items-center gap-1">📞 {selectedTrackingMember.phone_number || 'No phone'}</span>
                                    <span className="flex items-center gap-1">🎂 {selectedTrackingMember.date_of_birth || 'No DOB'}</span>
                                    <span className="flex items-center gap-1">✉️ {selectedTrackingMember.email || 'No email'}</span>
                                </div>
                                <div className="flex gap-2 flex-wrap">
                                    <span className="bg-[#1C1730] text-xs font-bold font-inter px-2 py-1 rounded border border-[#C8A24D]/30 uppercase tracking-widest">{selectedTrackingMember.status || 'Regular'}</span>
                                    {selectedTrackingMember.occupation && <span className="bg-[#1C1730] text-xs font-bold font-inter px-2 py-1 rounded border border-[#C8A24D]/30 uppercase tracking-widest">{selectedTrackingMember.occupation}</span>}
                                    {selectedTrackingMember.gender && <span className="bg-[#1C1730] text-xs font-bold font-inter px-2 py-1 rounded border border-[#C8A24D]/30 uppercase tracking-widest">{selectedTrackingMember.gender}</span>}
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="bg-[#1C1730] px-4 py-2 rounded border border-[#C8A24D]/30 text-center min-w-[100px]">
                                <div className="text-[9px] font-bold font-inter uppercase tracking-widest text-[#C8A24D]">Sundays</div>
                                <div className="text-xl font-plex font-bold">{trackingSundayHistory.length}</div>
                            </div>
                            <div className="bg-[#1C1730] px-4 py-2 rounded border border-[#C8A24D]/30 text-center min-w-[100px]">
                                <div className="text-[9px] font-bold font-inter uppercase tracking-widest text-[#C8A24D]">Mid-Week</div>
                                <div className="text-xl font-plex font-bold">{trackingMidweekHistory.length}</div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-white border border-[#C8A24D]/30 rounded-xl overflow-hidden shadow-sm">
                            <div className="bg-[#0B1330] p-4 font-bold font-inter text-[#C8A24D] uppercase tracking-widest text-xs flex justify-between">
                                <span>Sunday Service Log</span>
                                <span className="font-plex opacity-80">{trackingSundayHistory.length} Attended</span>
                            </div>
                            <div className="p-0 max-h-[300px] overflow-y-auto divide-y divide-[#C8A24D]/10">
                                {trackingSundayHistory.length === 0 ? (
                                    <div className="p-8 text-center text-[#1C1730]/50 font-plex italic">No Sunday check-ins recorded.</div>
                                ) : (
                                    trackingSundayHistory.map((record, i) => (
                                        <div key={i} className="p-4 hover:bg-[#C8A24D]/5 transition-colors flex items-center gap-3">
                                            <CheckSquare size={16} className="text-[#C8A24D]"/>
                                            <span className="font-bold font-inter text-[#1C1730]">{new Date(record.service_date).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        <div className="bg-white border border-[#C8A24D]/30 rounded-xl overflow-hidden shadow-sm">
                            <div className="bg-[#2F1B4D] p-4 font-bold font-inter text-[#F6F1E4] uppercase tracking-widest text-xs flex justify-between">
                                <span>Mid-Week Cell Log</span>
                                <span className="font-plex opacity-80">{trackingMidweekHistory.length} Led/Attended</span>
                            </div>
                            <div className="p-0 max-h-[300px] overflow-y-auto divide-y divide-[#C8A24D]/10">
                                {trackingMidweekHistory.length === 0 ? (
                                    <div className="p-8 text-center text-[#1C1730]/50 font-plex italic">No mid-week cell reports found for this name.</div>
                                ) : (
                                    trackingMidweekHistory.map((record, i) => (
                                        <div key={i} className="p-4 hover:bg-[#C8A24D]/5 transition-colors flex flex-col gap-0.5">
                                            <div className="flex items-center gap-3">
                                                <Home size={16} className="text-[#C8A24D]"/>
                                                <span className="font-bold font-inter text-[#1C1730]">{new Date(record.meeting_date).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</span>
                                            </div>
                                            <span className="text-xs font-plex text-[#1C1730]/60 pl-7">{record.cell_name}</span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
          </div>
        )}

        {!isCellLeader && activeView === 'tasks' && isAdmin && (
            <div className="max-w-6xl mx-auto space-y-6 relative z-10">
                <button onClick={() => setActiveView('dashboard')} className="flex items-center gap-2 text-sm font-bold font-inter text-[#0B1330] hover:text-[#C8A24D] transition-colors"><ArrowLeft size={16} /> Back to Dashboard</button>
                <div className="bg-[#2F1B4D] p-8 rounded-xl shadow-xl border border-[#C8A24D]/40 text-[#F6F1E4] flex flex-col sm:flex-row items-center justify-between gap-6">
                    <div>
                        <h2 className="text-4xl font-cormorant font-bold flex items-center gap-3 tracking-wide"><ShieldCheck className="text-[#C8A24D]" size={36}/> Pastoral Command Center</h2>
                    </div>
                    <div className="flex gap-4">
                        <button onClick={handleGenerateMondayReport} disabled={isSubmitting} className="flex items-center gap-2 bg-[#0B1330] hover:bg-[#1C1730] border border-[#C8A24D] text-[#C8A24D] px-5 py-3 rounded-lg font-bold text-sm font-inter transition-colors shadow-lg">
                            <FileText size={18} /> Generate Monday Report
                        </button>
                        <div className="bg-[#1C1730] border border-[#C8A24D]/50 px-6 py-2 rounded-lg text-center shadow-inner">
                            <div className="text-2xl font-plex font-bold text-[#C8A24D]">{crmTasks.length}</div>
                        </div>
                    </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-6">
                        <div className="bg-[#F6F1E4] border border-[#C8A24D]/30 rounded-xl p-6 shadow-sm">
                            <h3 className="text-2xl font-cormorant font-bold text-[#0B1330] mb-4 flex items-center gap-2"><Gift size={22} className="text-[#C8A24D]"/> Today's Birthdays</h3>
                            {birthdaysToday.length === 0 ? <p className="text-[#1C1730]/50 text-sm font-inter font-bold italic">No birthdays today.</p> : birthdaysToday.map((p, i) => (
                                <div key={i} className="bg-white p-4 rounded-lg border border-[#C8A24D]/20 flex justify-between items-center mb-3 shadow-sm flex-wrap gap-2">
                                    <span className="font-bold text-[#1C1730] font-inter text-lg">{p.full_name}</span>
                                    <div className="flex gap-1.5">
                                        <button onClick={() => handleSendMessage(p.phone_number, p.full_name, 'whatsapp', 'birthday')} className="text-xs font-bold font-inter bg-[#0B1330] text-[#F6F1E4] px-2.5 py-1.5 rounded hover:bg-[#2F1B4D] transition-colors shadow">WA</button>
                                        <button onClick={() => handleSendMessage(p.phone_number, p.full_name, 'sms', 'birthday')} className="text-xs font-bold font-inter bg-transparent border border-[#0B1330]/30 text-[#0B1330] px-2.5 py-1.5 rounded hover:bg-[#0B1330]/5 transition-colors shadow">SMS</button>
                                        <button onClick={() => handleSendMessage(p.phone_number, p.full_name, 'call')} className="text-xs font-bold font-inter bg-[#C8A24D] text-[#0B1330] px-2.5 py-1.5 rounded hover:bg-[#b59040] transition-colors shadow">Call</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="bg-[#F6F1E4] border border-[#C8A24D]/30 rounded-xl p-6 shadow-sm">
                            <h3 className="text-2xl font-cormorant font-bold text-[#0B1330] mb-4 flex items-center gap-2"><Sparkles size={22} className="text-[#C8A24D]"/> New Guests Follow-Up</h3>
                            {guestTasks.length === 0 ? <p className="text-[#1C1730]/50 text-sm font-inter font-bold italic">Queue cleared.</p> : guestTasks.map((t, i) => (
                                <div key={i} className="bg-white p-4 rounded-lg border border-[#C8A24D]/20 flex justify-between items-center mb-3 shadow-sm flex-wrap gap-2">
                                    <div>
                                        <span className="font-bold text-[#1C1730] font-inter text-lg">{t.member.full_name}</span>
                                        <p className="text-xs text-[#1C1730]/60 font-plex mt-1">{t.type}</p>
                                    </div>
                                    <div className="flex gap-1.5">
                                        <button onClick={() => handleSendMessage(t.member.phone_number, t.member.full_name, 'whatsapp', t.msgTemplate)} className="bg-[#0B1330] text-[#F6F1E4] p-2 rounded hover:bg-[#2F1B4D] transition-colors shadow"><MessageCircle size={14}/></button>
                                        <button onClick={() => handleSendMessage(t.member.phone_number, t.member.full_name, 'sms', t.msgTemplate)} className="bg-transparent border border-[#0B1330]/30 text-[#0B1330] p-2 rounded hover:bg-[#0B1330]/5 transition-colors shadow"><MessageSquare size={14}/></button>
                                        <button onClick={() => handleSendMessage(t.member.phone_number, t.member.full_name, 'call')} className="bg-[#C8A24D] text-[#0B1330] p-2 rounded hover:bg-[#b59040] transition-colors shadow"><Phone size={14}/></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="space-y-6">
                        <div className="bg-[#F6F1E4] border border-[#6E1E2B]/30 rounded-xl p-6 shadow-sm relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-1 h-full bg-[#6E1E2B]"></div>
                            <h3 className="text-2xl font-cormorant font-bold text-[#6E1E2B] mb-4 flex items-center gap-2"><UserMinus size={22}/> Urgent: Missing Members</h3>
                            {urgentMissingTasks.length === 0 ? <p className="text-[#1C1730]/50 text-sm font-inter font-bold italic">No critical absences detected.</p> : urgentMissingTasks.map((t, i) => (
                                <div key={i} className="bg-white p-4 rounded-lg border border-[#6E1E2B]/20 flex justify-between items-center mb-3 shadow-sm flex-wrap gap-2">
                                    <div>
                                        <span className="font-bold text-[#1C1730] font-inter text-lg">{t.member.full_name}</span>
                                        <p className="text-xs text-[#6E1E2B] font-inter font-bold mt-1">{t.description}</p>
                                    </div>
                                    <div className="flex gap-1.5">
                                        <button onClick={() => handleSendMessage(t.member.phone_number, t.member.full_name, 'whatsapp', t.msgTemplate)} className="bg-[#6E1E2B] text-[#F6F1E4] p-2 rounded hover:bg-[#0B1330] transition-colors shadow"><MessageCircle size={14}/></button>
                                        <button onClick={() => handleSendMessage(t.member.phone_number, t.member.full_name, 'sms', t.msgTemplate)} className="bg-transparent border border-[#6E1E2B]/30 text-[#6E1E2B] p-2 rounded hover:bg-[#6E1E2B]/5 transition-colors shadow"><MessageSquare size={14}/></button>
                                        <button onClick={() => handleSendMessage(t.member.phone_number, t.member.full_name, 'call')} className="bg-[#C8A24D] text-[#0B1330] p-2 rounded hover:bg-[#b59040] transition-colors shadow"><Phone size={14}/></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        )}

        {!isCellLeader && activeView === 'bulk' && isAdmin && (
            <div className="max-w-4xl mx-auto relative z-10">
                <button onClick={() => { setActiveView('dashboard'); setBulkQueue([]); }} className="flex items-center gap-2 text-sm font-bold font-inter text-[#0B1330] hover:text-[#C8A24D] mb-6 transition-colors"><ArrowLeft size={16} /> Back to Dashboard</button>
                <div className="bg-[#0B1330] text-[#F6F1E4] p-8 rounded-t-2xl border-b border-[#C8A24D]">
                    <h2 className="text-4xl font-cormorant font-bold flex items-center gap-3"><Share2 className="text-[#C8A24D]"/> Bulk Broadcast Engine</h2>
                </div>
                <div className="bg-[#F6F1E4] p-8 rounded-b-2xl shadow-xl border border-t-0 border-[#C8A24D]/30">
                    {bulkQueue.length > 0 ? (
                        <div className="bg-white p-8 rounded-xl border border-[#C8A24D] shadow-inner">
                            <div className="flex justify-between items-start mb-8">
                                <div><h3 className="text-2xl font-cormorant font-bold text-[#0B1330] flex items-center gap-2"><MessageCircle className="text-[#C8A24D]" /> WhatsApp Queue Active</h3></div>
                                <div className="bg-[#0B1330] text-[#C8A24D] font-plex font-bold px-4 py-2 rounded shadow">{bulkQueueIndex} / {bulkQueue.length}</div>
                            </div>
                            {bulkQueueIndex < bulkQueue.length ? (
                                <div className="text-center py-6">
                                    <p className="text-[#1C1730]/50 font-bold font-inter uppercase text-sm mb-2 tracking-widest">Up Next:</p>
                                    <p className="text-4xl font-cormorant font-bold text-[#0B1330] mb-8">{bulkQueue[bulkQueueIndex].name}</p>
                                    <div className="flex flex-col sm:flex-row justify-center gap-4">
                                        <button onClick={sendNextInQueue} className="bg-[#C8A24D] text-[#0B1330] px-8 py-4 rounded font-bold font-inter hover:bg-[#b59040] shadow-lg transition-colors flex items-center justify-center gap-2 tracking-wide">Send & Load Next &rarr;</button>
                                        <button onClick={() => setBulkQueue([])} className="bg-transparent text-[#6E1E2B] border-2 border-[#6E1E2B] px-8 py-4 rounded font-bold font-inter hover:bg-[#6E1E2B]/10 transition-colors tracking-wide">Cancel Queue</button>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-10">
                                    <div className="text-5xl mb-4 text-[#C8A24D]">◆</div>
                                    <h3 className="text-3xl font-cormorant font-bold text-[#0B1330] mb-2">Broadcast Complete!</h3>
                                    <p className="text-[#1C1730]/70 font-inter mb-8">All {bulkQueue.length} messages have been delivered.</p>
                                    <button onClick={() => setBulkQueue([])} className="bg-[#0B1330] text-[#C8A24D] px-8 py-3 rounded font-bold font-inter hover:bg-[#2F1B4D] shadow">Start New Broadcast</button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-8 max-w-2xl">
                            <div>
                                <label className="block text-sm font-bold font-inter text-[#0B1330] mb-3 uppercase tracking-widest">Target Segment</label>
                                <div className="flex flex-wrap gap-4">
                                    {['Student', 'Men', 'Women', 'Present', 'Absent'].map(group => (
                                        <label key={group} className={`flex items-center justify-center gap-2 border-2 px-6 py-4 rounded cursor-pointer select-none flex-1 min-w-[140px] transition-all ${bulkGroup === group ? 'border-[#C8A24D] bg-[#0B1330] text-[#C8A24D]' : 'border-[#C8A24D]/30 bg-white text-[#1C1730] hover:border-[#C8A24D]/60'}`}>
                                            <input type="radio" checked={bulkGroup === group} onChange={() => {
                                                setBulkGroup(group); 
                                                if(group === 'Student') setBulkText(TEMPLATES.bulk_student);
                                                else if(group === 'Men') setBulkText(TEMPLATES.bulk_men);
                                                else if(group === 'Women') setBulkText("Greetings Women of Grace! This is a special update regarding our upcoming gathering.");
                                                else if(group === 'Present') setBulkText(TEMPLATES.bulk_present);
                                                else if(group === 'Absent') setBulkText(TEMPLATES.bulk_absent);
                                            }} className="hidden" />
                                            <span className="font-bold font-inter whitespace-nowrap">{group}</span>
                                        </label>
                                    ))}
                                </div>

                                {['Present', 'Absent'].includes(bulkGroup) && (
                                    <div className="mt-4 p-4 bg-[#C8A24D]/10 border border-[#C8A24D]/30 rounded-lg flex items-center gap-4">
                                        <CalendarDays className="text-[#0B1330]" size={24} />
                                        <div className="flex-1">
                                            <label className="block text-xs font-bold font-inter uppercase tracking-widest text-[#1C1730]/70 mb-1">Target Service Date</label>
                                            <input type="date" value={bulkDate} onChange={(e) => setBulkDate(e.target.value)} className="w-full bg-white border border-[#C8A24D]/40 rounded p-2 text-[#1C1730] font-inter outline-none focus:border-[#C8A24D] focus:ring-1 focus:ring-[#C8A24D] shadow-inner" />
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-bold font-inter text-[#0B1330] mb-1 uppercase tracking-widest">Announcement Script</label>
                                <textarea rows={6} value={bulkText} onChange={(e) => setBulkText(e.target.value)} className="w-full bg-white border border-[#C8A24D]/40 rounded-md p-4 font-inter text-[#1C1730] outline-none focus:border-[#C8A24D] focus:ring-1 focus:ring-[#C8A24D] shadow-inner" />
                            </div>
                            <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-[#C8A24D]/20">
                                <button onClick={prepareBulkQueue} disabled={isSubmitting} className="flex-1 bg-[#C8A24D] text-[#0B1330] font-bold font-inter tracking-wide py-4 rounded shadow-lg hover:bg-[#b59040] flex items-center justify-center gap-2 transition-colors disabled:opacity-50">{isSubmitting ? 'Processing...' : <><MessageCircle size={22}/> Start WhatsApp Queue</>}</button>
                                <button onClick={handleSendBulkSMS} disabled={isSubmitting} className="flex-1 bg-[#0B1330] text-[#C8A24D] font-bold font-inter tracking-wide py-4 rounded shadow-lg hover:bg-[#2F1B4D] flex items-center justify-center gap-2 transition-colors disabled:opacity-50 border border-[#C8A24D]/50"><MessageSquare size={22}/> Send Bulk SMS</button>
                                <button onClick={handleSendBulkEmail} disabled={isSubmitting} className="flex-1 bg-white text-[#0B1330] font-bold font-inter tracking-wide py-4 rounded shadow-lg hover:bg-[#0B1330]/5 flex items-center justify-center gap-2 transition-colors disabled:opacity-50 border border-[#C8A24D]/50"><Mail size={22}/> Send Bulk Email</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        )}

        {!isCellLeader && activeView === 'analytics' && isAdmin && (
          <div className="max-w-6xl mx-auto space-y-6 relative z-10">
            <button onClick={() => setActiveView('dashboard')} className="flex items-center gap-2 text-sm font-bold font-inter text-[#0B1330] hover:text-[#C8A24D] transition-colors"><ArrowLeft size={16} /> Back to Dashboard</button>
            <div className="bg-[#0B1330] p-8 rounded-xl shadow-xl border border-[#C8A24D]/40 text-[#F6F1E4] flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div><h2 className="text-4xl font-cormorant font-bold mb-2 flex items-center gap-3"><TrendingUp size={36} className="text-[#C8A24D]"/> Central Analytics Hub</h2></div>
                <div className="flex bg-[#1C1730] p-1 rounded border border-[#C8A24D]/30 shadow-inner">
                    <button onClick={() => setAnalyticsTab('service')} className={`px-6 py-2 rounded font-bold font-inter text-sm tracking-wide transition-all ${analyticsTab === 'service' ? 'bg-[#C8A24D] text-[#0B1330]' : 'text-[#C8A24D] hover:text-[#F6F1E4]'}`}>Sunday Services</button>
                    <button onClick={() => setAnalyticsTab('cells')} className={`px-6 py-2 rounded font-bold font-inter text-sm tracking-wide transition-all ${analyticsTab === 'cells' ? 'bg-[#C8A24D] text-[#0B1330]' : 'text-[#C8A24D] hover:text-[#F6F1E4]'}`}>Cell Groups</button>
                </div>
            </div>
            {analyticsTab === 'service' && (
                <>
                    <div className="bg-[#F6F1E4] p-8 rounded-xl shadow-sm border border-[#C8A24D]/30">
                        <h3 className="text-2xl font-cormorant font-bold text-[#0B1330] mb-8 border-b-2 border-[#C8A24D]/20 pb-4">Monthly Service Growth</h3>
                        {monthlyChartData.length === 0 ? (<div className="text-center p-12 text-[#1C1730]/50 font-plex italic">No data yet.</div>) : (
                            <div className="flex items-end gap-2 md:gap-6 h-64 mt-8 pb-4 border-b border-[#0B1330]/10 overflow-x-auto">
                                {monthlyChartData.map((data, idx) => {
                                    const barHeight = Math.max((data.total / maxMonthlyTotal) * 100, 5);
                                    const isSelected = selectedMonthData?.monthName === data.monthName;
                                    return (
                                        <div key={idx} onClick={() => setSelectedMonthData(data)} className="flex flex-col items-center flex-1 min-w-[60px] group cursor-pointer">
                                            <span className={`text-sm font-plex font-bold mb-2 transition-colors ${isSelected ? 'text-[#0B1330] scale-110' : 'text-[#1C1730]/40 group-hover:text-[#C8A24D]'}`}>{data.total}</span>
                                            <div style={{ height: `${barHeight}%` }} className={`w-full rounded-t-sm transition-all duration-300 ${isSelected ? 'bg-[#0B1330] shadow-lg' : 'bg-[#C8A24D]/60 group-hover:bg-[#C8A24D]'}`}></div>
                                            <span className={`text-xs mt-3 whitespace-nowrap font-inter font-bold uppercase tracking-widest ${isSelected ? 'text-[#0B1330]' : 'text-[#1C1730]/50'}`}>{data.monthName.split(' ')[0]}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-[#F6F1E4] rounded-xl shadow-sm border border-[#C8A24D]/30 overflow-hidden"><div className="bg-[#0B1330] p-5 border-b border-[#C8A24D]/40"><h3 className="text-xl font-cormorant font-bold text-[#C8A24D] flex items-center gap-2"><CalendarDays size={20}/> {selectedMonthData ? `Service Breakdown: ${selectedMonthData.monthName}` : 'Select a month above'}</h3></div><div className="p-0">{!selectedMonthData ? (<div className="p-12 text-center text-[#1C1730]/50 font-plex italic">Awaiting selection.</div>) : (<table className="w-full text-left border-collapse"><thead><tr className="bg-white border-b border-[#C8A24D]/20 text-xs font-inter uppercase tracking-widest text-[#1C1730]/60 font-bold"><th className="p-5">Date</th><th className="p-5">Attendance</th></tr></thead><tbody className="divide-y divide-[#C8A24D]/10">{Object.entries(selectedMonthData.services).sort().map(([date, count]: [string, any], idx) => (<tr key={idx} className="hover:bg-[#C8A24D]/5 transition-colors bg-[#F6F1E4]"><td className="p-5 font-bold font-inter text-[#1C1730]">{new Date(date).toLocaleDateString()}</td><td className="p-5 font-plex font-bold text-[#0B1330] text-lg">{count}</td></tr>))}<tr className="bg-[#C8A24D] text-[#0B1330] border-t-2 border-[#0B1330]"><td className="p-5 text-right font-inter font-bold uppercase tracking-widest text-xs">Total</td><td className="p-5 font-plex font-bold text-2xl">{selectedMonthData.total}</td></tr></tbody></table>)}</div></div>
                        <div className="bg-[#F6F1E4] rounded-xl shadow-sm border border-[#C8A24D]/30 overflow-hidden"><div className="bg-white p-5 border-b-2 border-[#C8A24D]/20"><h3 className="text-xl font-cormorant font-bold text-[#0B1330] flex items-center gap-2"><Users size={20} className="text-[#C8A24D]"/> Consistency Leaderboard</h3></div><div className="max-h-[400px] overflow-y-auto"><table className="w-full text-left border-collapse"><thead><tr className="bg-white border-b border-[#C8A24D]/20 text-xs font-inter uppercase tracking-widest text-[#1C1730]/60 font-bold sticky top-0 shadow-sm"><th className="p-5">Member</th><th className="p-5">Services Attended</th></tr></thead><tbody className="divide-y divide-[#C8A24D]/10 bg-[#F6F1E4]">{memberStats.length === 0 ? (<tr><td colSpan={2} className="p-8 text-center text-[#1C1730]/50 font-plex italic">No data acquired.</td></tr>) : (memberStats.map((member, idx) => (<tr key={idx} className="hover:bg-[#C8A24D]/5"><td className="p-5 font-bold font-inter text-[#1C1730] flex items-center gap-2">{idx < 3 && <span className="text-[#C8A24D]">◆</span>}{member.name}</td><td className="p-5 font-plex font-bold text-[#0B1330]">{member.count}</td></tr>)))}</tbody></table></div></div>
                    </div>
                </>
            )}
            {analyticsTab === 'cells' && (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                        <div className="bg-[#F6F1E4] p-6 rounded-xl border border-[#C8A24D]/30 shadow-sm flex items-center gap-5 border-l-4 border-l-[#0B1330]"><div className="bg-[#0B1330] p-4 rounded text-[#C8A24D]"><Users size={28}/></div><div><p className="text-[10px] text-[#1C1730]/60 font-bold font-inter uppercase tracking-widest">Average Cell Size</p><p className="text-4xl font-plex font-bold text-[#0B1330]">{cellStats.overallAvg}</p></div></div>
                        <div className="bg-[#F6F1E4] p-6 rounded-xl border border-[#C8A24D]/30 shadow-sm flex items-center gap-5 border-l-4 border-l-[#C8A24D]"><div className="bg-[#C8A24D] p-4 rounded text-[#0B1330] font-bold text-2xl font-plex">◆</div><div className="overflow-hidden"><p className="text-[10px] text-[#1C1730]/60 font-bold font-inter uppercase tracking-widest">Best Performing</p><p className="text-xl font-cormorant font-bold text-[#0B1330] truncate">{cellStats.bestCell}</p></div></div>
                        <div className="bg-[#F6F1E4] p-6 rounded-xl border border-[#C8A24D]/30 shadow-sm flex items-center gap-5 border-l-4 border-l-[#0B1330]"><div className="bg-[#0B1330] p-4 rounded text-[#C8A24D]"><Activity size={28}/></div><div className="overflow-hidden"><p className="text-[10px] text-[#1C1730]/60 font-bold font-inter uppercase tracking-widest">Fastest Growing</p><p className="text-xl font-cormorant font-bold text-[#0B1330] truncate">{cellStats.fastestGrowing}</p></div></div>
                    </div>
                    <div className="bg-[#F6F1E4] rounded-xl shadow-sm border border-[#C8A24D]/30 overflow-hidden"><div className="bg-[#0B1330] p-5 border-b border-[#C8A24D]/40"><h3 className="text-xl font-cormorant font-bold text-[#C8A24D] flex items-center gap-2"><Home size={20}/> Cell Group Leaderboard</h3></div><div className="overflow-x-auto"><table className="w-full text-left border-collapse"><thead><tr className="bg-white border-b border-[#C8A24D]/20 text-xs font-inter uppercase tracking-widest text-[#1C1730]/60 font-bold"><th className="p-5">Cell Name</th><th className="p-5">Avg Attendance</th><th className="p-5">Total Meetings</th><th className="p-5">Growth Trend</th></tr></thead><tbody className="divide-y divide-[#C8A24D]/10 bg-[#F6F1E4]">{cellStats.cellsArray.length === 0 ? (<tr><td colSpan={4} className="p-8 text-center text-[#1C1730]/50 font-plex italic">No cell groups found.</td></tr>) : (cellStats.cellsArray.map((cell: any, idx: number) => (<tr key={idx} className="hover:bg-[#C8A24D]/5 transition-colors"><td className="p-5 font-bold font-inter text-[#1C1730]">{cell.name}</td><td className="p-5 font-plex font-bold text-[#0B1330] text-lg">{cell.avg}</td><td className="p-5 font-plex text-[#1C1730]/70">{cell.count}</td><td className="p-5 font-plex font-bold">{cell.growth > 0 ? <span className="text-[#0B1330] flex items-center gap-1">+{cell.growth} <TrendingUp size={14} className="text-[#C8A24D]"/></span> : cell.growth < 0 ? <span className="text-[#6E1E2B]">{cell.growth}</span> : <span className="text-[#1C1730]/40">Stable</span>}</td></tr>)))}</tbody></table></div></div>
                </>
            )}
          </div>
        )}

        {!isCellLeader && activeView === 'absentees' && isAdmin && (
          <div className="max-w-6xl mx-auto space-y-6 relative z-10">
            <button onClick={() => setActiveView('dashboard')} className="flex items-center gap-2 text-sm font-bold font-inter text-[#0B1330] hover:text-[#C8A24D] transition-colors"><ArrowLeft size={16} /> Back to Dashboard</button>
            <div className="bg-[#F6F1E4] rounded-xl shadow-xl border border-[#C8A24D]/30 overflow-hidden">
                <div className="bg-[#0B1330] p-6 border-b-2 border-[#C8A24D]">
                    <h3 className="text-2xl font-cormorant font-bold text-[#F6F1E4] flex items-center gap-3"><UserMinus className="text-[#6E1E2B]"/> Smart Absentee Radar Triage</h3>
                </div>
                <div className="p-0 overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[600px]">
                        <thead><tr className="bg-white border-b border-[#C8A24D]/20 text-xs font-inter uppercase tracking-widest text-[#1C1730]/60 font-bold"><th className="p-5">Member</th><th className="p-5">Triage Status</th><th className="p-5">Missed Count</th><th className="p-5">Instant Vectors</th></tr></thead>
                        <tbody className="divide-y divide-[#C8A24D]/10 bg-[#F6F1E4]">
                            {absenteeList.map((person, idx) => (
                                <tr key={idx} className="hover:bg-white transition-colors">
                                    <td className="p-5 font-bold text-[#1C1730] font-inter text-lg">{person.full_name}</td>
                                    <td className="p-5"><span className={`px-3 py-1 text-[10px] font-bold uppercase tracking-widest border rounded ${person.colorClass}`}>{person.alertLevel}</span></td>
                                    <td className="p-5 font-plex font-bold text-[#0B1330] text-lg">{person.missedCount}</td>
                                    <td className="p-5">
                                        <div className="flex gap-2">
                                            <button onClick={() => handleSendMessage(person.phone_number, person.full_name, 'whatsapp', 'checking_in')} className="bg-[#0B1330] text-[#F6F1E4] px-3 py-2 rounded font-bold font-inter text-xs tracking-wide hover:bg-[#2F1B4D] shadow flex items-center gap-1"><MessageCircle size={14}/> WA</button>
                                            <button onClick={() => handleSendMessage(person.phone_number, person.full_name, 'sms', 'checking_in')} className="bg-transparent border border-[#0B1330]/30 text-[#0B1330] px-3 py-2 rounded font-bold font-inter text-xs tracking-wide hover:bg-[#0B1330]/5 shadow flex items-center gap-1"><MessageSquare size={14}/> SMS</button>
                                            <button onClick={() => handleSendMessage(person.phone_number, person.full_name, 'call')} className="bg-[#C8A24D] text-[#0B1330] px-3 py-2 rounded font-bold font-inter text-xs tracking-wide hover:bg-[#b59040] shadow flex items-center gap-1"><Phone size={14}/> Call</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
          </div>
        )}

        {!isCellLeader && activeView === 'birthdays' && isAdmin && (
          <div className="max-w-4xl mx-auto space-y-6 relative z-10">
            <button onClick={() => setActiveView('dashboard')} className="flex items-center gap-2 text-sm font-bold font-inter text-[#0B1330] hover:text-[#C8A24D] transition-colors"><ArrowLeft size={16} /> Back to Dashboard</button>
            <div className="bg-[#F6F1E4] rounded-xl shadow-xl border border-[#C8A24D]/30 overflow-hidden">
                <div className="bg-[#0B1330] p-6 border-b-2 border-[#C8A24D]">
                    <h3 className="text-2xl font-cormorant font-bold text-[#F6F1E4] flex items-center gap-3"><Gift className="text-[#C8A24D]"/> Birthday Dashboard</h3>
                </div>
                <div className="p-4 bg-white/50 border-b border-[#C8A24D]/20">
                    <h4 className="font-bold text-[#1C1730] font-inter tracking-widest uppercase text-xs">Today's Birthdays</h4>
                </div>
                <div className="bg-[#F6F1E4]">
                    {birthdaysToday.length === 0 ? <div className="p-6 text-center font-plex text-[#1C1730]/50 italic">None logged.</div> : birthdaysToday.map((p, idx) => <BirthdayRow key={idx} person={p} />)}
                </div>
                
                <div className="p-4 bg-white/50 border-b border-[#C8A24D]/20 border-t border-[#C8A24D]/40">
                    <h4 className="font-bold text-[#1C1730] font-inter tracking-widest uppercase text-xs">This Week's Birthdays</h4>
                </div>
                <div className="bg-[#F6F1E4]">
                    {birthdaysWeek.length === 0 ? <div className="p-6 text-center font-plex text-[#1C1730]/50 italic">None logged.</div> : birthdaysWeek.map((p, idx) => <BirthdayRow key={idx} person={p} />)}
                </div>
            </div>
          </div>
        )}

        {!isCellLeader && activeView === 'guests' && isAdmin && (
          <div className="max-w-6xl mx-auto space-y-6 relative z-10">
            <button onClick={() => setActiveView('dashboard')} className="flex items-center gap-2 text-sm font-bold font-inter text-[#0B1330] hover:text-[#C8A24D] transition-colors"><ArrowLeft size={16} /> Back to Dashboard</button>
            <div className="bg-[#F6F1E4] rounded-xl shadow-xl border border-[#C8A24D]/30 overflow-hidden">
                <div className="bg-[#0B1330] p-6 border-b-2 border-[#C8A24D]">
                    <h3 className="text-2xl font-cormorant font-bold text-[#F6F1E4] flex items-center gap-3"><ClipboardList className="text-[#C8A24D]"/> Guest Follow-Up Roster</h3>
                </div>
                <div className="p-0 overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[600px]">
                        <thead><tr className="bg-white border-b border-[#C8A24D]/20 text-xs font-inter uppercase tracking-widest text-[#1C1730]/60 font-bold"><th className="p-5">Member</th><th className="p-5">Status</th><th className="p-5">Visit Timeline</th><th className="p-5">Phone</th><th className="p-5">Instant Vectors</th></tr></thead>
                        <tbody className="divide-y divide-[#C8A24D]/10 bg-[#F6F1E4]">
                            {guestList.map((g, i) => (
                                <tr key={i} className="hover:bg-white transition-colors">
                                    <td className="p-5 font-bold text-[#1C1730] font-inter text-lg">{g.full_name}</td>
                                    <td className="p-5 font-inter text-sm text-[#0B1330] font-bold">{g.status}</td>
                                    <td className="p-5">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-xs font-bold font-inter text-[#1C1730]">1st: {g.firstVisit ? new Date(g.firstVisit).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric'}) : 'Unlogged'}</span>
                                            {g.status === '2nd Timer' && <span className="text-xs font-bold font-inter text-[#C8A24D]">2nd: {g.secondVisit ? new Date(g.secondVisit).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric'}) : 'Unlogged'}</span>}
                                        </div>
                                    </td>
                                    <td className="p-5 font-plex text-[#1C1730]">{g.phone_number || 'N/A'}</td>
                                    <td className="p-5">
                                        <div className="flex gap-2">
                                            <button onClick={() => handleSendMessage(g.phone_number, g.full_name, 'whatsapp', 'welcome')} className="bg-[#0B1330] text-[#F6F1E4] px-3 py-2 rounded font-bold font-inter text-xs tracking-wide hover:bg-[#2F1B4D] shadow flex items-center gap-1"><MessageCircle size={14}/> WA</button>
                                            <button onClick={() => handleSendMessage(g.phone_number, g.full_name, 'sms', 'welcome')} className="bg-transparent border border-[#0B1330]/30 text-[#0B1330] px-3 py-2 rounded font-bold font-inter text-xs tracking-wide hover:bg-[#0B1330]/5 shadow flex items-center gap-1"><MessageSquare size={14}/> SMS</button>
                                            <button onClick={() => handleSendMessage(g.phone_number, g.full_name, 'call')} className="bg-[#C8A24D] text-[#0B1330] px-3 py-2 rounded font-bold font-inter text-xs tracking-wide hover:bg-[#b59040] shadow flex items-center gap-1"><Phone size={14}/> Call</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

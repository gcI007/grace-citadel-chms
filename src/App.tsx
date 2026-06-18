/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  CalendarDays, 
  MessageSquare, 
  Database, 
  Plus, 
  Search, 
  Sparkles, 
  SlidersHorizontal, 
  UserPlus, 
  CheckCircle, 
  Clock, 
  Mail, 
  UserCheck, 
  ArrowRight, 
  RotateCcw, 
  Calendar, 
  Check, 
  AlertCircle, 
  ChevronRight, 
  BookOpen, 
  Smartphone, 
  Send,
  Cake,
  Activity,
  Code
} from 'lucide-react';
import { Member, ChurchService, Attendance, CommunicationLog } from './types.js';

export default function App() {
  // This variable points your app to the live server
  const API_BASE = import.meta.env.VITE_BACKEND_URL || '';

  // DB State from API
  const [members, setMembers] = useState<Member[]>([]);
  const [services, setServices] = useState<ChurchService[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [communications, setCommunications] = useState<CommunicationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Active Tab
  const [activeTab, setActiveTab] = useState<'dashboard' | 'members' | 'services' | 'outreach' | 'sql'>('dashboard');

  // Search & Filters for Members Directory
  const [searchQuery, setSearchQuery] = useState('');
  const [memberFilter, setMemberFilter] = useState<'all' | 'students' | 'first_timers' | 'regular'>('all');

  // Active Service for Attendance Check-in
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');

  // New Member Form State
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMember, setNewMember] = useState({
    name: '',
    email: '',
    phone: '',
    birthday: '',
    student_status: false,
    first_timer: true,
    address: '',
    notes: ''
  });

  // New Service Form State
  const [showAddService, setShowAddService] = useState(false);
  const [newService, setNewService] = useState({
    name: '',
    date: '',
    time: '',
    theme: ''
  });

  // Outreach builder state
  const [campaignTarget, setCampaignTarget] = useState<'all' | 'students' | 'first_timers' | 'missed_last_service' | 'upcoming_birthdays'>('first_timers');
  const [campaignType, setCampaignType] = useState<'sms' | 'email'>('sms');
  const [campaignGateway, setCampaignGateway] = useState<'twilio' | 'africas_talking' | 'sendgrid' | 'mailgun'>('twilio');
  const [campaignText, setCampaignText] = useState('');
  const [isDraftingAI, setIsDraftingAI] = useState(false);
  const [aiResultObj, setAiResultObj] = useState<string>('');
  const [selectedMemberForAI, setSelectedMemberForAI] = useState<string>('');

  // SQL Playground Query State
  const [selectedSqlQuery, setSelectedSqlQuery] = useState<'missed_last' | 'second_timers' | 'first_timers' | 'students' | 'birthday_order'>('missed_last');

  // Fetch Database State
  const fetchState = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const response = await fetch(API_BASE + '/api/state');
      if (!response.ok) {
        throw new Error('Failed to retrieve system database status');
      }
      const data = await response.json();
      setMembers(data.members || []);
      setServices(data.services || []);
      setAttendance(data.attendance || []);
      setCommunications(data.communications || []);

      // Select latest service by default (sorted by date desc)
      if (data.services && data.services.length > 0) {
        const sorted = [...data.services].sort((a, b) => b.date.localeCompare(a.date));
        setSelectedServiceId(sorted[0].id);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Connecting to backend store failed.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchState();
  }, []);

  // Soft Reset DB State to original seeds
  const handleResetDb = async () => {
    if (!window.confirm("Are you sure you want to reset the database state to its original seeds? All changes will be restored.")) {
      return;
    }
    try {
      setLoading(true);
      const res = await fetch(API_BASE + '/api/reset', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setMembers(data.state.members);
        setServices(data.state.services);
        setAttendance(data.state.attendance);
        setCommunications(data.state.communications);
        if (data.state.services && data.state.services.length > 0) {
          const sorted = [...data.state.services].sort((a, b) => b.date.localeCompare(a.date));
          setSelectedServiceId(sorted[0].id);
        }
      }
    } catch (err: any) {
      alert(`Resetting failed: ${err.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  // Create new member Action
  const handleCreateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMember.name || !newMember.email) {
      alert('Name and Email are required.');
      return;
    }
    try {
      const res = await fetch(API_BASE + '/api/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMember)
      });
      const data = await res.json();
      if (data.success) {
        setMembers(data.state.members);
        setCommunications(data.state.communications);
        setShowAddMember(false);
        setNewMember({
          name: '',
          email: '',
          phone: '',
          birthday: '',
          student_status: false,
          first_timer: true,
          address: '',
          notes: ''
        });
        alert(`Welcome Campaign automatic trigger! Welcome SMS and Email pre-sent to ${data.member.name}.`);
      } else {
        alert(data.error || 'Failed to register member');
      }
    } catch (err: any) {
      alert(`Error registering member: ${err.message}`);
    }
  };

  // Toggle First Timer state
  const handleToggleFirstTimer = async (memberId: string, current: boolean) => {
    try {
      const res = await fetch(API_BASE + `/api/members/${memberId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ first_timer: !current })
      });
      const data = await res.json();
      if (data.success) {
        setMembers(data.state.members);
      }
    } catch (err: any) {
      alert('Update failed');
    }
  };

  // Create new service Action
  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newService.name || !newService.date || !newService.time) {
      alert('Service Name, Date, and Time are required.');
      return;
    }
    try {
      const res = await fetch(API_BASE + '/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newService)
      });
      const data = await res.json();
      if (data.success) {
        setServices(data.state.services);
        setAttendance(data.state.attendance);
        setShowAddService(false);
        setSelectedServiceId(data.service.id);
        setNewService({ name: '', date: '', time: '', theme: '' });
      }
    } catch (err: any) {
      alert(`Error creating service: ${err.message}`);
    }
  };

  // Record/toggle attendance on click
  const handleToggleAttendance = async (mId: string, sId: string, currentStatus: 'present' | 'absent' | 'excused') => {
    const nextStatus = currentStatus === 'present' ? 'absent' : 'present';
    try {
      const res = await fetch(API_BASE + '/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          member_id: mId,
          service_id: sId,
          status: nextStatus
        })
      });
      const data = await res.json();
      if (data.success) {
        setAttendance(data.state.attendance);
      }
    } catch (err) {
      alert('Error updating attendance status');
    }
  };

  // Generate Personalized Reach message with AI (Gemini!)
  const handleDraftWithGemini = async () => {
    if (!selectedMemberForAI) {
      alert('Please select a member first to provide personal outreach context.');
      return;
    }
    setIsDraftingAI(true);
    setAiResultObj('');
    const targetMember = members.find(m => m.id === selectedMemberForAI);

    try {
      let contextType: 'welcome' | 'missed' | 'birthday' | 'general' = 'general';
      if (campaignTarget === 'first_timers') contextType = 'welcome';
      else if (campaignTarget === 'missed_last_service') contextType = 'missed';
      else if (campaignTarget === 'upcoming_birthdays') contextType = 'birthday';

      const res = await fetch(API_BASE + '/api/generate-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId: selectedMemberForAI,
          contextType
        })
      });

      const data = await res.json();
      if (data.success) {
        setCampaignText(data.message);
        setAiResultObj(`Successfully processed ${targetMember?.name}'s personalized campaign draft!`);
      } else {
        throw new Error(data.error || 'Unknown server generation warning.');
      }
    } catch (error: any) {
      console.error(error);
      const fallbackTemplates = {
        first_timers: `Welcome {{name}} to Grace Citadel! ✨ We are so glad you worshipped with us. We would relly love to connect with you & see you again. Have a blessed day!`,
        missed_last_service: `Hi {{name}},We missed seeing you and we just want you to know. We hope you are doing great! Let us know if anything is up. GCI Care Team`,
        upcoming_birthdays: `Happy Birthday {{name}}! 🎉 May your day be filled with immense joy, peace, and love. We are so incredibly grateful to have you as part of the family!`,
        students: `Hi {{name}}, just reaching out to check on your campus journey. We're praying for your exams and hope to connect at student midweek! 📚`,
        all: `Hi {{name}}, we're so glad you're part of Grace Citadel. Hope you have a wonderful and blessed week!`
      };
      
      const template = fallbackTemplates[campaignTarget] || fallbackTemplates.all;
      const formatted = template.replace('{{name}}', targetMember?.name || 'Friend');
      setCampaignText(formatted);
      setAiResultObj(`System template fallback. (Real AI generation is accessible with active GEMINI_API_KEY).`);
    } finally {
      setIsDraftingAI(false);
    }
  };

  // Launch simulated broadcast campaign
  const handleSendCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetedMembers = queryResultIds;
    if (targetedMembers.length === 0) {
      alert('No members fall into the current selected query target segment.');
      return;
    }
    if (!campaignText) {
      alert('Campaign message body is empty.');
      return;
    }

    try {
      const res = await fetch(API_BASE + '/api/send-campaign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          member_ids: targetedMembers,
          type: campaignType,
          campaign_type: campaignTarget === 'upcoming_birthdays' ? 'birthday' : campaignTarget === 'missed_last_service' ? 'missed' : campaignTarget === 'first_timers' ? 'welcome' : 'custom',
          message: campaignText
        })
      });
      const data = await res.json();
      if (data.success) {
        setCommunications(data.state.communications);
        alert(`Broadcast successfully dispatched. Powered by ${campaignGateway.toUpperCase()}! Centered towards ${targetedMembers.length} segments. Check 'Communication Trails Log' below.`);
        setCampaignText('');
        setAiResultObj('');
      }
    } catch (err) {
      alert('Campaign broadcast failed.');
    }
  };

  // ================= SEGMENTED SQL & LOGIC COMPUTATION =================

  const latestService = useMemo(() => {
    if (services.length === 0) return null;
    return [...services].sort((a,b) => b.date.localeCompare(a.date))[0];
  }, [services]);

  const membersWhoMissedLastService = useMemo(() => {
    if (!latestService) return [];
    const presentIds = attendance
      .filter(a => a.service_id === latestService.id && a.status === 'present')
      .map(a => a.member_id);
    
    return members.filter(m => !presentIds.includes(m.id));
  }, [members, attendance, latestService]);

  const secondTimers = useMemo(() => {
    const presentCounts: Record<string, number> = {};
    attendance.forEach(a => {
      if (a.status === 'present') {
        presentCounts[a.member_id] = (presentCounts[a.member_id] || 0) + 1;
      }
    });

    return members.filter(m => presentCounts[m.id] === 2);
  }, [members, attendance]);

  const firstTimerMembers = useMemo(() => {
    return members.filter(m => m.first_timer);
  }, [members]);

  const studentMembers = useMemo(() => {
    return members.filter(m => m.student_status);
  }, [members]);

  const sortedBirthdays = useMemo(() => {
    return [...members].sort((a, b) => {
      if (!a.birthday) return 1;
      if (!b.birthday) return -1;
      const getMonthAndDay = (dateStr: string) => {
        const parts = dateStr.split('-');
        if (parts.length < 3) return { month: 99, day: 99 };
        return { month: parseInt(parts[1], 10), day: parseInt(parts[2], 10) };
      };
      
      const valA = getMonthAndDay(a.birthday);
      const valB = getMonthAndDay(b.birthday);
      
      if (valA.month !== valB.month) {
        return valA.month - valB.month;
      }
      return valA.day - valB.day;
    });
  }, [members]);

  const queryResultIds = useMemo(() => {
    let list: Member[] = [];
    if (campaignTarget === 'first_timers') list = firstTimerMembers;
    else if (campaignTarget === 'students') list = studentMembers;
    else if (campaignTarget === 'missed_last_service') list = membersWhoMissedLastService;
    else if (campaignTarget === 'upcoming_birthdays') list = sortedBirthdays.filter(m => m.birthday);
    else list = members;

    return list.map(m => m.id);
  }, [campaignTarget, members, firstTimerMembers, studentMembers, membersWhoMissedLastService, sortedBirthdays]);

  const filteredMembers = useMemo(() => {
    return members.filter(m => {
      const matchSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          m.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          m.phone.includes(searchQuery);
      
      if (memberFilter === 'students') return matchSearch && m.student_status;
      if (memberFilter === 'first_timers') return matchSearch && m.first_timer;
      if (memberFilter === 'regular') return matchSearch && !m.first_timer;
      return matchSearch;
    });
  }, [members, searchQuery, memberFilter]);


  // ================= SQL PLAYGROUND QUERIES EXPLANATIONS =================
  const sqlMetadata = {
    missed_last: {
      sql: `SELECT m.* FROM members m
WHERE m.id NOT IN (
  SELECT a.member_id 
  FROM attendance a
  WHERE a.service_id = (
    SELECT s.id 
    FROM services s 
    ORDER BY s.date DESC 
    LIMIT 1
  ) AND a.status = 'present'
);`,
      explanation: "Identifies existing church family members who did not record attendance at our most recent service.",
      results: membersWhoMissedLastService
    },
    second_timers: {
      sql: `SELECT m.*, COUNT(a.id) as total_attendance
FROM members m
JOIN attendance a ON m.id = a.member_id
WHERE a.status = 'present'
GROUP BY m.id
HAVING COUNT(a.id) = 2;`,
      explanation: "Identifies visitors on their exact second worship attendance.",
      results: secondTimers
    },
    first_timers: {
      sql: `SELECT * FROM members 
WHERE first_timer = TRUE 
ORDER BY date_joined DESC;`,
      explanation: "Queries current guests flagged as first-time visitors currently.",
      results: firstTimerMembers
    },
    students: {
      sql: `SELECT * FROM members 
WHERE student_status = TRUE 
ORDER BY name ASC;`,
      explanation: "Filters the active student population.",
      results: studentMembers
    },
    birthday_order: {
      sql: `SELECT name, birthday, email,
       EXTRACT(MONTH FROM TO_DATE(birthday, 'YYYY-MM-DD')) as b_month,
       EXTRACT(DAY FROM TO_DATE(birthday, 'YYYY-MM-DD')) as b_day
FROM members
WHERE birthday IS NOT NULL AND birthday <> ''
ORDER BY b_month ASC, b_day ASC;`,
      explanation: "Arranges all congregants by their birthday calendar date.",
      results: sortedBirthdays.filter(m => m.birthday)
    }
  };


  useEffect(() => {
    if (queryResultIds.length > 0) {
      setSelectedMemberForAI(queryResultIds[0]);
    } else {
      setSelectedMemberForAI('');
    }
  }, [campaignTarget, queryResultIds]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col selection:bg-amber-100 selection:text-amber-900" id="chms-app-container">
      
      {/* HEADER SECTION */}
      <header className="border-b border-slate-200 bg-white shadow-xs sticky top-0 z-40" id="header-bar">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500 text-white rounded-xl shadow-md shadow-amber-500/10" id="church-logo-bg">
              <Users className="w-6 h-6 stroke-[2]" />
            </div>
            <div>
              <h1 className="text-xl font-bold font-sans tracking-tight text-slate-900">Grace Citadel ChMS</h1>
              <p className="text-xs text-slate-500 font-mono">Relational Database Core &amp; Outreach Node</p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto self-stretch sm:self-auto justify-end">
            <button 
              onClick={handleResetDb} 
              className="flex items-center gap-2 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium border border-slate-200 active:scale-95 transition-all cursor-pointer"
              title="Reset state to default relational seeds"
              id="reset-db-btn"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Seeds
            </button>
          </div>
        </div>
      </header>

      {/* ERROR OR KEYBOARD BAR */}
      {errorMsg && (
        <div className="bg-rose-50 border-b border-rose-200 px-4 py-3 text-sm text-rose-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* DASHBOARD CONTENT OMITTED FOR BREVITY IN COPY-PASTE - REST OF THE APP REMAINS THE SAME */}
      {/* (NOTE: Ensure the rest of your original App.tsx file follows here!) */}
      
      {/* ... [Insert the rest of your original App.tsx structure here] ... */}

    </div>
  );
}
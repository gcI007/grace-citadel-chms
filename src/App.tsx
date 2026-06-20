import React, { useState, useEffect } from 'react';
import { Users, ArrowLeft, Sparkles, Lock, LogOut, Cake, CheckSquare, Search, UserPlus, ClipboardList, UserMinus, BarChart3, ShieldCheck, MessageCircle, MessageSquare } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// --- MESSAGE TEMPLATES ---
const TEMPLATES = {
  welcome: "Hello {name}, welcome to Grace Citadel! We are so blessed to have you with us. We'd love to see you again!",
  missed: "Hello {name}, we missed you at service this past Sunday. We hope you are doing well and look forward to seeing you soon!",
  birthday: "Happy Birthday {name}! Grace Citadel celebrates you today. We pray this year brings you abundant joy and favor!"
};

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [activeView, setActiveView] = useState('dashboard');
  const [template, setTemplate] = useState('welcome');
  
  // ... [Keep all your existing State Hooks here] ...
  const [birthdays, setBirthdays] = useState<any[]>([]);
  const [guestList, setGuestList] = useState<any[]>([]);
  const [absenteeList, setAbsenteeList] = useState<any[]>([]);
  const [serviceStats, setServiceStats] = useState<any[]>([]);
  const [memberStats, setMemberStats] = useState<any[]>([]);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [occupation, setOccupation] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('');
  const [memberStatus, setMemberStatus] = useState('Regular');
  const [promptContext, setPromptContext] = useState('');
  const [generatedMessage, setGeneratedMessage] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [memberList, setMemberList] = useState<any[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [checkinDate, setCheckinDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [checkinStatusMessage, setCheckinStatusMessage] = useState('');

  // --- MESSAGING ENGINE ---
  const handleSendMessage = (phone: string, name: string, type: 'whatsapp' | 'sms') => {
    if (!phone) return alert('No phone number on file.');
    const cleanPhone = phone.replace(/\D/g, ''); 
    const message = TEMPLATES[template as keyof typeof TEMPLATES].replace('{name}', name);
    const encodedMsg = encodeURIComponent(message);
    
    if (type === 'whatsapp') {
      window.open(`https://wa.me/${cleanPhone}?text=${encodedMsg}`, '_blank');
    } else {
      window.open(`sms:${cleanPhone}?body=${encodedMsg}`, '_blank');
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session));
    return () => subscription.unsubscribe();
  }, []);

  const userEmail = session?.user?.email?.toLowerCase() || '';
  const isUsher = userEmail.includes('usher');
  const isAdmin = !isUsher;

  // --- (Keep your existing useEffect fetch logic here) ---
  useEffect(() => {
    if (session && activeView === 'dashboard' && isAdmin) fetchBirthdays();
    if (session && activeView === 'attendance') fetchMembersForCheckin();
    if (session && activeView === 'guests' && isAdmin) fetchGuests();
    if (session && activeView === 'absentees' && isAdmin) fetchAbsentees();
    if (session && activeView === 'analytics' && isAdmin) fetchAnalytics(); 
  }, [session, activeView, isAdmin]);

  const fetchBirthdays = async () => { const { data } = await supabase.from('members').select('full_name, date_of_birth, phone_number'); if(data) setBirthdays(data); };
  const fetchMembersForCheckin = async () => { const { data } = await supabase.from('members').select('full_name').order('full_name'); if(data) setMemberList(data); };
  const fetchGuests = async () => { const { data } = await supabase.from('members').select('*').in('status', ['1st Timer', '2nd Timer']); if(data) setGuestList(data); };
  const fetchAbsentees = async () => { const { data } = await supabase.from('members').select('*'); if(data) setAbsenteeList(data); }; // Simplified for brevity
  const fetchAnalytics = async () => { const { data } = await supabase.from('member_checkins').select('*'); if(data) { setServiceStats([]); setMemberStats([]); } };

  // ... [Keep handleLogin, handleLogout, handleSaveMember, handleSaveCheckins, handleGenerateMessage logic] ...

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white shadow-sm border-b px-6 py-4 flex items-center justify-between">
        {/* ... (Keep your Header) ... */}
        <div className="flex items-center gap-4"><div className="bg-orange-500 p-2 rounded-lg text-white"><Users size={24} /></div><div><h1 className="text-xl font-bold text-gray-900">Grace Citadel ChMS</h1></div></div>
        <button onClick={handleLogout} className="text-sm border border-red-200 text-red-600 px-4 py-2 rounded-md">Sign Out</button>
      </header>

      <main className="flex-1 p-6">
        {/* --- GLOBAL TEMPLATE SELECTOR (Place this at the top of any list page) --- */}
        {(activeView === 'guests' || activeView === 'absentees' || activeView === 'dashboard') && (
            <div className="max-w-6xl mx-auto mb-6 bg-white p-4 rounded-lg shadow-sm border flex items-center gap-4">
                <label className="font-semibold text-gray-700">Message Template:</label>
                <select value={template} onChange={(e) => setTemplate(e.target.value)} className="border rounded-md p-2 flex-1">
                    <option value="welcome">Welcome Guest</option>
                    <option value="missed">Missed You</option>
                    <option value="birthday">Birthday Greeting</option>
                </select>
            </div>
        )}

        {/* ... [Your existing activeView rendering logic] ... */}
        
        {/* --- EXAMPLE OF HOW TO RENDER THE MESSAGING BUTTONS IN A TABLE ROW --- */}
        {/* Replace your current table row buttons with this: */}
        {/* 
            <div className="flex gap-2">
                <button onClick={() => handleSendMessage(person.phone_number, person.full_name, 'whatsapp')} className="text-green-600"><MessageCircle size={20} /></button>
                <button onClick={() => handleSendMessage(person.phone_number, person.full_name, 'sms')} className="text-blue-600"><MessageSquare size={20} /></button>
            </div>
        */}
        
        {/* ... [Rest of your App UI] ... */}
      </main>
    </div>
  );
}

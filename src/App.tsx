import React, { useState, useEffect } from 'react';
import { Users, ArrowLeft, Sparkles, Lock, LogOut, Cake, CheckSquare, Search, UserPlus, ClipboardList, UserMinus, BarChart3, ShieldCheck, MessageSquare, MessageCircle } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

// ... (Keep existing imports and Supabase setup) ...
// (All logic from previous steps remains, just adding the helper below)

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function App() {
  // ... (Keep all your existing state hooks) ...
  const [session, setSession] = useState<any>(null);
  const [activeView, setActiveView] = useState('dashboard');
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

  // --- MESSAGING HELPER ---
  const handleSendMessage = (phone: string, name: string, type: 'whatsapp' | 'sms') => {
    if (!phone) return alert('No phone number available.');
    const cleanPhone = phone.replace(/\D/g, ''); // Remove non-digits
    const message = `Hello ${name}, this is Grace Citadel. We were thinking of you today!`;
    const encodedMsg = encodeURIComponent(message);
    
    if (type === 'whatsapp') {
      window.open(`https://wa.me/${cleanPhone}?text=${encodedMsg}`, '_blank');
    } else {
      window.open(`sms:${cleanPhone}?body=${encodedMsg}`, '_blank');
    }
  };

  // ... (Keep all your existing useEffects and fetch functions) ...
  // [Paste your existing fetch/auth logic here]
  // --- (I have omitted the fetch logic blocks here to save space, please keep your existing code) ---

  // ==========================================
  // UI RENDERING - Add the buttons to rosters
  // ==========================================

  // In your Birthday section:
  // Add this inside the .map: 
  // <button onClick={() => handleSendMessage(b.phone, b.full_name, 'whatsapp')} className="text-green-600 ml-2"><MessageCircle size={16}/></button>

  // In your Guest/Absentee Table rows, add this inside the <td>:
  /*
    <div className="flex gap-2">
      <button onClick={() => handleSendMessage(person.phone_number, person.full_name, 'whatsapp')} className="text-green-600 hover:text-green-800"><MessageCircle size={18} /></button>
      <button onClick={() => handleSendMessage(person.phone_number, person.full_name, 'sms')} className="text-blue-600 hover:text-blue-800"><MessageSquare size={18} /></button>
    </div>
  */

  return ( /* ... Your UI Structure ... */ );
}

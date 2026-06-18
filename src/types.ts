/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Member {
  id: string;
  name: string;
  email: string;
  phone: string;
  birthday: string; // YYYY-MM-DD
  student_status: boolean;
  first_timer: boolean; // Is a first-time visitor currently
  date_joined: string; // YYYY-MM-DD
  address?: string;
  notes?: string;
}

export interface ChurchService {
  id: string;
  name: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  theme?: string;
}

export interface Attendance {
  id: string;
  member_id: string;
  service_id: string;
  status: 'present' | 'absent' | 'excused';
  notes?: string;
  signed_in_at: string; // ISO String
}

export interface CommunicationLog {
  id: string;
  member_id: string;
  member_name: string;
  type: 'sms' | 'email';
  campaign_type: 'welcome' | 'missed' | 'birthday' | 'custom';
  message: string;
  status: 'sent' | 'pending';
  sent_at: string;
}

export interface DBState {
  members: Member[];
  services: ChurchService[];
  attendance: Attendance[];
  communications: CommunicationLog[];
}

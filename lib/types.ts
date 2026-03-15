export interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: 'student' | 'teacher' | 'both';
  avatar_url: string | null;
  google_calendar_url: string | null;
  default_meet_link: string | null;
  study_hours_per_day: number;
  preferred_times: string[];
  theme: string;
  created_at: string;
  updated_at: string;
}

export interface Class {
  id: string;
  name: string;
  subject: string;
  code: string;
  description: string | null;
  location: string | null;
  meet_link: string | null;
  visibility: 'public' | 'private';
  color: string;
  creator_id: string;
  created_at: string;
  updated_at: string;
  member_count?: number;
  file_count?: number;
  creator_name?: string;
}

export interface ClassMember {
  id: string;
  class_id: string;
  user_id: string;
  role: 'owner' | 'teacher' | 'member';
  joined_at: string;
  full_name?: string;
  email?: string;
}

export interface LibraryFile {
  id: string;
  user_id: string;
  class_id: string | null;
  file_name: string;
  file_type: string;
  file_size: number;
  storage_path: string;
  tags: string[];
  ai_summary: string | null;
  uploaded_at: string;
}

export interface CalendarEvent {
  id: string;
  user_id: string;
  title: string;
  event_type: 'class' | 'study' | 'exam' | 'ai_block';
  day_of_week: number;
  start_time: string;
  end_time: string;
  subject: string | null;
  color: string | null;
  created_at: string;
}

export interface Exam {
  id: string;
  user_id: string;
  subject: string;
  exam_date: string;
  created_at: string;
}

export interface AIChat {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface AIMessage {
  id: string;
  chat_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export interface StudyStreak {
  id: string;
  user_id: string;
  current_streak: number;
  last_study_date: string | null;
  longest_streak: number;
}

export interface FlashcardDeck {
  id: string;
  user_id: string;
  title: string;
  source_file_id: string | null;
  created_at: string;
  cards?: Flashcard[];
}

export interface Flashcard {
  id: string;
  deck_id: string;
  front: string;
  back: string;
  mastered: boolean;
  created_at: string;
}

export interface ClassNote {
  id: string;
  class_id: string;
  user_id: string;
  content: string;
  updated_at: string;
}

export interface DashboardStats {
  activeClasses: number;
  libraryFiles: number;
  studyStreak: number;
  aiChats: number;
}

-- InGen Database Schema
-- Run this in Supabase SQL Editor

-- Profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT DEFAULT 'student' CHECK (role IN ('student', 'teacher', 'both')),
  avatar_url TEXT,
  google_calendar_url TEXT,
  default_meet_link TEXT,
  study_hours_per_day INTEGER DEFAULT 3,
  preferred_times TEXT[] DEFAULT ARRAY['morning'],
  theme TEXT DEFAULT 'light',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Classes table
CREATE TABLE IF NOT EXISTS classes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  description TEXT,
  location TEXT,
  meet_link TEXT,
  visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'private')),
  color TEXT DEFAULT '#0EA5E9',
  creator_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Class members
CREATE TABLE IF NOT EXISTS class_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'teacher', 'member')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(class_id, user_id)
);

-- Library files
CREATE TABLE IF NOT EXISTS library_files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  class_id UUID REFERENCES classes(id) ON DELETE SET NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  storage_path TEXT NOT NULL,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  ai_summary TEXT,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Calendar events
CREATE TABLE IF NOT EXISTS calendar_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  event_type TEXT DEFAULT 'study' CHECK (event_type IN ('class', 'study', 'exam', 'ai_block')),
  day_of_week INTEGER CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  subject TEXT,
  color TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Exams
CREATE TABLE IF NOT EXISTS exams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  exam_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI chat sessions
CREATE TABLE IF NOT EXISTS ai_chats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT DEFAULT 'New Chat',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI chat messages
CREATE TABLE IF NOT EXISTS ai_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_id UUID REFERENCES ai_chats(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Study streaks
CREATE TABLE IF NOT EXISTS study_streaks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  current_streak INTEGER DEFAULT 0,
  last_study_date DATE,
  longest_streak INTEGER DEFAULT 0
);

-- Flashcard decks
CREATE TABLE IF NOT EXISTS flashcard_decks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  source_file_id UUID REFERENCES library_files(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Flashcards
CREATE TABLE IF NOT EXISTS flashcards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  deck_id UUID REFERENCES flashcard_decks(id) ON DELETE CASCADE,
  front TEXT NOT NULL,
  back TEXT NOT NULL,
  mastered BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Class notes
CREATE TABLE IF NOT EXISTS class_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE library_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashcard_decks ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_notes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Service role full access profiles" ON profiles FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Anyone can view public classes" ON classes FOR SELECT USING (true);
CREATE POLICY "Users can create classes" ON classes FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Owners can update classes" ON classes FOR UPDATE USING (auth.uid() = creator_id);
CREATE POLICY "Owners can delete classes" ON classes FOR DELETE USING (auth.uid() = creator_id);

CREATE POLICY "Members can view memberships" ON class_members FOR SELECT USING (true);
CREATE POLICY "Users can join classes" ON class_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can leave classes" ON class_members FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own files" ON library_files FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own events" ON calendar_events FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own exams" ON exams FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own chats" ON ai_chats FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own messages" ON ai_messages FOR ALL USING (
  chat_id IN (SELECT id FROM ai_chats WHERE user_id = auth.uid())
);
CREATE POLICY "Users can manage own streaks" ON study_streaks FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own decks" ON flashcard_decks FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own flashcards" ON flashcards FOR ALL USING (
  deck_id IN (SELECT id FROM flashcard_decks WHERE user_id = auth.uid())
);
CREATE POLICY "Class members can manage notes" ON class_notes FOR ALL USING (
  class_id IN (SELECT class_id FROM class_members WHERE user_id = auth.uid())
);

-- Create storage bucket (run via Supabase dashboard or API)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('library-files', 'library-files', true);

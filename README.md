# InGen — AI-Powered Learning Management System

> **Learn Smarter, Together.**
> A full-stack EdTech web application that combines classroom management, AI tutoring, smart flashcards, file libraries, and intelligent scheduling into one cohesive platform.

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Database Schema](#database-schema)
- [Backend API Reference](#backend-api-reference)
- [Frontend Pages](#frontend-pages)
- [AI Features](#ai-features)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Scripts](#scripts)

---

## Overview

InGen is an AI-powered Learning Management System designed to help students organize their academic lives. The platform provides six core modules:

| Module | Description |
|--------|-------------|
| **Dashboard** | Aggregated overview of classes, files, calendar, study analytics, and streak tracking |
| **Classes** | Create/join classrooms with invite codes, manage members, upload class-specific files |
| **Library** | Upload and manage study materials (PDF, docs, images); AI-powered file summarization |
| **Calendar** | Weekly schedule management with manual events and AI-generated optimized study timetables |
| **AI Tutor** | Conversational AI chatbot for academic assistance, homework help, and quiz generation |
| **Flashcards** | Manual and AI-generated flashcard decks with interactive study mode and mastery tracking |

Additional features: Settings (profile, theme, integrations), Exams tracking, Study streak analytics, and a Pomodoro timer.

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     FRONTEND (React)                     │
│  Next.js 14 App Router · Tailwind CSS · Framer Motion   │
│                                                         │
│  Pages:  /dashboard  /classes  /library  /calendar      │
│          /tutor      /flashcards   /settings             │
└────────────────────────┬────────────────────────────────┘
                         │  HTTP (fetch)
                         ▼
┌─────────────────────────────────────────────────────────┐
│                 BACKEND (Next.js API Routes)             │
│                    /app/api/**/*.ts                       │
│                                                         │
│  Auth Layer:    JWT-based sessions (lib/auth.ts)         │
│  Data Layer:    Prisma ORM (lib/db.ts)                   │
│  AI Layer:      Google Gemini 2.0 Flash (lib/gemini.ts)  │
│  File Storage:  Local disk (public/uploads/)             │
└───────┬───────────────────┬─────────────────┬───────────┘
        │                   │                 │
        ▼                   ▼                 ▼
  ┌───────────┐     ┌─────────────┐    ┌────────────┐
  │  SQLite   │     │ Google      │    │   Local    │
  │  (Prisma) │     │ Gemini API  │    │ Filesystem │
  │  dev.db   │     │ (AI/LLM)    │    │ /uploads/  │
  └───────────┘     └─────────────┘    └────────────┘
```

### Key Design Decisions

- **No external auth provider** — The app uses a simplified mock-user system (`lib/seed-user.ts`) with JWT infrastructure ready for production auth integration.
- **Prisma ORM** — Type-safe database access with SQLite for local development. Easily swappable to PostgreSQL/MySQL for production.
- **Server-side AI** — All Gemini API calls happen server-side to protect the API key. Two functions: `generateAIResponse()` for text and `generateJSON()` for structured data.
- **Local file storage** — Uploaded files are stored in `public/uploads/` with collision-safe timestamped filenames. Ready to swap to S3/GCS in production.

---

## Tech Stack

### Core Framework
| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 14.2.15 | Full-stack React framework (App Router) |
| **React** | 18.3.1 | UI rendering |
| **TypeScript** | 5.5.4 | Type safety |

### Backend & Data
| Technology | Purpose |
|------------|---------|
| **Prisma** | ORM for database access (SQLite/PostgreSQL) |
| **SQLite** | Local development database |
| **JWT (jsonwebtoken)** | Session tokens |
| **bcryptjs** | Password hashing |
| **pdf-parse** | PDF text extraction for AI summarization |

### Frontend & UI
| Technology | Purpose |
|------------|---------|
| **Tailwind CSS** | Utility-first styling |
| **Framer Motion** | Page transitions and micro-animations |
| **Lucide React** | Icon library |
| **Radix UI** | Accessible primitives (dialogs, dropdowns, tabs) |
| **react-markdown + remark-gfm** | Markdown rendering in AI chat |

### AI Integration
| Technology | Purpose |
|------------|---------|
| **Google Gemini 2.0 Flash** | AI text generation, flashcard generation, timetable generation |

---

## Database Schema

The application uses **12 Prisma models** across 4 functional domains:

### User & Auth
```
User
├── id, email, passwordHash, fullName, role
├── avatarUrl, googleCalendarUrl, defaultMeetLink
└── Relations → Classes, Members, Decks, Chats, Stats, Exams, Files
```

### Classroom System
```
Class
├── id, name, subject, description, code (unique invite code)
├── color, meetLink, location, visibility, creatorId
└── Relations → Members[], Files[], FlashcardDecks[]

ClassMember
├── id, classId, userId, role (owner/teacher/student)
└── Unique constraint on [classId, userId]
```

### Content & Study
```
LibraryFile
├── id, name, fileType, fileSize, url, tags (JSON string)
├── aiSummary (AI-generated), classId, uploadedById
└── Relations → User, Class

FlashcardDeck
├── id, title, description, creatorId, classId
└── Relations → Flashcard[]

Flashcard
├── id, deckId, front, back, confidence (0-5)
├── lastReviewed, nextReview
└── Cascade delete with deck

Exam / ExamQuestion
├── Exam: id, title, date, userId
└── ExamQuestion: id, question, type, options, correctAnswer
```

### Communication & Scheduling
```
ChatSession
├── id, userId, title, timestamps
└── Relations → ChatMessage[]

ChatMessage
├── id, sessionId, role (user/assistant), content
└── Cascade delete with session

CalendarEvent
├── id, userId, title, eventType (class/study/exam/ai_block)
├── dayOfWeek (0-6), startTime, endTime, subject, color
└── Standalone model (no relations)

UserStats
├── id, userId (unique), studyStreak, cardsReviewed, timeSpent
└── One-to-one with User
```

---

## Backend API Reference

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Register a new user |
| `POST` | `/api/auth/login` | Login and receive JWT |
| `POST` | `/api/auth/logout` | Clear session |
| `GET` | `/api/auth/me` | Get current user info |

### Profile & Stats
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/profile` | Get user profile (name, role, calendar URL, meet link) |
| `PUT` | `/api/profile` | Update profile fields |
| `GET` | `/api/stats` | Get dashboard stats (class count, file count, streak, chats) |

### Classes
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/classes` | List user's classes with member/file counts |
| `POST` | `/api/classes` | Create a new class (auto-generates invite code) |
| `GET` | `/api/classes/[id]` | Get class details |
| `PUT` | `/api/classes/[id]` | Update class settings |
| `DELETE` | `/api/classes/[id]` | Delete class and all related data |
| `POST` | `/api/classes/join` | Join a class via invite code |
| `GET` | `/api/classes/[id]/members` | List class members |
| `DELETE` | `/api/classes/[id]/members` | Remove a member (owner only) |
| `GET` | `/api/classes/[id]/files` | List files in a class |

### Library (File Management)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/library` | List files (supports `?search=` query) |
| `POST` | `/api/library` | Create a file record |
| `POST` | `/api/library/upload` | Upload a file (multipart form data) |
| `DELETE` | `/api/library/[id]` | Delete a file (from DB + disk) |
| `POST` | `/api/library/[id]/summarize` | **AI**: Generate a summary of a file |

### Calendar & Exams
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/calendar/events` | List all calendar events |
| `POST` | `/api/calendar/events` | Create a manual event |
| `DELETE` | `/api/calendar/events?id=` | Delete an event |
| `POST` | `/api/calendar/generate` | **AI**: Generate optimized study timetable |
| `POST` | `/api/calendar/parse-ical` | Save Google Calendar iCal URL |
| `GET` | `/api/exams` | List exams (sorted by date) |
| `POST` | `/api/exams` | Add an exam |
| `DELETE` | `/api/exams?id=` | Delete an exam |

### AI Tutor (Chat)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/tutor/chats` | List all chat sessions |
| `POST` | `/api/tutor/chats` | Create a new chat session |
| `GET` | `/api/tutor/chats/[id]` | Get messages for a chat |
| `DELETE` | `/api/tutor/chats/[id]` | Delete a chat session |
| `POST` | `/api/tutor/send` | Send a message and get AI response |

### Flashcards
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/flashcards` | List all decks (with card counts) |
| `GET` | `/api/flashcards?deck_id=` | Get cards for a specific deck (study mode) |
| `POST` | `/api/flashcards` | Create a deck with optional cards |
| `DELETE` | `/api/flashcards/[id]` | Delete a deck and all its cards |
| `POST` | `/api/flashcards/generate` | **AI**: Generate flashcards from content |

### Utility
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/seed` | Seed demo data (classes, files, events, chats, exams, stats) |

---

## Frontend Pages

| Route | Component | Description |
|-------|-----------|-------------|
| `/` | Landing page | Public marketing page with feature showcase |
| `/dashboard` | AppShell + Dashboard | Stats cards, class list, recent files, today's schedule, study analytics |
| `/classes` | AppShell + Classes | Class grid with search, location filter, My/Joined tabs |
| `/classes/create` | AppShell + CreateClass | Form to create a new class |
| `/classes/[id]` | AppShell + ClassDetail | Overview, Files (with upload), Members tabs |
| `/library` | AppShell + Library | File grid with search, upload, delete, AI summarize |
| `/calendar` | AppShell + Calendar | Weekly view, manual events, AI timetable generation, exam tracking |
| `/tutor` | AppShell + Tutor | Chat interface with session sidebar, markdown rendering |
| `/flashcards` | AppShell + Flashcards | Deck list, manual/AI creation, 3D flip study mode with scoring |
| `/settings` | AppShell + Settings | Profile editing, theme toggle, Google Calendar/Meet integrations |

---

## AI Features

InGen uses **Google Gemini 2.0 Flash** for four distinct AI capabilities:

### 1. AI Tutor (`/api/tutor/send`)
- Conversational academic assistant with system prompt
- Maintains context via last 10 messages in conversation history
- Supports `quick_action: "quiz"` to generate multiple-choice quizzes
- Markdown-formatted responses rendered with `react-markdown`

### 2. AI File Summarization (`/api/library/[id]/summarize`)
- Reads file content from local disk (txt, md, csv, json via UTF-8; PDF via `pdf-parse`)
- Falls back to filename/metadata description if file can't be read
- Generates 4-5 concise bullet points focused on key concepts
- Caches summary in the database (`aiSummary` field)

### 3. AI Flashcard Generation (`/api/flashcards/generate`)
- Accepts raw text content as input
- Generates 10-15 flashcards with front (question) and back (answer)
- Returns structured JSON via `generateJSON()`

### 4. AI Study Timetable (`/api/calendar/generate`)
- Accepts study hours, preferred times, subjects, and upcoming exams
- Generates 5-8 optimized study blocks across the week
- Prioritizes subjects with imminent exams
- Replaces existing AI blocks before inserting new ones

---

## Project Structure

```
├── app/
│   ├── api/                    # Backend API routes
│   │   ├── auth/               # Login, register, logout, me
│   │   ├── calendar/           # Events CRUD, AI generate, parse-ical
│   │   ├── classes/            # Classes CRUD, join, members, files
│   │   ├── exams/              # Exams CRUD
│   │   ├── flashcards/         # Decks CRUD, AI generate
│   │   ├── library/            # Files CRUD, upload, AI summarize
│   │   ├── profile/            # Profile GET/PUT
│   │   ├── seed/               # Demo data seeding
│   │   ├── stats/              # Dashboard statistics
│   │   └── tutor/              # Chat sessions, message sending
│   ├── calendar/               # Calendar page
│   ├── classes/                # Classes pages (list, create, detail)
│   ├── dashboard/              # Dashboard page
│   ├── flashcards/             # Flashcards page
│   ├── library/                # Library page
│   ├── login/                  # Login page
│   ├── settings/               # Settings page
│   ├── signup/                 # Signup page
│   ├── tutor/                  # AI Tutor page
│   ├── layout.tsx              # Root layout (fonts, metadata)
│   ├── globals.css             # Global CSS (design tokens, components)
│   └── page.tsx                # Landing page
├── components/
│   ├── common/                 # LoadingSkeleton
│   └── layout/                 # AppShell (sidebar + navigation)
├── lib/
│   ├── auth.ts                 # JWT sign/verify/getSession
│   ├── db.ts                   # Prisma client singleton
│   ├── gemini.ts               # Gemini AI helpers
│   ├── seed-user.ts            # Mock user bootstrap
│   ├── types.ts                # TypeScript interfaces
│   └── utils.ts                # Utility functions
├── prisma/
│   ├── schema.prisma           # Database schema (12 models)
│   └── dev.db                  # SQLite database
├── public/
│   └── uploads/                # Uploaded files
├── middleware.ts                # Route middleware (pass-through)
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

---

## Getting Started

### Prerequisites
- **Node.js** ≥ 18
- **npm** ≥ 9
- A **Google Gemini API key** (free tier available at [ai.google.dev](https://ai.google.dev))

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/your-username/Fullstack-Edtech-LMS-Web-Application-.git
cd Fullstack-Edtech-LMS-Web-Application-

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env.local
# Edit .env.local and add your GEMINI_API_KEY

# 4. Initialize the database
npx prisma generate
npx prisma db push

# 5. Start the development server
npm run dev
```

The app will be available at **http://localhost:3000**.

### Seed Demo Data

After starting the server, you can populate the database with sample data:

```bash
curl -X POST http://localhost:3000/api/seed \
  -H 'Content-Type: application/json' \
  -d '{"user_id": "test-user-id"}'
```

This creates 3 classes, 5 files, 5 calendar events, a chat session, study stats, and 2 exams.

---

## Environment Variables

Create a `.env.local` file in the project root:

```env
# Required — Google Gemini API key for AI features
GEMINI_API_KEY=your_gemini_api_key_here

# Optional — JWT secret (defaults to a dev key)
JWT_SECRET=your_jwt_secret_here

# Optional — Database URL (defaults to SQLite at prisma/dev.db)
DATABASE_URL=file:./dev.db
```

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server on port 3000 |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npx prisma studio` | Open Prisma database GUI |
| `npx prisma db push` | Sync schema changes to database |
| `npx prisma generate` | Regenerate Prisma client |

---

## License

This project is private and not licensed for redistribution.

# HireLens

<p align="center">
  <img src="public/hirelens-icon.png" alt="HireLens Logo" width="120" />
</p>

HireLens is a voice-based AI interview preparation platform that allows users to practice interviews with spoken answers, receive real-time scoring, and track progress.

## 🌟 Features

- **Voice-enabled interviews** - Speak your answers using browser speech recognition
- **Two interview modes**:
  - MCQ Interview - Voice-answered multiple choice questions
  - Live AI Interview - Conversational AI interviewer with webcam/mic support
- **Real-time evaluation** - AI scores answers for technical and communication skills
- **Progress tracking** - View your score history and improvement over time

## 📸 Screenshots

<p align="center">
  <img src="public/placeholder.svg" alt="HireLens Interface" width="80%" />
</p>

## 🚀 Prerequisites

- **Voice-enabled interviews** - Speak your answers using browser speech recognition
- **Two interview modes**:
  - MCQ Interview - Voice-answered multiple choice questions
  - Live AI Interview - Conversational AI interviewer with webcam/mic support
- **Real-time evaluation** - AI scores answers for technical and communication skills
- **Progress tracking** - View your score history and improvement over time

## Prerequisites

- Node.js 18+
- npm or bun
- Supabase account (for backend services)

## Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd HireLens
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
# Copy .env.example to .env and fill in your Supabase credentials
cp .env.example .env
```

Required environment variables:
- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_PUBLISHABLE_KEY` - Your Supabase anon key

4. Run the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:8080`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run build:dev` - Build in development mode
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run test` - Run tests

## Project Structure

```
src/
  components/     # Reusable UI components
    ui/           # shadcn/ui components
  pages/          # Route components
  hooks/          # Custom React hooks
  integrations/   # Supabase client and types
  lib/            # Utility functions
supabase/
  functions/      # Edge functions for AI evaluation
  migrations/     # Database migrations
```

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS
- **UI**: shadcn/ui, Radix UI, Framer Motion
- **Backend**: Supabase (PostgreSQL, Edge Functions, Auth)
- **Charts**: Recharts
- **PDF Generation**: jspdf, html2canvas
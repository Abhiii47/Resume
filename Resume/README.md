# CareerAI - AI-Powered Career Platform

An AI-powered career management platform built with Next.js.

## Tech Stack

| Layer         | Technology            |
| ------------- | --------------------- |
| **Framework** | Next.js 16 + React 19 |
| **Styling**   | Tailwind CSS          |
| **Database**  | PostgreSQL + Prisma   |
| **Auth**      | Better Auth           |
| **AI**        | Google Gemini         |
| **Storage**   | Supabase              |
| **Build**     | Turborepo             |

## Project Structure

```
apps/
└── web/                        # Next.js web application
    ├── src/
    │   ├── app/
    │   │   ├── (auth)/         # Auth pages (login, signup)
    │   │   ├── (dashboard)/    # Protected dashboard features
    │   │   └── api/            # Backend API routes
    │   └── middleware.ts       # Auth middleare

packages/
├── ai/                         # Gemini AI service abstraction
├── core/                       # Unified Auth, Database, and Supabase client
├── types/                      # Shared TypeScript definitions
└── ui/                         # Premium Design System (Aceternity + Radix)
```

## API Endpoints

| Endpoint               | Method    | Description             |
| ---------------------- | --------- | ----------------------- |
| `/api/auth`            | GET, POST | Authentication          |
| `/api/apply`           | POST      | Submit job application  |
| `/api/applications`    | GET       | List applications       |
| `/api/dashboard/stats` | GET       | Dashboard statistics    |
| `/api/jobs`            | GET       | List jobs               |
| `/api/resume/upload`   | POST      | Upload & analyze resume |
| `/api/resume/optimize` | POST      | Optimize resume         |
| `/api/roadmap`         | GET, POST | Career roadmap          |

## Commands

```bash
# Install dependencies
npm install

# Develop all apps
npm run dev

# Develop frontend only
npm run dev --filter=frontend

# Build all apps
npm run build

# Type check
npm run typecheck

# Lint
npm run lint
```

## Environment Variables

```env
DATABASE_URL=postgresql://...
BETTER_AUTH_SECRET=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
GOOGLE_GENERATIVE_AI_API_KEY=...
```

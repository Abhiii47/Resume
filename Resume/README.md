# CareerAI - AI-Powered Career Platform

An AI-powered career management platform built with Next.js.

## Product Docs

- [CareerAI Master Feature & Vision Document](docs/careerai-master-feature-vision.md)

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

```text
apps/
└── web/                         # Next.js web application
    └── src/
        ├── app/
        │   ├── (auth)/          # Login and signup pages
        │   ├── (dashboard)/     # Protected product surfaces
        │   ├── api/             # Route handlers
        │   └── u/[id]/          # Public share pages
        ├── components/          # App-specific UI pieces
        ├── lib/                 # Frontend helpers
        └── proxy.ts             # Route protection and security headers

packages/
├── ai/                          # Gemini prompts and AI workflows
├── core/                        # Auth, Prisma, billing, limits, Supabase
├── types/                       # Shared TypeScript types
└── ui/                          # Shared design system components

docs/
└── careerai-master-feature-vision.md
```

## API Endpoints

| Endpoint               | Method    | Description                           |
| ---------------------- | --------- | ------------------------------------- |
| `/api/auth`            | GET, POST | Authentication                        |
| `/api/analysis`        | GET, POST | Resume analysis and placement score   |
| `/api/applications`    | GET, POST | Application tracker                   |
| `/api/apply`           | POST      | Create tracked application by job id  |
| `/api/billing`         | GET       | Billing and usage snapshot            |
| `/api/dashboard/stats` | GET       | Dashboard statistics                  |
| `/api/interview`       | GET, POST | Mock interview history and feedback   |
| `/api/jobs/match`      | GET       | Persisted AI-ranked job matches       |
| `/api/resume`          | GET       | Resume history                        |
| `/api/resume/optimize` | POST      | Tailor resume to a selected job       |
| `/api/resume/save-version` | POST  | Save optimized resume version         |
| `/api/resume/upload`   | POST      | Upload and analyze resume             |
| `/api/roadmap`         | GET, POST, PUT | Career roadmap and progress     |
| `/api/user`            | GET, PATCH, DELETE | Account management            |

## Commands

```bash
# Install dependencies
npm install

# Develop all apps
npm run dev

# Build all apps
npm run build

# Type check the monorepo
npm run check-types

# Lint the monorepo
npm run lint
```

## Environment Variables

```env
DATABASE_URL=postgresql://...
BETTER_AUTH_SECRET=...
BETTER_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
GOOGLE_GENERATIVE_AI_API_KEY=...
RESEND_API_KEY=...
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...
STRIPE_PRO_PRICE_ID=...
STRIPE_PREMIUM_PRICE_ID=...
YEPAPI_KEY=...
```

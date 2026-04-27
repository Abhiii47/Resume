# CareerAI Master Feature & Vision Document

This document is the canonical product source of truth for CareerAI. It consolidates the platform vision, user journey, feature system, growth strategy, business model, and current build status discussed so far.

## 0. Current Core Feature Set

These are the features CareerAI should be treated as having right now. They are the current MVP backbone and should remain visible in product decisions, demos, landing-page messaging, and engineering prioritization.

1. Auth
2. Resume Upload
3. Analysis Engine
4. Placement Score
5. Job Matching
6. X-Factor Insights
7. Insight Panel
8. Dashboard (minimal)
9. Share System
10. API Layer
11. Database

### What each core feature means

#### 1. Auth

- Sign up
- Login
- Session-gated dashboard access
- Password reset and account settings flows

#### 2. Resume Upload

- Upload resume into the platform
- Extract readable text
- Store file and parsed content
- Trigger analysis pipeline after upload

#### 3. Analysis Engine

- Run AI resume analysis
- Produce structured strengths, weaknesses, missing skills, recommendations, career path, and experience level
- Persist analysis output for reuse across the app

#### 4. Placement Score

- Generate a single headline score from 0 to 100
- Pair it with ATS score and supporting signals
- Use it as the primary readiness metric across the product

#### 5. Job Matching

- Match analyzed profiles to relevant jobs
- Explain match strength and missing skills
- Surface ranked opportunities

#### 6. X-Factor Insights

- Generate differentiated personal-branding outputs
- Examples include recruiter-facing headline, networking DM, and positioning assets
- Turn analysis into career leverage, not just diagnostics

#### 7. Insight Panel

- Show strengths
- Show weaknesses
- Show missing skills
- Show recommendations and career-direction insight in one readable view

#### 8. Dashboard (minimal)

- Show core stats only
- Give the user a fast overview of score, matches, applications, and roadmap progress
- Route users into the next important actions

#### 9. Share System

- Let users share their score or analysis state
- Support public profile visibility and shareable link behavior
- Make growth loops native to the product

#### 10. API Layer

- Secure route handlers for upload, analysis, jobs, roadmap, interview, applications, billing, and user state
- Keep the product modular and front-end agnostic

#### 11. Database

- Persist users, resumes, analyses, jobs, matches, applications, roadmaps, interviews, and billing-adjacent user state
- Serve as the source of truth for all product progress

## 1. Product Snapshot

**CareerAI** is an AI placement engine designed to take students and early-career professionals from confused and underprepared to job-ready, applied, and interview-ready.

### Core positioning

- Not a tool. A placement engine.
- One platform that combines LinkedIn guidance, resume optimization, coaching, job matching, smart application workflows, and interview preparation into one guided journey.
- India-first in framing and job-market assumptions, while still portable to global early-career hiring markets.

### Core promise

- Help users become meaningfully more job-ready within 30 days.
- Frame the experience around a clear outcome, not scattered utilities.
- Use a measurable readiness score as both the product center and the acquisition hook.

### Psychological problem being solved

The product is designed around three user states at the same time:

- Fear: fear of rejection, ghosting, and not being good enough
- Desire: desire for a strong offer, brand-name company, and career momentum
- Confusion: uncertainty about what to fix first and what actually matters

## 2. Product Thesis

### Category thesis

Most career products are fragmented. Users must separately manage:

- resume building
- job discovery
- application tracking
- interview prep
- skill-gap learning
- outreach and follow-up

CareerAI wins by making these feel like one linear operating system instead of six disconnected tools.

### Product principle

Everything should feel like forward motion toward placement.

That means:

- every feature should either improve readiness, improve application quality, improve response rate, or improve interview conversion
- the user should always know their next best action
- the platform should reduce overwhelm by presenting a guided sequence, not a feature dump

## 3. Target Audience

### Primary audience

- Students
- Final-year graduates
- Early-career professionals with 0 to 3 years of experience

### Initial market

- India-first
- Strong relevance for engineering, data, product, and adjacent tech roles

### User segments

- Placement-focused college students
- Off-campus job seekers
- Users trying to switch role tracks, such as frontend to backend or support to data
- Ambitious users targeting high-bar companies such as Google, Zepto, Swiggy, or other top employers

## 4. Business Model

### Consumer model

- Freemium acquisition
- Free tier unlocks score, roadmap, and job matching entry points
- Paid tier unlocks high-intent conversion features such as ATS rewrite, advanced resume versions, batch apply, and premium interview prep

### B2B model

- Training and Placement Officer dashboard for colleges
- Recruiter talent search and verified score access
- Placement-cell and campus ambassador led distribution

## 5. Core Product Journey

CareerAI should be presented as a single 8-step journey.

| Step | Name | What happens |
| --- | --- | --- |
| 1 | Profile Input | User uploads resume, connects GitHub, and shares LinkedIn URL |
| 2 | AI Analysis | CareerAI generates a placement score, strengths, weaknesses, and missing skills |
| 3 | Job Matching | Platform ranks relevant jobs and explains each match |
| 4 | Resume Optimization | User gets ATS rewrites, diffs, and role-specific resume versions |
| 5 | Skill Gap Roadmap | AI builds a personalized plan to close readiness gaps |
| 6 | Smart Apply System | User batch applies with autofill, tailored resumes, and cover letters |
| 7 | AI Interview Prep | User practices with text and voice mock interviews and gets feedback |
| 8 | Career Dashboard | Platform tracks applications, responses, progress, and readiness |

## 6. Placement Score Engine

### Role in the business

The placement score is not just a feature. It is:

- the acquisition hook
- the core product metric
- the progress feedback loop
- the shareable viral object

### Core score

- Single readiness score from 0 to 100
- Recalculated weekly or when meaningful new signal arrives
- Role-specific weighting based on target role

Example:

- Backend roles weight system design and API depth more heavily
- Data roles weight SQL and analysis depth more heavily

### Six sub-scores

1. Technical skills depth
2. Project quality and complexity
3. Communication signals
4. Application materials quality
5. Experience relevance
6. Interview readiness

### Inputs by sub-score

- Technical skills depth: resume, GitHub, skills quiz
- Project quality and complexity: repo analysis, README quality, code signals, project depth
- Communication signals: resume writing quality, STAR structure, quantified impact
- Application materials quality: ATS health, completeness, cover letter quality
- Experience relevance: match between experience history and target roles
- Interview readiness: mock interview completion, confidence trend, answer quality

### UX layer

- Animated score reveal
- Strengths and weaknesses shown inline
- Missing skills explicitly tagged
- Percentile rank such as top 30% in a city and role cohort
- Historical score chart showing weekly movement
- WhatsApp nudge when score improves

### Viral shareability

Each user should be able to generate a shareable score card with:

- placement score
- percentile
- top strength
- target role
- social caption prompt such as "I'm 72% job-ready - try yours"

## 7. Profile and Onboarding

### Resume ingestion

- Support PDF and DOCX upload
- Parse into structured JSON
- Extract skills, projects, education, experience, and other profile signals
- Handle Indian resume formats, regional college naming, and imperfect formatting

### LinkedIn import

- Accept URL input
- Pull or allow manual entry for headline, current role, and summary

### GitHub analysis

- Analyze repositories, commits, languages, README quality, and project complexity
- Use GitHub as skill verification, not just a profile ornament

### Skills validation quiz

- Short adaptive skill quiz
- Used to verify claimed skills
- Difficulty adjusts based on prior answers

### Onboarding completion logic

- Profile completeness score
- Strong nudges to connect all profile sources
- Resume + GitHub + quiz should represent the "full signal" state

## 8. Job Matching Engine

### Core matching

- Match jobs against the full candidate profile
- Show a match percentage and clear breakdown
- Refresh job ranking daily

### Matching filters

- Backend
- Frontend
- Data
- Full-stack
- DevOps
- Product

### Match breakdown example

- Skills: matched
- Experience: matched
- Location: matched
- System design depth: missing

### Aspiration mode

Users can set a dream target role or company. CareerAI should then show:

- exact gap to target
- number of missing skills
- missing project requirements
- target readiness threshold for that role

The roadmap should auto-adjust when the aspiration changes.

### Salary intelligence

- Salary range per job listing
- City-adjusted salary framing
- Role-specific negotiation tips
- Visibility into which band the user likely qualifies for today

### Hidden job alerts

- Scrape public openings from LinkedIn and company career pages
- Surface fast-moving or less visible openings
- Notify users through email and WhatsApp

### Data sources

- Primary early source: Adzuna API
- Fallbacks: scraping, placement-cell inputs, direct company sources
- Long term: proprietary supply from recruiter relationships

## 9. Adaptive Skill Roadmap

### Product shape

- Personalized 30-day roadmap
- Week-by-week structure
- Living plan that adapts to progress, role changes, and missing-skill completion

### Example backend roadmap

- Week 1: SQL, HTTP, REST basics
- Week 2: portfolio project build
- Week 3: system design, security, deployment basics
- Week 4: mock interview sprint and batch apply sprint

### Daily engagement

- Three micro-tasks per day
- Around 30 minutes total
- Daily streaks
- Reminders, especially through WhatsApp
- Visible score gains when tasks are completed

### Learning resources

- Curated free resources only
- Official docs, YouTube, practice platforms
- Difficulty and time estimate tags

### Project builder

CareerAI should generate role-relevant portfolio project specs including:

- suggested tech stack
- resume-worthy feature list
- GitHub README template
- implementation guide

### DSA practice layer

- Daily algorithm problem recommendations
- Tailored to weak areas
- Difficulty adapts with history
- Deep links to practice platforms such as LeetCode or GeeksForGeeks

## 10. Resume Intelligence

### ATS analysis

- ATS score from 0 to 100
- Breakdown of keyword density, formatting, missing sections, and action-language quality
- Version-by-version tracking

### AI rewrite

- Full role-specific ATS optimization for a target job description
- Before and after diff
- Rationale for each change
- Keyword injection from JD
- STAR-format enforcement

### Example transformation

- Before: Worked on backend APIs
- After: Built 12 REST APIs handling 50K daily requests, reducing average response latency by 40%

### Resume version manager

- Maintain multiple role-specific resume variants
- Tag versions by role type
- Auto-select the right version while applying
- Show ATS score per version

### Bullet point improver

- Standalone tool for rewriting resume bullets
- Adds impact framing and quantified output where possible

## 11. Smart Apply System

### Batch apply

- Select up to 50 matched jobs
- Submit applications in one flow
- Autofill repetitive fields
- Auto-pick the best resume version by job type

### AI cover letters

- One unique cover letter per job
- Reads job description directly
- Editable before send
- Supports tone selection

### Application pipeline tracker

- Track stages from applied to offer or rejection
- Show response rate on dashboard
- Remind users to follow up if no response arrives

### Auto follow-up drip

- First follow-up after 7 days
- Second follow-up after 14 days
- Global and per-application opt-out

This feature is strategically important because it makes the platform valuable even when the user is offline.

## 12. Interview Preparation

### Text mock interviews

- Role-specific text Q and A
- Instant answer feedback
- Model answer comparison
- Confidence score per response
- Ten-question session pattern
- Session history

### Voice mock interviews

- Spoken answer capture
- Speech-to-text processing
- Filler word detection
- Pace analysis
- Confidence and tone signals
- Session report after completion

### Company-specific prep

Premium experience should support:

- company-specific question sets
- company culture-fit prep
- stack-aware technical prep
- known patterns from public interview experience data and alumni insights

### Interview readiness score

- Visible on dashboard
- Improves as practice sessions accumulate
- Feeds the overall placement score

## 13. Social, Proof, and Gamification

### Placement twins

Show anonymized examples of users with similar profiles who recently got placed. This is expected to be a major free-to-paid conversion driver.

### College leaderboard

- Optional weekly ranking by campus
- Shareable rank cards
- Competitive social comparison loop

### Progression mechanics

- XP system
- streaks
- progress thresholds
- unlock-style framing for stronger job opportunities

### Referral network

- Allow placed users or alumni to refer matched profiles
- Request and accept workflow
- Turns successful users into distribution

## 14. B2B Layer

### TPO dashboard

- Batch-wide readiness overview
- Skill-gap heatmaps
- Branch and graduation-year breakdowns
- Matching insights for which companies best fit the batch

### B2B pricing

- Estimated annual pricing per college: INR 50,000 to INR 2,00,000

### Strategic value

- One institutional sale can exceed months of consumer revenue
- Placement teams already operate in spreadsheets, so this is a strong workflow upgrade angle

### Recruiter layer

- Search verified student profiles
- Filter by role, college, graduation year, and AI score
- Revenue via pay-per-contact or subscription
- Student opt-in required for visibility

## 15. Growth and Acquisition Strategy

### Primary acquisition motion

- Landing page CTA should center on "Check your placement score"
- Value should be immediate and low-friction
- The score card becomes the sharing object that spreads through WhatsApp groups, LinkedIn, and Instagram

### Content engine

- Daily short-form and educational content
- Resume rejection myths
- Role-based 30-day roadmaps
- Career advice anchored to action

Every content asset should route back to the placement score.

### Campus distribution

- Campus ambassadors
- WhatsApp group penetration
- Placement-cell relationships

### Trust signals

- Students analyzed
- before-and-after outcomes
- recognizable recruiter or company logos
- social proof and success stories

## 16. Current Product Build Status

The following items are already built or substantially planned based on the recent CareerAI development sprint.

### Current MVP backbone available now

- Auth
- Resume upload
- Analysis engine
- Placement score
- Job matching
- X-factor insights
- Insight panel
- Minimal dashboard
- Share system
- API layer
- Database-backed persistence

### Operational features already built

- Resume upload
- PDF parsing
- Supabase storage
- AI analysis pipeline
- Analysis outputs: score, ATS score, strengths, weaknesses, missing skills, career path, experience level, recommendations
- Job matching with batch AI scoring
- Career roadmap generation with progress toggles
- Mock interview with AI feedback, history, and average score
- Application tracker with status management
- Cover letter generator with copy and download
- Billing page with usage bars and plan limits
- Profile and settings page with name editing
- Forgot password and reset password flows
- Resume version manager with active version and delete support
- Error boundary component
- SWR caching for dashboard performance

### Planned next: skills intelligence engine

- GitHub integration
- Repository and language stats fetch
- AI gap analysis against resume claims
- LeetCode public profile integration
- Daily problem recommendations
- Live ATS score lift from verified skill signals

### Proposed ATS composite formula

`Composite ATS Score = (Base Resume Score x 0.70) + GitHub Bonus (0-15) + LeetCode Bonus (0-15)`

### Additional planned modules

- AI career coach with persistent memory
- Resume battle mode
- Salary negotiation script generator
- Ghosting probability tracker
- Weekly skill pulse report
- LinkedIn cold outreach message generator
- Interview confidence trend tracker

## 17. Recommended Product Prioritization

### Phase 1: sharpen the activation loop

- Placement score
- Resume analysis
- Job match breakdown
- 30-day roadmap
- shareable score card

### Phase 2: improve conversion to job applications

- resume optimization
- resume versions
- AI cover letters
- application tracker
- follow-up reminders

### Phase 3: improve hiring conversion quality

- text interviews
- voice interviews
- interview readiness scoring
- company-specific interview prep

### Phase 4: improve retention and defensibility

- GitHub verification
- LeetCode integration
- placement twins
- college leaderboard
- hidden job alerts

### Phase 5: expand revenue layers

- TPO dashboard
- recruiter search
- referral graph

## 18. Product Principles and Non-Negotiables

- The product should always feel guided, not cluttered.
- The score should remain the center of both UX and marketing.
- Free value must be genuinely useful, not fake teaser value.
- Recommendations should feel specific and contextual, not generic.
- Whenever possible, the platform should do work in the background for the user.
- Trust is critical: explain why scores, matches, and recommendations exist.
- India-first details matter in parsing, job matching, and distribution strategy.

## 19. Success Metrics

### Consumer metrics

- score completion rate
- profile completion rate
- roadmap task completion rate
- resume optimization conversion rate
- application-to-response rate
- interview practice completion rate
- paid conversion from free score users

### Growth metrics

- score share rate
- referral rate
- campus ambassador acquisition efficiency
- WhatsApp reactivation rate

### B2B metrics

- colleges onboarded
- student activation per college
- recruiter search usage
- verified profile opt-in rate

## 20. Closing Statement

CareerAI should be built and marketed as a career operating system with a single visible promise: make users more placeable, faster.

The winning experience is not just smart analysis. It is a full loop:

- understand where the user stands
- show what is missing
- generate the fastest path to improvement
- help them apply at scale
- help them interview better
- keep showing measurable progress until they get hired

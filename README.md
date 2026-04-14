# Pantheon HDS

**Honor · Democracy · Skill**

> Where 100% is just the beginning.

![Pantheon Logo](public/logo-hero.png)

---

## What is Pantheon?

Pantheon is a place for players who love to get the most out of a game. Where 100% Steam achievements are just a warm-up.

Usually, 100% is the end, but not here.

Here, everything is just beginning.

Here, a player is like Hercules, who completed the 12 labors, only instead of labors, there are challenges created by other players. And the more challenges they complete, the closer they get to Legend status. When will you be able to sit back and say — I got everything and more out of this game!

**Live platform:** https://pantheonhds.com

---

## The Story

I was madly in love with games. I adored them, I lived for them. I didn't just beat each game; I drank it in, like a thirsty person in the desert.

But after I finished a game, I felt empty inside. The achievements I earned on Steam gave me no satisfaction. I felt like a student who passed an exam and immediately forgot everything.

And then I thought that after every game, I wanted to be left with an aftertaste I'd remember for a long time. That I'd done something truly challenging. And for there to be a place for people like me, who love to push games to the limit.

I searched for such a place. And I didn't find it. So I decided to build it myself.

*— Voland, Founder*

---

## How It Works

```
Connect Steam
↓
Automatic rank based on achievement completion
Bronze → Silver → Gold (100% achievements)
↓
Complete community challenges
Verified by real judges (anonymous, blind voting)
↓
Earn higher ranks
Platinum → Diamond → Master → Grandmaster
↓
Become a Legend
Community vote only. Forever.
```

---

## Six Paths

Pantheon is not just for elite players. There is a place for everyone.

| Path | Description |
|------|-------------|
| **Warrior** | Completes challenges, earns ranks |
| **Judge** | Reviews challenge submissions, verified by rank |
| **Teacher** | Guides and mentors others |
| **Lorekeeper** | Studies game lore, takes exams |
| **Chronicler** | Records platform history |
| **Orator** | Debates and arguments |

Paths are not exclusive — one player can walk multiple paths simultaneously.

> **Currently available:** Warrior. Other paths are in development and will be released gradually. This is an open project — the community shapes what comes next.

---

## Current Status

**This project is in active development and built in public.**

### What works:
- ✅ Steam OpenID authentication
- ✅ Automatic rank assignment via Steam API
- ✅ Submission and judge voting flow (challenges in development)
- ✅ Judge application and assignment system
- ✅ Anonymous blind voting by judges
- ✅ Admin panel for platform management
- ✅ Player profiles with statues
- ✅ Public shareable profile pages (`/u/username`)
- ✅ Pantheon leaderboard
- ✅ E2E test suite (Playwright)

### In development:
- 🔨 Discord webhook notifications
- 🔨 Mobile adaptation
- 🔨 Guild system
- 🔨 League system with Legends

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + TypeScript + Vite 8 |
| State / Cache | TanStack Query v5 |
| Backend | Supabase Edge Functions (Deno) |
| Database | PostgreSQL (Supabase) |
| Hosting | Vercel |
| Auth | Steam OpenID |
| Testing | Playwright (E2E) + Vitest (unit + integration) |
| CI/CD | GitHub Actions |
| Monitoring | Sentry |

---

## Local Development

### Prerequisites
- Node.js 18+
- A Supabase project

### Setup

```bash
git clone https://github.com/pantheon-hds/core.git
cd core
npm install
```

Create `.env.local` in the project root:

```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Find your keys at: Supabase Dashboard → Settings → API

```bash
npm run dev      # dev server at localhost:3000
npm run build    # production build
npm test         # unit tests
npm run test:e2e # E2E tests (requires build first)
```

---

## Project Structure

```
src/
├── App.tsx                          # Root component, routing, QueryClient
├── components/
│   ├── dashboard/                   # Dashboard sub-components
│   │   ├── ChallengeDetailModal.tsx # Challenge info + submit button
│   │   ├── ChallengeList.tsx        # Tier filter + challenge cards
│   │   ├── RankCard.tsx             # Player rank, statues, progress bar
│   │   └── SubmitModal.tsx          # Video URL + comment submission form
│   ├── layout/
│   │   └── LandingLayout.tsx        # Shared wrapper for landing pages
│   ├── pages/                       # Route-level page components
│   │   ├── Admin.tsx                # Admin panel
│   │   ├── Dashboard.tsx            # Main player dashboard
│   │   ├── FounderGate.tsx          # Secret founder login page
│   │   ├── JudgePanel.tsx           # Judge voting interface
│   │   ├── LandingHome.tsx          # Home page
│   │   ├── LandingRanks.tsx         # Ranks info page
│   │   ├── LandingGames.tsx         # Games info page
│   │   ├── LandingBeta.tsx          # Beta waitlist page
│   │   ├── LandingFAQ.tsx           # FAQ page
│   │   ├── NotFound.tsx             # 404 page
│   │   ├── Pantheon.tsx             # Public leaderboard
│   │   ├── Profile.tsx              # Personal profile
│   │   ├── PublicProfile.tsx        # Shareable /u/username page
│   │   ├── SteamCallback.tsx        # Steam OpenID callback handler
│   │   └── WelcomeScreen.tsx        # Login screen with beta gate
│   └── ui/                          # Shared reusable components
│       ├── ConfirmDialog.tsx
│       ├── ErrorBoundary.tsx
│       ├── Sidebar.tsx
│       ├── StatueSVG.tsx
│       ├── SteamAuth.tsx
│       └── Toast.tsx
├── constants/
│   └── ranks.ts                     # Rank tiers, colors, ordering
├── hooks/                           # Custom React hooks
│   ├── useChallenges.ts             # Fetch challenges + games via react-query
│   ├── useSubmissions.ts            # Submissions state + optimistic updates
│   ├── useToast.ts                  # Toast notification state
│   └── useUserData.ts               # DB user, ranks, statues via react-query
├── services/                        # External integrations
│   ├── adminService.ts              # Admin operations via Edge Function
│   ├── challengeService.ts          # Challenge + game queries
│   ├── judgeService.ts              # Judge panel operations
│   ├── pantheonService.ts           # Pantheon leaderboard queries
│   ├── profileService.ts            # Profile + judge application
│   ├── steamApi.ts                  # Steam Web API calls
│   ├── submissionService.ts         # Submission CRUD operations
│   └── supabase.ts                  # Supabase client + core DB functions
├── types/
│   ├── database.types.ts            # Supabase DB types (maintained manually)
│   └── index.ts                     # Shared TypeScript interfaces
└── utils/
    ├── banUtils.ts                  # Ban status helpers
    ├── judgeSelection.ts            # Judge selection algorithm
    ├── judgeVoting.ts               # resolveVotes() — voting majority logic
    ├── rankProgress.ts              # Rank progress calculation
    └── videoUrl.ts                  # Video URL validation (YouTube + Twitch)
```

---

## Database Schema

| Table | Description |
|-------|-------------|
| `users` | Registered players (Steam ID, username, path, judge status) |
| `ranks` | Player ranks per game (tier, game ID, earned date) |
| `statues` | Statues selected by players for their profile |
| `challenges` | Community challenges (title, tier, game, description) |
| `games` | Supported games (title, Steam App ID) |
| `submissions` | Rank submission requests (video URL, status, player ID) |
| `submission_judges` | Judge assignments per submission (blind, anonymous) |
| `judge_applications` | Applications to become a judge |
| `waitlist` | Early access waitlist signups |

All tables have Row Level Security (RLS) enabled via Supabase.

---


## How to Contribute

### Play and test
Visit https://pantheonhds.com, connect your Steam account, and try everything. Report bugs as [GitHub Issues](https://github.com/pantheon-hds/core/issues/new/choose).

### Contribute code
1. Fork the repository
2. Create a branch: `git checkout -b feature/your-feature`
3. Make your changes
4. Open a Pull Request

### Support the project
This project has no investors and no advertising. If you believe in the idea, you can support it voluntarily.

<details>
<summary>Support options</summary>

**Bitcoin (BTC):** `bc1qjv5jvf20u83fa6yt9ms5tejmz9qh72xqjjgwvu`

**USDC (Solana):** `4xid9ZKsyw65Ru73foSC1P6Sa9ZTe9zeZYfEgNHh5bQk`

**USDT (Ethereum ERC-20):** `0x4BeB7B171ad948D3586464C77c28EdE22c80542D`

</details>

---

## Hall of Contributors

*Your name will appear here when your first contribution is merged.*

---

## Contacts

- **Email:** pantheon.honor.democracy.skill@gmail.com
- **X (Twitter):** x.com/pantheonhds
- **Platform:** pantheonhds.com

---

## License

MIT License — free to use, modify, and distribute.

---

**Honor · Democracy · Skill**

*The idea is released into the world. The rest belongs to you.*

# Pantheon HDS

**Honor · Democracy · Skill**

> Where 100% is just the beginning.

![Pantheon Logo](public/logo-hero.png)

---

## What is Pantheon?

Pantheon is a community-driven achievement platform for players who love games deeply.

You got 100% achievements. Now what?

Most platforms stop there. Pantheon begins there.

Here, players earn ranks by completing community-created challenges — verified by real players, not algorithms. The community decides who is a Legend. No money. No pay-to-win. Just skill.

**Live platform:** https://pantheonhds.com

---

## The Story

I have loved video games my entire life.

For years, my way of honoring a game was simple: get 100%. Every achievement. Every collectible. Every secret.

But after the last achievement popped — I felt something unexpected. Emptiness. The game was over. There was nowhere left to go.

And I looked around. I had done something genuinely hard. But where could I show it? Nobody cared about a Steam profile screenshot.

So I asked myself: **What if 100% achievements isn't the end of a game — but only the beginning?**

Pantheon is my answer.

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

## Seven Paths

Pantheon is not just for elite players. There is a place for everyone.

| Path | Description | Statue |
|------|-------------|--------|
| **Warrior** | Completes challenges, earns ranks | Knight with sword |
| **Master** | Own pace, no competition | Monk in meditation |
| **Teacher** | Guides and mentors others | Sage with lantern |
| **Lorekeeper** | Studies game lore, takes exams | Scholar with scroll |
| **Chronicler** | Records platform history | Archivist with book |
| **Creator** | Fan art, music, mods | Artist with brush |
| **Orator** | Debates and arguments | Tribune with raised hand |

Paths are not exclusive — one player can walk multiple paths simultaneously.

> **Currently available:** Warrior path (challenges and ranks). Other paths are in development and will be released gradually. This is an open project — the community shapes what comes next.

---

## Current Status

**This project is in active development and built in public.**

### What works:
- ✅ Steam OpenID authentication
- ✅ Automatic rank assignment via Steam API
- ✅ Community challenge submission system
- ✅ Judge application and assignment system
- ✅ Anonymous blind voting by judges
- ✅ Admin panel for platform management
- ✅ Player profiles with statues
- ✅ Public shareable profile pages (`/u/username`)
- ✅ Pantheon leaderboard
- ✅ Sandbox testing environment
- ✅ E2E test suite (Playwright)

### In development:
- 🔨 Persistent auth via Supabase Auth
- 🔨 Discord webhook notifications
- 🔨 Mobile adaptation
- 🔨 Guild system
- 🔨 League system with Legends

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React + TypeScript + Vite |
| State / Cache | TanStack Query (react-query) |
| Backend | Supabase Edge Functions (Deno) |
| Database | PostgreSQL (Supabase) |
| Hosting | Vercel |
| Auth | Steam OpenID |
| Testing | Playwright (E2E) + Jest (unit) |

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
npm start        # dev server at localhost:3000
npm run build    # production build
npm test         # unit tests
npm run test:e2e # E2E tests (requires npm start running)
```

---

## What We Will Never Do

- Sell ranks or statues for money
- Accept advertising that influences content
- Sell the platform to a corporation without community consent
- Remove a Legend statue without a community vote
- Use AI to verify Legend rank — always humans only
- Change the three core principles

---

## How to Contribute

### Play and test
Visit https://pantheonhds.com, connect your Steam account, and try everything. Report bugs as [GitHub Issues](https://github.com/pantheon-hds/core/issues/new/choose).

### Suggest challenges
What do YOU consider worthy of a Platinum rank in your favourite game? Open an issue with the tag `challenge-suggestion`.

### Contribute code
1. Fork the repository
2. Create a branch: `git checkout -b feature/your-feature`
3. Make your changes
4. Open a Pull Request

### Become a judge
If you have Platinum rank in any supported game — apply through your Profile page on the platform.

### Support the project
This project has no investors and no advertising. If you believe in the idea, you can support it voluntarily. Details in the platform FAQ.

---

## Hall of Contributors

*Your name will appear here when your first contribution is merged.*

---

## Community

- **Discord:** discord.gg/pantheonhds
- **Reddit:** reddit.com/r/PantheonHDS
- **X (Twitter):** x.com/pantheonhds
- **Platform:** pantheonhds.com

---

## License

MIT License — free to use, modify, and distribute.

---

**Honor · Democracy · Skill**

*The idea is released into the world. The rest belongs to you.*

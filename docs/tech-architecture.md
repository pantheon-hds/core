# Tech Architecture

## Philosophy

Simple at start. Scalable by design. Open source from day one.
No over-engineering. Build what is needed. Add what is proven necessary.

---

## Stack — Phase 1

### Frontend
- **Framework:** React
- **Styling:** Tailwind CSS
- **Hosting:** Vercel (free tier at start)

### Backend
- **Runtime:** Node.js
- **Framework:** Express
- **Hosting:** Railway or Render (free tier at start)

### Database
- **Primary:** PostgreSQL (via Supabase — free tier at start)
- **Auth:** Supabase Auth + Steam OpenID

### Video submission
- Player uploads video to YouTube as unlisted
- Platform stores the link only — no video hosting costs
- No storage costs at Phase 1

---

## Steam Integration

### How it works
1. Player logs in via Steam OpenID
2. Platform requests permission to read achievements
3. Steam API call: `GetPlayerAchievements` + `GetSchemaForGame`
4. If 100% achievements unlocked → Gold rank auto-assigned
5. Checks run on login and on demand

### Requirements
- Steam profile must be set to public
- Player is prompted to make profile public on registration
- If profile is private — Gold cannot be verified, player is notified

### Steam Stats API (Phase 2+)
- `GetUserStatsForGame` returns in-game statistics
- Death count, item usage, time played, boss kills
- Enables automatic verification of specific challenge conditions
- Not all games support this — used where available

---

## Rank assignment

| Rank | Method | Automation |
|------|--------|------------|
| Bronze | Manual or partial Steam | Semi-auto |
| Silver | Partial Steam achievements | Semi-auto |
| Gold | 100% Steam achievements | Full auto |
| Platinum | Video + blind vote (3/5) | Manual + system |
| Diamond | Video + blind vote (4/5) | Manual + system |
| Legend | Community open vote | Manual |

---

## Blind anonymous voting system

### Flow
1. Player submits video link + challenge name
2. System creates anonymous submission — strips name, avatar, history
3. System selects 5 random Gold+ players from same game
4. Each judge receives notification with anonymous video only
5. Judges vote independently — results hidden until all 5 vote
6. On deadline — votes revealed, decision applied automatically
7. Identity revealed to judges after decision

### Appeal flow
1. Rejected player can trigger one appeal
2. System selects 5 completely new random judges
3. Same blind anonymous process
4. Decision is final — no second appeal

### Judge selection rules
- Must have Gold rank or above in the specific game
- Cannot be on the submitter's friends list (Steam friends API)
- Cannot have voted on this player's submissions in last 30 days
- Must have reviewed at least 3 submissions before (quality filter)

---

## Database schema (simplified)

### Users
- id, steam_id, username, created_at
- profile_public (boolean)

### Ranks
- id, user_id, game_id, rank_level, granted_at, method

### Challenges
- id, game_id, title, description, tier, created_by, votes, status

### Submissions
- id, user_id, challenge_id, video_url, status, created_at

### Votes
- id, submission_id, judge_id (anonymized), vote, created_at, revealed_at

### Statues
- id, user_id, rank_id, statue_type, granted_at, unique (boolean)

---

## Security

- No passwords stored — Steam OpenID only
- Video links stored, not video files
- Judge identities encrypted until vote reveal
- Save file uploads scanned for modifications (Phase 2)
- Rate limiting on all submission endpoints
- Open source code — community can audit everything

---

## Cost at Phase 1

| Service | Cost |
|---------|------|
| Vercel (frontend) | Free |
| Railway (backend) | Free tier |
| Supabase (database + auth) | Free tier |
| Steam API | Free |
| Video hosting | Zero — YouTube unlisted |
| **Total** | **$0/month** |

When traffic grows — upgrade Supabase and Railway.
Community Supporter Pack funds cover infrastructure costs.

---

## Open source

- Full codebase public on GitHub from day one
- MIT License
- Contribution guidelines in CONTRIBUTING.md
- No hidden logic — especially voting and rank assignment
- Community can fork and run their own instance at any time

---

## Future automation (Phase 2+)

- Save file parser — detect stats without manual review
- Steam Stats API — auto-verify specific challenge conditions
- Developer partnership API — game sends signed verification token
- Anti-cheat hash check — detect modified save files
- OBS widget — live rank display for streamers


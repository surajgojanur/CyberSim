# CyberSim

**Live multiplayer cybersecurity training where every participant makes the call before the answer is revealed.**

CyberSim is a real-time training platform for running short, scenario-based cybersecurity drills. An admin launches a session, participants join with a code, everyone answers privately under a synchronized timer, and the server controls lock, reveal, scoring, and final results.

## Problem

Most security awareness training is passive: learners read content, click through slides, or answer questions after seeing hints from the group. That does not reflect real incident-response pressure, where individuals must make independent decisions with incomplete information.

## Solution

CyberSim turns cybersecurity scenarios into live multiplayer drills:

- Admins create a session and share a join code.
- Participants answer privately during a timed round.
- The server locks answers, reveals the correct response, and updates scores.
- Final results are persisted and can be viewed after the session ends.

The MVP is built to preserve training integrity: no correct answer, explanation, or leaderboard is sent before the reveal phase.

## Key Features

- Admin login, session creation, and live lobby
- Admin-managed reusable question sets with custom scenarios
- Participant join flow with 6-character session codes
- Real-time Socket.IO rounds with a server-authoritative timer
- Private one-answer-per-round submissions
- Lock and reveal phases with correctness-first scoring and early reveal after all active participants answer
- Live admin participant presence for connected, disconnected, and left-session states
- Leaderboard snapshots only after reveal
- Final results page backed by persisted SQLite data
- Reconnect/rejoin recovery using participant tokens
- Multi-tab takeover handling for participants and admins
- Single-process restart recovery for active/locked rounds
- Demo reset command and automated smoke test

## What Makes It Different

- **Independent decision-making:** participants submit privately and cannot see each other's answers during the active round.
- **No answer leakage:** correct answers and explanations are excluded from active-round and reconnect payloads until reveal.
- **Server-authoritative flow:** timers, locking, reveal, scoring, and final rankings are computed by the backend, not by client state.
- **Demo-resilient recovery:** refreshes, reconnects, duplicate tabs, and simple server restarts are handled for realistic demos.

## Product Flow

1. Admin logs in and creates a session.
2. Admin selects a saved question set, or creates a reusable custom set from the session setup page.
3. Participants join with the displayed code and a display name.
4. Admin starts a round.
5. Participants answer a cybersecurity scenario under the timer.
6. Server locks the round when time expires, the admin force-locks, or the admin reveals early after all active participants answer.
7. Server reveals the correct answer, explanation, score deltas, and leaderboard snapshot.
8. Admin starts the next round or ends the session.
9. Admin and participants view final results.

## Architecture Overview

- **React/Vite client:** renders admin, participant, reveal, and results views.
- **Zustand store:** keeps client identity and the current server-supplied session state.
- **Express API:** handles auth, session creation, join-code validation, health, and final results.
- **Socket.IO server:** owns live lobby, round lifecycle, answer submission, reconnect, takeover, and session end events.
- **SQLite + Better-SQLite3:** persists sessions, participants, reusable question sets, questions, rounds, answers, scores, and final results.
- **Recovery layer:** restores future timers and resolves expired/locked rounds on server boot for single-process demo reliability.

See [ARCHITECTURE.md](./ARCHITECTURE.md) for the engineering summary.

## Tech Stack

- Frontend: React, Vite, Tailwind, Zustand, Socket.IO client
- Backend: Node.js, Express, Socket.IO
- Database: SQLite with Better-SQLite3
- Validation: Zod
- Tests: Node test runner

## Local Setup

```bash
npm install
npm run reset-demo
npm run dev
```

Local URLs:

- Frontend: http://localhost:5173
- Backend: http://localhost:4000

Seeded local admin:

- Username: `admin`
- Password: `admin123`

## Demo Reset

Reset the local SQLite database and reseed the admin user plus starter questions:

```bash
npm run reset-demo
```

## Smoke Test

With the app running:

```bash
npm run smoke
```

Against a deployed backend:

```bash
SMOKE_BASE_URL=https://your-host.example npm run smoke
```

The smoke test covers login, session creation, join-code validation, participant join, round start, answer submission, reveal, session end, and final results retrieval.

## Useful Scripts

```bash
npm run dev          # run server and client together
npm run dev:server   # run only the API/Socket.IO server
npm run dev:client   # run only the Vite frontend
npm run reset-demo   # reset and reseed the local demo database
npm run smoke        # run the core happy-path smoke test
npm test             # run backend tests
npm run build        # build the frontend
npm start            # start the server
```

## Deployment Notes

Single-process deployment is supported by serving `client/dist` from Express:

```bash
npm install
npm run build
NODE_ENV=production \
SERVE_CLIENT=true \
CLIENT_ORIGIN=https://your-host.example \
AUTH_SECRET=replace-with-a-long-random-secret \
SEED_ADMIN_PASSWORD=replace-demo-password \
npm start
```

Split deployment is also supported. Deploy `client/` as a static Vite app, deploy `server/` as the API/Socket.IO service, set `VITE_API_URL` for the frontend build, and set `CLIENT_ORIGIN` on the backend.

## Screenshots / Demo

Screenshots can be added under [docs/screenshots](./docs/screenshots/).

Suggested captures:

- Admin session lobby
- Participant join page
- Active question round
- Reveal with explanation and leaderboard
- Final results page

See [DEMO.md](./DEMO.md) for a 2-3 minute live demo script.

## Current Limitations

- MVP seeded-admin auth, not a full identity system
- No analytics dashboards
- No CSV export
- No cross-session reporting
- No prior-session archive browsing
- No question set import/export
- Timer recovery is single-process only, not distributed

## Future Improvements

- Saved session summaries and replayable result views
- Bulk question import/export
- Team mode and role-based incident scenarios
- Deployment templates for common hosting providers
- Browser-based end-to-end test for the full live flow

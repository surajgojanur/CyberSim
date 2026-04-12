# CyberSim Demo Guide

This is a 2-3 minute live demo flow for GitHub reviews, hackathons, and project walkthroughs.

## Setup

```bash
npm install
npm run reset-demo
npm run dev
```

Open:

- Admin: http://localhost:5173/#/admin
- Participant: http://localhost:5173/#/join in another browser window or profile

Local admin credentials:

- Username: `admin`
- Password: `admin123`

## Demo Flow

1. **Admin login**
   - Click into the admin page.
   - Log in with `admin` / `admin123`.
   - Say: "The MVP uses a seeded admin for demo purposes; the backend still signs admin session tokens."

2. **Create a session**
   - Enter a session title and create the lobby.
   - Point out the join code.
   - Say: "The admin owns the live session, and the join code is what participants use to enter."

3. **Participant join**
   - In the participant window, enter the join code and a display name.
   - Show the participant waiting room.
   - Return to the admin window and show the live participant list.
   - Say: "Membership is server-tracked and updates in real time."

4. **Start a round**
   - Click **Start round** in the admin view.
   - Show the participant receiving the question at the same time.
   - Say: "The server starts the round and owns the timer. The client only renders the state it receives."

5. **Submit an answer**
   - In the participant window, choose an answer and submit.
   - Show that the participant is locked after submission.
   - In the admin window, show answer progress only.
   - Say: "The admin sees progress, not participant answers. The participant can submit only once."

6. **Lock and reveal**
   - Click **Force lock** or wait for the timer.
   - Show the reveal screen with the correct answer and explanation.
   - Say: "Correct answers and explanations are never sent before reveal."

7. **Leaderboard**
   - Show the leaderboard after reveal.
   - Say: "Scores are computed server-side after lock, then published as a reveal snapshot."

8. **End session**
   - Click **End session**.
   - Show final results on both admin and participant windows.
   - Say: "Final results come from persisted SQLite data, not transient frontend state."

## Optional Robustness Moment

Show one of these if time allows:

- Refresh the participant tab during a question. It should restore the allowed current state.
- Open the same participant session in another tab. The old tab should show the takeover warning.
- Restart the server during a running round, then reconnect. The recovery layer will reschedule or resolve active rounds for single-process demos.

## Fallback Notes

- If a browser flow gets out of sync, run `npm run reset-demo` and restart the demo.
- If the frontend cannot connect, confirm the backend is on http://localhost:4000 and the frontend is on http://localhost:5173.
- If a join name is rejected, use a different display name; duplicate names are blocked per session.
- If you need a quick verification without clicking through the UI, run `npm run smoke` while the app is running.

# CyberSim Architecture

CyberSim is a real-time training MVP built around a server-authoritative session and round state machine.

## Components

- **React client:** renders admin, participant, reveal, and final results views.
- **Zustand store:** stores identity tokens and the latest server-supplied state.
- **Express API:** handles admin auth, session creation, question-set management, join-code validation, health checks, and final results retrieval.
- **Socket.IO server:** handles live lobby updates, round lifecycle events, answer submission, reconnect, tab takeover, and session ending.
- **SQLite database:** persists admins, sessions, participants, reusable question sets, questions, answer options, rounds, answers, and scores.

## Authority Model

The backend is the source of truth for:

- Session phase
- Round phase
- Timer start and end timestamps
- Answer acceptance and duplicate rejection
- Lock and reveal transitions
- Correctness and score computation
- Leaderboard and final results ordering
- Saved question sets and selected session question order
- Participant presence state

Clients render state and submit intent. They do not calculate phase, score, correctness, or rankings.

## Round State Machine

Session states:

```text
lobby -> question -> locked -> reveal -> question -> ... -> ended
```

Round states:

```text
question -> locked -> reveal
```

The admin can start a round from `lobby` or `reveal`. Rounds lock when the server timer expires, when the admin force-locks, or when the admin uses early reveal after all eligible participants have answered. Reveal happens after lock and scoring.

For early reveal, eligibility is server-side: participants who have explicitly left are excluded, and otherwise the active count includes connected participants plus any participant who already submitted for that round. This lets a disconnected, unanswered participant stop blocking early reveal while keeping an already submitted answer in the round.

## Answer Privacy

During `question` and `locked` phases, participant payloads include only:

- Session identity
- Current round id
- Question title/scenario/options
- Timer end timestamp
- Whether that participant already submitted
- That participant's submitted answer id, if any

They do not include:

- Correct answer id
- Explanation
- Other participants' answers
- Admin-only progress details
- Leaderboard data

Correct answer, explanation, score delta, and leaderboard are sent only during `reveal` or final results.

## Scoring And Reveal

After lock, the server evaluates stored answers against `answer_options.is_correct`.

Current scoring model:

- Correct answer: 1000 base points
- Speed bonus: up to 500 points
- Wrong or unanswered: 0 points

Scores are stored in `answers.score` and accumulated in `participant_scores`. The reveal payload includes the correct answer, explanation, participant result, and leaderboard snapshot.

## Reconnect And Takeover

Participants receive a reconnect token when they join. On refresh, the client sends `rejoin_session { socketToken }`. The server validates the token and returns a phase-safe restore payload.

For duplicate tabs, the newest socket for a participant or admin session takes ownership. The previous socket receives `session_taken_over` and is disconnected.

## Restart Recovery

On server boot, the recovery layer inspects persisted rounds:

- Future `question` rounds are rescheduled.
- Expired `question` rounds are locked and revealed.
- `locked` rounds are revealed.

This is intentionally single-process recovery for demos, not a distributed scheduler.

## Design Tradeoffs

- SQLite keeps the MVP easy to run and reset locally.
- Seeded admin auth keeps demo setup simple; production config validation blocks obvious unsafe defaults.
- Socket.IO keeps real-time flow compact and understandable.
- Recovery is intentionally lightweight and scoped to one server process.

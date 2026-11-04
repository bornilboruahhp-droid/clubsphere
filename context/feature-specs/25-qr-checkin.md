Add self check-in through a QR code that managers display at the event.

## Token

Create `lib/events/checkin-token.ts`.

- A token is `HMAC-SHA256(CHECKIN_SECRET, eventId + ":" + bucket)` encoded as base64url, where `bucket` is `floor(now / 60 seconds)`.
- Verification accepts the current bucket and the two previous buckets, using a timing-safe comparison.
- Add `CHECKIN_SECRET` to `.env.example`. Do not log it.

## Routes

- `GET /api/events/[eventId]/checkin-code`: managers and admins. Returns the check-in URL `/events/[eventId]/check-in?t=<token>` for the current bucket.
- `POST /api/events/[eventId]/check-in`: body `{ token }`. Any signed-in user.

Check-in rules:

- Valid only from 30 minutes before `startsAt` until 60 minutes after `endsAt`, and only for PUBLISHED events.
- The caller must have a `REGISTERED` or `PRESENT` registration. Unregistered users get `409` with a clear message. Do not auto-register.
- `REGISTERED` becomes `PRESENT` with `checkedInAt` and `statusChangedAt`. `PRESENT` is idempotent success.
- Write audit entry `attendance.checked_in`.

## UI

1. Manager QR dialog.

   Add "Show check-in QR" on the event manage page. Render a large QR code with `qrcode.react`, refresh the code every 30 seconds, and make it readable on a projector (high contrast, centered, large). Use tokens only around the QR, and render the QR itself in black on white for scan reliability.

2. Student check-in page.

   Create `app/(app)/events/[eventId]/check-in/page.tsx`. Unauthenticated users sign in and return to the same URL. The page calls the check-in route once and shows success, already checked in, not registered, or expired.

## Scope Limits

- No camera scanner inside the app. Students use their phone camera, which opens the URL.

## Check When Done

- A registered student who scans the QR becomes PRESENT
- Expired, wrong-event, and tampered tokens are rejected
- Unregistered users are told to register and are not registered automatically
- Rotating codes stop working after the bucket window passes
- `npm run build` passes

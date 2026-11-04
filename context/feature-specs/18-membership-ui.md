Build the membership screens. Backend exists from spec 17.

## Implementation

1. Join control.

   Create `components/clubs/join-button.tsx` on the club header with these states: Join, Request pending (with cancel via leave), Member (with Leave in a menu), and hidden for the President. Leaving requires an `AlertDialog`.

2. Members tab.

   Fill the Members tab on the club page:
   - roster table (cards on mobile) with avatar, name, role chip, joined date
   - managers and officers also see email and student ID columns
   - search by name

3. Requests view.

   For managers, add a Requests sub-tab listing PENDING members with Approve and Reject actions and a pending count badge.

4. Role management.

   For the President, add a per-row actions menu: Make Treasurer, Make Secretary, Make Member, Remove. Show a confirmation naming who will be replaced when an office is already held. Removing requires an `AlertDialog`.

5. Dashboard widget.

   On `/dashboard`, add a "My clubs" card listing the user's active clubs with role chips.

## Scope Limits

- No changes to the membership API
- No election-based presidency transfer

## Check When Done

- Each role sees only the actions it may perform
- Actions update the UI without a full reload
- Destructive actions ask for confirmation
- Mobile layout works in both themes
- `npm run build` passes

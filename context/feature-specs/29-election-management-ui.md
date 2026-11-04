Build the election screens for officers and members, excluding the ballot and results. Backend exists from spec 28.

## Implementation

1. Elections tab.

   Fill the Elections tab on the club page:
   - list of elections with `StatusBadge`, cycle year, and key dates
   - officers see a "New election" button
   - past PUBLISHED elections appear in an Archive section

2. Create and edit form.

   `components/elections/election-form.tsx` with title, cycle year, and the three date-time fields (institution timezone in, UTC out). Show validation messages for window ordering.

3. Election page.

   Create `app/(app)/elections/[electionId]/page.tsx`:
   - header with title, club, `StatusBadge`
   - a timeline stepper (Nomination, Voting, Count, Published) showing the current stage and dates
   - candidate list showing name and statement; officers also see PENDING candidates with Approve and Reject buttons
   - a "Nominate myself" dialog for ACTIVE members during NOMINATION, and a Withdraw action
   - placeholder panels for the ballot (spec 30) and results (spec 31)

4. Officer actions.

   Status buttons: Open nominations, Open voting, Close voting, Cancel election. Each uses an `AlertDialog` that states the consequence, for example "Members will be notified and can start voting".

## Scope Limits

- No ballot, no tally, no results
- Do not change election APIs

## Check When Done

- Officers can run the full lifecycle from the UI
- Members see only what they may and can self-nominate or withdraw
- Invalid actions are hidden or disabled
- Works on mobile in both themes
- `npm run build` passes

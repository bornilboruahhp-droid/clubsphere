Build the review queue for advisors and admins. Backend exists from spec 13.

## Implementation

1. Reviews page.

   Create `app/(app)/reviews/page.tsx` as a Server Component. Redirect or `notFound()` for users who are not ADVISOR or ADMIN. Fetch the queue through `lib/data/reviews.ts`.

2. Queue list.

   Table on desktop, stacked cards on mobile. Columns: club name, proposer, department, submitted date, stage.

3. Review panel.

   Create `components/clubs/review-dialog.tsx` (client):
   - club description, objectives, proposer details
   - Approve and Reject buttons
   - comment textarea, required for rejection
   - confirmation before submitting
   - toast on success and a router refresh

4. History.

   Below the queue, show recently decided reviews by this user (last 20) with their decision and date.

5. Empty state when the queue is empty.

## Scope Limits

- No changes to the approval API
- No bulk actions

## Check When Done

- Advisors see only their assigned clubs; admins see only clubs awaiting final approval
- Approving or rejecting updates the queue without a full reload
- Rejection without a comment is blocked in the UI and the API
- `npm run build` passes

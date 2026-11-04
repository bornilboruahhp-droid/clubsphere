Build the club registration form and the submission status views. Backend routes exist from spec 11.

## Implementation

1. Registration page.

   Create `app/(app)/clubs/new/page.tsx` with a client form using shadcn `Form` and the shared Zod schema:
   - name, description
   - advisor `Select` populated from `GET /api/advisors`
   - objectives repeater (add and remove rows, 1 to 5)
   - Submit button with loading state

   Show field errors from the API (including the duplicate name error). On success, toast and redirect to `/clubs/[clubId]`.

2. Approval timeline.

   Create `components/clubs/approval-timeline.tsx` showing the two stages (Advisor review, Admin review) with status badge, reviewer name, comment, and date. Stages not yet reached show as upcoming.

3. Submission status view.

   Create the first version of `app/(app)/clubs/[clubId]/page.tsx`:
   - header with club name and `StatusBadge`
   - description and objectives
   - the approval timeline when the club is PENDING or REJECTED and the viewer may see it
   - a `notFound()` for clubs the viewer cannot see

4. Entry points.

   Add a "Register a club" button on `/clubs`.

## Scope Limits

- No club directory yet (spec 15)
- No tabs on the club page yet
- No file upload field

## Check When Done

- A user with a complete profile can submit and land on the status page
- Validation errors render per field
- Rejected and pending timelines render correctly
- Works on mobile widths in both themes
- `npm run build` passes

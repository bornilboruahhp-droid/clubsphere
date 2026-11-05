# MVP Election Module Skip Directive

> **Scope**: Feature Specs 27 through 31  
> **Status**: **SKIPPED FOR MVP** (Deferred to v2.0)  
> **Target**: AI Agents and Developers working on ClubSphere  

---

## 1. Directive for AI Agent

All implementations specified in the election module (**Specs 27 through 31**) are **strictly deferred and skipped for the MVP release**. The AI agent MUST NOT implement the full database election models, candidate nomination APIs, cryptographic secret ballot systems, or presidency transfer automation at this time.

### Skipped Specifications:
1. `27-election-schema.md` — Election, Candidate, VoterRecord, Ballot, and ElectionResult models.
2. `28-election-lifecycle-api.md` — Election setup, nomination lifecycle, and status transitions.
3. `29-election-management-ui.md` — Elections management tab, candidate approval UI, and officer controls.
4. `30-voting.md` — Secret ballot casting, receipt tokens, and voting window validation.
5. `31-election-results.md` — Vote tallying, result publishing, automated presidency transfer, and archiving.

---

## 2. "Coming Soon" UI Specification

For all user-facing touchpoints related to elections:

### A. Club Detail Page (`app/(app)/clubs/[clubId]/page.tsx`)
- Keep the **Elections** tab visible to active club members, faculty advisors, and administrators.
- In `TabsContent value="elections"`, replace any temporary text with a polished **"Coming Soon in v2.0"** card featuring:
  - **Badge**: `Coming Soon in v2.0` (using semantic badge styling).
  - **Icon**: `Vote` (lucide-react).
  - **Title**: `Executive Elections & Governance`
  - **Description**: An engaging overview explaining upcoming governance capabilities:
    - Candidate nominations and campaign statements.
    - Anonymized secret ballot voting with verifiable cryptographic receipts.
    - Automated election certification and annual presidency transfers.
  - **Notice**: A note stating that leadership assignments can currently be managed directly by club presidents via the **Members** and **Settings** tabs.

---

## 3. Backend Request Handling ("Coming Soon" API Handler)

To guarantee that any automated tests, client fetches, or direct API requests receive an elegant response instead of crashing:

### Catch-All Election API Route (`app/api/clubs/[clubId]/elections/route.ts`)
- Implements `GET`, `POST`:
  - Returns HTTP 501 (`NOT_IMPLEMENTED`) or HTTP 200 with metadata:
    ```json
    {
      "comingSoon": true,
      "message": "The Executive Elections module is coming soon in ClubSphere v2.0. Leadership assignments can currently be managed via the Membership roster.",
      "feature": "ELECTIONS",
      "version": "v2.0"
    }
    ```

---

## 4. Next Implementation Step

Upon confirming the "Coming Soon" UI and API responses, proceed directly to:
- **Phase**: Analytics, Administration, and Delivery
- **Next Spec**: `32-admin-dashboard.md` (System analytics and exception lists)

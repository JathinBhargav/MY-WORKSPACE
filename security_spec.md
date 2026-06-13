# Firestore Security Specification & Threat Model

This document outlines the security invariants, threat validation payloads ("The Dirty Dozen"), and the test definitions used to secure the Workspace Mail AI Task Sync Firebase integration.

## 1. Core Data Invariants

1. **User Identity Isolation**: A user (`userId`) can only read and write documents inside their own `/users/{userId}/...` path. No user can view or alter another user's profile, tasks, events, keep notes, meeting summaries, or feedback logs.
2. **Task Validation**: A task title must be a non-empty string under 256 characters. Urgency must be one of `URGENT`, `HIGH`, `MEDIUM`, or `LOW`. Status must be standard states (`pending` or `completed`).
3. **Keep Note Integrity**: Note content and title must be string formats with length constraint filters.
4. **User Verification**: Only authenticated users with verified emails may execute write operations (`request.auth.token.email_verified == true`).
5. **System Field Immutability**: Critical entity fields like `createdAt` and `id` must not be modifiable once created.

---

## 2. The "Dirty Dozen" Threat Payloads

The following 12 payloads represent attacks trying to bypass database security gates. They must all yield `PERMISSION_DENIED`.

### Attack 1: User Profile Spoofing
* **Attempt**: Authenticated User `attacker123` tries to write a profile document inside `users/victim456`.
* **Payload**:
  ```json
  { "userId": "victim456", "email": "victim@domain.com", "displayName": "Victim User" }
  ```

### Attack 2: Unverified User Profile Write
* **Attempt**: User `guest123` with `email_verified == false` tries to create/update their `/users/guest123` profile.
* **Payload**:
  ```json
  { "userId": "guest123", "email": "guest@domain.com", "displayName": "Guest Profile" }
  ```

### Attack 3: Task Path ID Poisoning
* **Attempt**: Creating a task with a massive, malicious document ID to cause denial of service or wallet exhaustion.
* **ID**: `a`.repeat(1000)
* **Payload**:
  ```json
  { "id": "task_poison", "title": "Mischief", "status": "pending", "urgency": "LOW" }
  ```

### Attack 4: Task State Splicing (Invalid Status)
* **Attempt**: Injecting an invalid task state (e.g. `completed_and_rewarded`).
* **Payload**:
  ```json
  { "id": "t1", "title": "Buy milk", "status": "hack_state", "urgency": "LOW" }
  ```

### Attack 5: Unbounded Project Field
* **Attempt**: Writing a project name that is excessively large to burden the system's index storage.
* **Payload**:
  ```json
  { "id": "t1", "title": "Test", "status": "pending", "urgency": "LOW", "project": "X".repeat(5000) }
  ```

### Attack 6: Temporal Integrity Manipulation
* **Attempt**: Artificially setting a historical or future `createdAt` value.
* **Payload**:
  ```json
  { "id": "t1", "title": "Past Task", "status": "pending", "urgency": "LOW", "createdAt": "2010-01-01T00:00:00Z" }
  ```

### Attack 7: Immutable Field Alteration (Update)
* **Attempt**: Modifying the immutable `createdAt` property of an existing note.
* **Payload**:
  ```json
  { "title": "My Note Updated", "content": "Updated content", "createdAt": "2020-05-01T00:00:00Z" }
  ```

### Attack 8: Resource Poisoning via Keeps List Size
* **Attempt**: Creating a note with a massive array of simulated extraction times coordinates to blow memory budgets.
* **Payload**:
  ```json
  { "id": "n1", "title": "Poison Keep", "content": "content", "timings": ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11"] }
  ```

### Attack 9: Star Rating Bounds Breach
* **Attempt**: Posting a 500-star feedback score (max allowed is 5).
* **Payload**:
  ```json
  { "id": "f1", "sourceType": "email_summary", "sourceId": "e1", "rating": 500, "isHelpful": true }
  ```

### Attack 10: Feedback Character Overflow
* **Attempt**: Submitting feedback text containing multi-megabyte junk text inside the `comment` field.
* **Payload**:
  ```json
  { "id": "f2", "sourceType": "email_summary", "sourceId": "e1", "rating": 5, "isHelpful": true, "comment": "A".repeat(10000) }
  ```

### Attack 11: Directory Traversal Read Attempts
* **Attempt**: Trying to view the master document path `/users/victim_user` as `attacker_user`.
* **Action**: Read request against forbidden reference path `/users/victim_user`.

### Attack 12: Action-Based Bypassing (Update Lockout)
* **Attempt**: Spoofing and changing user details on someone else's space settings or changing status to skip states.
* **Payload**:
  ```json
  { "status": "terminal_unlock", "title": "Forbidden update attempt" }
  ```

---

## 3. Security Rule Definitions

To secure the paths against these attacks, we've drafted the fortress rules in `firestore.rules`.
All operations check:
1. `request.auth != null`
2. `request.auth.token.email_verified == true`
3. Document ownership matched via `userId == request.auth.uid`

All string values are size-restrained, and list items constraints are applied to avoid wallet-denial exhaustion.

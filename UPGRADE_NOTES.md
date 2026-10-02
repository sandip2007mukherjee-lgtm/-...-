# Emotion Note Upgrade

- Admin Control Center with Overview, Users, Notes Library, and Control tabs.
- User table shows only the user name; clicking a user opens session details and activity timeline.
- Live monitoring uses Firestore `onSnapshot` for activity and presence.
- Fixed the collection mismatch: public activity writes to `activity` and rules now protect `activity`.
- Each emotion is provisioned with 50 notes by the Admin automatically on first admin login if fewer than 50 exist.
- Notes are randomly selected per user session without repeating until the session has exhausted the available notes for that emotion. A different user can receive the same note, as requested.
- Admin can create, edit, activate/deactivate, and delete notes.
- Added presence/session tracking and current screen/last action.
- Final animation uses lightweight CSS/particles rather than balloon/teddy GIFs.
- Firebase config and Admin email are retained from the supplied project.

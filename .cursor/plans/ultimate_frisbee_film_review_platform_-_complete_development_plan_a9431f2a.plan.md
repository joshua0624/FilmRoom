---
name: Ultimate Frisbee Film Review Platform - Complete Development Plan
overview: Complete development plan for the Ultimate Frisbee Film Review Platform covering Phase 5 completion and all remaining phases (6-12) including point marking system, notes system, real-time collaboration, stats page, anonymous sharing, mobile responsive design, and polish/error handling.
todos:
  - id: phase5-active-viewer-api
    content: Create ActiveViewer API routes (GET/POST/DELETE for viewers, POST for heartbeat) with permission logic
    status: pending
  - id: phase5-active-viewer-utils
    content: Create utility functions in lib/activeViewers.ts for permission management and transfer
    status: pending
  - id: phase5-score-display
    content: "Create ScoreDisplay component showing running score (Team A: X, Team B: Y)"
    status: pending
  - id: phase5-active-viewers
    content: Create ActiveViewers component showing viewer list and point marking permission
    status: pending
    dependencies:
      - phase5-active-viewer-api
  - id: phase5-timeline
    content: Create Timeline component with point and note markers, and NoteMarker component
    status: pending
  - id: phase5-session-viewer
    content: Update SessionViewer with Team A/B scored buttons, integrate new components, WebSocket listeners, heartbeat
    status: pending
    dependencies:
      - phase5-score-display
      - phase5-active-viewers
      - phase5-timeline
      - phase5-active-viewer-api
  - id: phase5-socket-server
    content: Update server.js with viewer-joined, viewer-left, point-permission-changed events
    status: pending
  - id: phase5-point-permission
    content: Add permission check to points POST route
    status: pending
    dependencies:
      - phase5-active-viewer-api
  - id: phase6-permission-flow
    content: Update CreatePointModal with permission checks and error handling
    status: pending
    dependencies:
      - phase5-active-viewer-api
  - id: phase6-team-buttons
    content: Replace Mark Point button with Team A Scored and Team B Scored buttons in SessionViewer
    status: pending
    dependencies:
      - phase5-session-viewer
  - id: phase6-fullscreen
    content: Implement fullscreen mode with floating overlay buttons and auto-pause
    status: pending
    dependencies:
      - phase6-team-buttons
  - id: phase6-auto-save
    content: Add debounced auto-save functionality for point notes field
    status: pending
  - id: phase7-note-auto-save
    content: Implement auto-save for notes with debouncing in CreateNoteModal and EditNoteModal
    status: pending
  - id: phase7-note-markers
    content: Integrate note markers into Timeline component with distinct visual style
    status: pending
    dependencies:
      - phase5-timeline
  - id: phase7-fullscreen-notes
    content: Add fullscreen note support with floating button and auto-pause
    status: pending
    dependencies:
      - phase6-fullscreen
  - id: phase7-note-details
    content: Create note detail view/modal showing full note information
    status: pending
  - id: phase8-heartbeat
    content: Implement 30-second heartbeat system in SessionViewer
    status: pending
    dependencies:
      - phase5-session-viewer
  - id: phase8-permission-transfer
    content: Implement permission transfer logic for inactive point-markers
    status: pending
    dependencies:
      - phase5-active-viewer-utils
  - id: phase8-viewer-management
    content: Enhance viewer management with real-time tracking and disconnection handling
    status: pending
    dependencies:
      - phase5-active-viewers
  - id: phase8-reconnection
    content: Implement auto-reconnect with exponential backoff and state restoration
    status: pending
    dependencies:
      - phase8-heartbeat
  - id: phase9-stats-api
    content: Create stats API route with aggregation logic for goals, assists, games played
    status: pending
  - id: phase9-stats-page
    content: Create stats page with filters and player leaderboard table
    status: pending
    dependencies:
      - phase9-stats-api
  - id: phase9-stats-components
    content: Create StatsFilters and PlayerLeaderboard components
    status: pending
    dependencies:
      - phase9-stats-page
  - id: phase10-read-only
    content: Enforce read-only mode in SharedSessionViewer with hidden editing controls
    status: pending
  - id: phase10-share-ui
    content: Add Share button with copy link functionality and optional QR code
    status: pending
  - id: phase10-share-enhancements
    content: Enhance share page with creator display and private note hiding
    status: pending
    dependencies:
      - phase10-read-only
  - id: phase11-mobile-timeline
    content: Create mobile-specific scrollable timeline with timestamp labels
    status: pending
    dependencies:
      - phase5-timeline
  - id: phase11-fullscreen-buttons
    content: Implement floating buttons for mobile fullscreen mode
    status: pending
    dependencies:
      - phase6-fullscreen
  - id: phase11-double-tap
    content: Add double-tap skip functionality (-10s/+10s) for mobile video
    status: pending
  - id: phase11-responsive
    content: Implement responsive breakpoints and optimize for mobile/tablet/desktop
    status: pending
  - id: phase12-youtube-errors
    content: Add YouTube embed error handling for invalid IDs, private videos, network errors
    status: pending
  - id: phase12-validation
    content: Add form validation with proper error messages and field highlighting
    status: pending
  - id: phase12-loading-states
    content: Add loading indicators and skeleton loaders throughout the app
    status: pending
  - id: phase12-toasts
    content: Implement toast notification system for success/error/info messages
    status: pending
  - id: phase12-permission-errors
    content: Add clear permission error messages and button disabling
    status: pending
  - id: phase12-sanitization
    content: Implement input sanitization to prevent XSS attacks
    status: pending
  - id: phase12-accessibility
    content: Add ARIA labels, keyboard navigation, and screen reader support
    status: pending
  - id: phase12-performance
    content: Optimize performance with virtual scrolling, debouncing, caching, and database indexes
    status: pending
---

# Ultimate Frisbee Film Review Platform - Complete Development Plan

## Project Status

- ✅ Phase 1: Project Setup & Database - COMPLETE
- ✅ Phase 2: Authentication - COMPLETE
- ✅ Phase 3: Team Management - COMPLETE
- ✅ Phase 4: Film Session Management - COMPLETE
- ⚠️ Phase 5: Review Room Core - IN PROGRESS (needs completion)
- ⏳ Phase 6-12: Pending

---

## Phase 5: Review Room Core (COMPLETION)

### Current Status

Review room page exists with YouTube integration, basic point markers, and modals. Missing: running score display, full timeline with note markers, active viewers system, and point marking permissions.

### Tasks

**5.1 ActiveViewer API Routes**

- Create `app/api/sessions/[id]/viewers/route.ts`:
- `GET`: Fetch active viewers with permission status
- `POST`: Join session (upsert ActiveViewer, calculate permissions)
- `DELETE`: Leave session
- Create `app/api/sessions/[id]/viewers/heartbeat/route.ts`:
- `POST`: Update lastActive, check for inactive marker, transfer permission if needed

**5.2 ActiveViewer Utilities**

- Create `lib/activeViewers.ts`:
- `updateActiveViewerPermission(sessionId)`: Recalculate who can mark points
- `getPointMarker(sessionId)`: Get user with permission
- `checkAndTransferPermission(sessionId)`: Transfer if inactive

**5.3 Running Score Display**

- Create `components/sessions/ScoreDisplay.tsx`:
- Calculate scores from points (teamIdentifier 'A' vs 'B')
- Display "Team A: X" and "Team B: Y" with team colors
- Real-time updates via WebSocket

**5.4 Active Viewers Indicator**

- Create `components/sessions/ActiveViewers.tsx`:
- Display viewer list with avatars/initials
- Highlight point marker permission holder
- Show "You can mark points" or "[Username] can mark points"

**5.5 Enhanced Timeline**

- Create `components/sessions/Timeline.tsx`:
- Display point markers (colored circles) and note markers (star/pin icons)
- Position based on video duration
- Desktop: Overlay on progress bar
- Mobile: Scrollable horizontal list
- Create `components/sessions/NoteMarker.tsx`:
- Visual style distinct from point markers (yellow star/pin)

**5.6 Update SessionViewer**

- Replace "Mark Point" with "Team A Scored" and "Team B Scored" buttons (team colors)
- Integrate ScoreDisplay, ActiveViewers, Timeline components
- Add WebSocket listeners: `viewer-joined`, `viewer-left`, `point-permission-changed`
- Implement heartbeat (30s intervals)
- Join/leave session on mount/unmount

**5.7 Update Socket.io Server**

- Add `viewer-joined`, `viewer-left`, `point-permission-changed` events
- Store user info with socket connection

**5.8 Point Marking Permission Check**

- Update `app/api/sessions/[id]/points/route.ts`:
- Verify `canMarkPoints = true` before allowing point creation
- Return 403 with message if unauthorized

---

## Phase 6: Point Marking System (ENHANCEMENT)

### Current Status

Basic point marking exists via modal. Needs: permission-based flow, fullscreen mode support, auto-save, and improved UX.

### Tasks

**6.1 Permission-Based Point Marking**

- Update `CreatePointModal`:
- Check permission before showing modal
- Show error toast if user lacks permission
- Display who currently has permission

**6.2 Team-Specific Point Buttons**

- Update `SessionViewer`:
- "Team A Scored" button (team A color background)
- "Team B Scored" button (team B color background)
- Pre-select team in modal based on button clicked
- Disable buttons if user lacks permission

**6.3 Fullscreen Mode Support**

- Detect fullscreen state (Fullscreen API)
- Show floating overlay buttons on right side:
- Top: Team A button (team color)
- Middle: Team B button (team color)
- Bottom: Add Note button
- Auto-pause video when button clicked in fullscreen
- Keep video paused after saving point

**6.4 Auto-Save Functionality**

- Implement debounced auto-save (500ms) for point notes field
- Show "Saving..." indicator
- Handle network errors gracefully

**6.5 Point Marker Timeline Integration**

- Ensure point markers appear on timeline immediately
- Smooth fade-in animation
- Click marker to jump to timestamp and show point details

---

## Phase 7: Notes System (ENHANCEMENT)

### Current Status

Basic note creation/editing exists. Needs: auto-save, fullscreen support, note markers on timeline, improved private note handling.

### Tasks

**7.1 Auto-Save for Notes**

- Update `CreateNoteModal` and `EditNoteModal`:
- Debounced auto-save (500ms) for title and content
- Show "Saving..." indicator
- Handle save errors

**7.2 Note Markers on Timeline**

- Integrate note markers into Timeline component
- Different visual style from points (yellow star/pin icon)
- Click to jump to timestamp and show note details
- Private notes: Different marker style or hidden from other users

**7.3 Fullscreen Note Support**

- Add floating note button in fullscreen mode
- Auto-pause video when creating note in fullscreen
- Keep video paused after saving

**7.4 Note Details Display**

- Create note detail view/modal:
- Show title, content, timestamp, creator, created/updated time
- Edit/delete buttons (creator only)
- Click timeline marker to show details

**7.5 Private Notes Visibility**

- Filter private notes in Timeline (hide from other users)
- Show private indicator in NotesPanel
- Ensure private notes don't appear in shared session view

---

## Phase 8: Real-Time Collaboration (ENHANCEMENT)

### Current Status

Basic WebSocket setup exists. Needs: heartbeat system, permission transfer, viewer management, and improved sync.

### Tasks

**8.1 Heartbeat System**

- Implement 30-second heartbeat in `SessionViewer`
- Update `lastActive` timestamp via API
- Check for inactive point-marker (5 minutes)
- Transfer permission automatically

**8.2 Permission Transfer Logic**

- Update `lib/activeViewers.ts`:
- Check if current point-marker is inactive
- Find next earliest active viewer
- Update permissions in database
- Broadcast `point-permission-changed` event

**8.3 Viewer Management**

- Track active viewers in real-time
- Update viewer list when users join/leave
- Show viewer count and usernames
- Handle disconnections gracefully

**8.4 Playback Synchronization**

- Enhance playback sync:
- Only sync if time difference > 1 second
- Respect user's manual seeks
- Optional: Add toggle to enable/disable sync

**8.5 Reconnection Handling**

- Auto-reconnect with exponential backoff
- Show "Reconnecting..." indicator
- Queue local changes to sync when reconnected
- Restore session state on reconnect

---

## Phase 9: Stats Page

### Tasks

**9.1 Stats API Route**

- Create `app/api/stats/route.ts`:
- Aggregate points by scorer_name and assister_name
- Filter by date range, opponent team
- Only include sessions with preset rosters (team_a_id and team_b_id not null)
- Count distinct sessions for games played
- Support sorting by points or assists

**9.2 Stats Page Component**

- Create `app/(dashboard)/stats/page.tsx`:
- Filters: Time period dropdown, opponent filter, sort toggle
- Player leaderboard table: Rank, Player Name, Goals, Assists, Games Played
- Responsive design (stack on mobile, scroll on tablet)

**9.3 Stats Calculation Logic**

- Implement aggregation in API:
- Group by scorer_name (count goals)
- Group by assister_name excluding "Unassisted" (count assists)
- Join with Players table to ensure name exists in roster
- Apply filters before aggregation

**9.4 Stats UI Components**

- Create `components/stats/StatsFilters.tsx`:
- Date range picker
- Opponent team dropdown
- Sort toggle (points vs assists)
- Create `components/stats/PlayerLeaderboard.tsx`:
- Responsive table with sorting
- Highlight top players

---

## Phase 10: Anonymous Sharing (ENHANCEMENT)

### Current Status

Basic shared session view exists. Needs: read-only enforcement, share link UI, and improved UX.

### Tasks

**10.1 Read-Only Enforcement**

- Update `SharedSessionViewer`:
- Hide all editing controls (point marking, note creation)
- Disable point/note editing buttons
- Show "Read-only" indicator

**10.2 Share Link UI**

- Add "Share" button in `SessionViewer`:
- Copy link to clipboard
- Show success toast
- Optional: Generate QR code for mobile sharing

**10.3 Share Page Enhancements**

- Update `/share/[token]` page:
- Display creator username on notes/points
- Hide private notes completely
- Show "Shared Session" banner
- No active viewers list or collaboration features

**10.4 Share Token Security**

- Ensure share tokens are unique and secure
- Optional: Add expiration or password protection
- Validate token format in API

---

## Phase 11: Mobile & Responsive Design

### Tasks

**11.1 Mobile Timeline**

- Create mobile-specific timeline:
- Scrollable horizontal list below video
- Timestamp labels for each marker
- Touch-friendly tap targets (44px minimum)
- Swipe to scroll

**11.2 Fullscreen Floating Buttons**

- Implement floating buttons for mobile fullscreen:
- Fixed position on right edge
- 60px diameter circles
- Team A (top), Team B (middle), Note (bottom)
- Smooth animations

**11.3 Double-Tap Skip Functionality**

- Detect double-tap on video:
- Left 1/3: Seek back 10 seconds
- Right 1/3: Seek forward 10 seconds
- Show visual feedback

**11.4 Responsive Breakpoints**

- Implement mobile-first design:
- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px
- Test video player on all sizes
- Ensure sidebar stacks on mobile

**11.5 Touch Target Optimization**

- Ensure all interactive elements are 44px x 44px minimum
- Add generous padding around buttons
- Improve form input sizes on mobile

**11.6 Mobile Video Controls**

- Optimize YouTube player for mobile:
- Full width, 16:9 aspect ratio
- Touch-friendly controls
- Handle orientation changes

---

## Phase 12: Polish & Error Handling

### Tasks

**12.1 YouTube Embed Error Handling**

- Handle invalid video IDs:
- Show "Video not found or unavailable"
- Validate URL format before accepting
- Handle private/restricted videos:
- Show "Video is private or restricted"
- Network errors:
- Show retry button
- Handle offline state

**12.2 Form Validation**

- Add validation to all forms:
- Required fields highlighted if empty
- YouTube URL format validation
- Team names: 1-50 characters
- Note titles: 1-100 characters
- Note content: 1-5000 characters

**12.3 Loading States**

- Add loading indicators:
- Session loading
- Point/note saving
- Stats calculation
- Skeleton loaders for lists

**12.4 Toast Notifications**

- Implement toast system:
- Success messages (point created, note saved)
- Error messages (permission denied, save failed)
- Info messages (permission transferred)
- Use library like react-hot-toast or custom component

**12.5 Permission Error Handling**

- Show clear messages:
- "Only [UserX] can mark points right now"
- "You don't have permission to edit this note"
- Disable buttons when permission denied

**12.6 Input Sanitization**

- Escape user-generated content:
- Prevent XSS in notes, point descriptions
- Sanitize before rendering
- Validate on both client and server

**12.7 Rate Limiting (Optional)**

- Implement rate limiting if needed:
- Session creation: 10 per hour per user
- Note creation: 60 per hour per user
- API requests: 100 per minute per IP

**12.8 Error Boundaries**

- Add React error boundaries:
- Catch component errors
- Show friendly error messages
- Log errors for debugging

**12.9 Accessibility Improvements**

- Add ARIA labels to all interactive elements
- Ensure keyboard navigation works
- Add focus indicators
- Test with screen readers

**12.10 Performance Optimization**

- Implement virtual scrolling for long lists (100+ markers)
- Debounce auto-save properly
- Optimize WebSocket message batching
- Cache stats calculations
- Add database indexes on frequently queried fields

---

## Implementation Order

1. **Complete Phase 5** (Review Room Core) - Foundation for collaboration
2. **Phase 6** (Point Marking System) - Enhance core functionality
3. **Phase 7** (Notes System) - Complete note features
4. **Phase 8** (Real-Time Collaboration) - Polish collaboration features
5. **Phase 9** (Stats Page) - Independent feature
6. **Phase 10** (Anonymous Sharing) - Enhance existing feature
7. **Phase 11** (Mobile & Responsive) - Cross-cutting improvements
8. **Phase 12** (Polish & Error Handling) - Final polish

---

## Key Files Reference

**API Routes:**

- `app/api/sessions/[id]/viewers/route.ts` (new)
- `app/api/sessions/[id]/viewers/heartbeat/route.ts` (new)
- `app/api/stats/route.ts` (new)
- `app/api/sessions/[id]/points/route.ts` (modify)

**Components:**

- `components/sessions/ScoreDisplay.tsx` (new)
- `components/sessions/ActiveViewers.tsx` (new)
- `components/sessions/Timeline.tsx` (new)
- `components/sessions/NoteMarker.tsx` (new)
- `components/sessions/SessionViewer.tsx` (modify)
- `components/sessions/SharedSessionViewer.tsx` (modify)
- `components/stats/StatsFilters.tsx` (new)
- `components/stats/PlayerLeaderboard.tsx` (new)

**Utilities:**

- `lib/activeViewers.ts` (new)

**Pages:**

- `app/(dashboard)/stats/page.tsx` (new)

**Server:**

- `server.js` (modify)
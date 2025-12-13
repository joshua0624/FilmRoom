---
name: FilmRoom Frontend Design System Implementation
overview: Implement a comprehensive dark-themed design system with emerald green accents across all FilmRoom components, including design tokens, reusable UI components, navigation, and page layouts.
todos:
  - id: design-tokens
    content: Set up CSS variables and Tailwind config with design system tokens (colors, typography, spacing, border radius)
    status: completed
  - id: button-component
    content: Create reusable Button component with primary, secondary, tertiary, and teamColor variants
    status: completed
  - id: navigation-component
    content: Create global Navigation component with logo, links, user menu, and responsive mobile menu
    status: completed
  - id: modal-component
    content: Create base Modal component and update all existing modals to use new styling
    status: completed
  - id: card-components
    content: Update TeamCard and SessionCard components to match design spec with color bars and new styling
    status: completed
  - id: video-player-section
    content: Update video player container, timeline, score display, and permission banner styling
    status: completed
  - id: sidebar-components
    content: Update ActiveViewers, NotesPanel, and PointsList components with new dark theme styling
    status: completed
  - id: stats-components
    content: Update StatsFilters, PlayerLeaderboard, and add quick stats cards with new styling
    status: completed
  - id: page-layouts
    content: Update all dashboard pages to use Navigation component and new layout styling
    status: completed
  - id: fullscreen-mode
    content: Add floating action buttons and exit button for fullscreen mode UI
    status: completed
  - id: responsive-design
    content: Implement responsive breakpoints for mobile, tablet, and desktop layouts
    status: completed
  - id: animations-transitions
    content: Add hover effects, transitions, and loading state animations
    status: completed
  - id: accessibility
    content: Add focus states, ARIA labels, and verify color contrast for accessibility
    status: completed
---

# FilmRoom Frontend Design System Implementation

## Overview

Transform the existing FilmRoom application to match the provided design specification with a dark theme, emerald green accents, and consistent component styling. The implementation will involve updating CSS variables, creating reusable components, and refactoring existing components to match the new design system.

## Architecture

The implementation follows a layered approach:

1. **Design Tokens Layer**: CSS variables and Tailwind configuration
2. **Base Components Layer**: Reusable UI primitives (buttons, cards, inputs)
3. **Layout Components Layer**: Navigation, containers, grids
4. **Feature Components Layer**: Video player, timeline, panels, modals
5. **Page Layer**: Page-specific layouts and compositions

## Implementation Steps

### 1. Design Tokens & Configuration

**Files to modify:**

- [`app/globals.css`](app/globals.css) - Add CSS variables for colors, typography, spacing, border radius
- [`tailwind.config.ts`](tailwind.config.ts) - Extend Tailwind theme with custom colors and design tokens

**Changes:**

- Replace existing CSS variables with the new design system variables
- Add all color palette variables (background, text, accent colors)
- Add typography scale variables
- Add spacing scale variables
- Add border radius variables
- Configure Tailwind to use these variables
- Update body styles to use the new font stack and dark background

### 2. Base Button Components

**New file:**

- [`components/common/Button.tsx`](components/common/Button.tsx) - Reusable button component with variants

**Implementation:**

- Create a Button component with variants: `primary`, `secondary`, `tertiary`, `teamColor`
- Apply design spec styles for each variant
- Include hover states and transitions
- Support icon integration
- Ensure accessibility (focus states, ARIA labels)

### 3. Navigation Bar Component

**New file:**

- [`components/common/Navigation.tsx`](components/common/Navigation.tsx) - Global navigation component

**Implementation:**

- Create reusable Navigation component with:
  - Logo/branding (FilmRoom in accent color)
  - Navigation links (Teams, Sessions, Stats)
  - User menu (username, settings, logout)
  - Conditional back button
  - Responsive mobile menu
- Apply design spec styling (background #1a1a1a, border, padding)
- Implement hover states for links and icons
- Use Lucide React icons

### 4. Card Components

**Files to update:**

- [`components/teams/TeamCard.tsx`](components/teams/TeamCard.tsx) - Update to match design spec
- [`components/sessions/SessionCard.tsx`](components/sessions/SessionCard.tsx) - Update to match design spec

**Changes:**

- Update TeamCard with:
  - Color bar at top (8px height)
  - New background and border colors
  - Updated typography and spacing
  - Admin badge styling
  - Action buttons with new button variants
- Update SessionCard with new styling
- Apply hover effects (translateY, border color changes)

### 5. Modal System

**Files to update:**

- [`components/sessions/CreateNoteModal.tsx`](components/sessions/CreateNoteModal.tsx)
- [`components/sessions/CreatePointModal.tsx`](components/sessions/CreatePointModal.tsx)
- [`components/sessions/EditNoteModal.tsx`](components/sessions/EditNoteModal.tsx)
- [`components/sessions/EditPointModal.tsx`](components/sessions/EditPointModal.tsx)
- [`components/teams/CreateTeamModal.tsx`](components/teams/CreateTeamModal.tsx)
- All other modal components

**New file:**

- [`components/common/Modal.tsx`](components/common/Modal.tsx) - Base modal component

**Implementation:**

- Create reusable Modal component with:
  - Overlay styling (rgba(0, 0, 0, 0.8))
  - Container styling (background #1a1a1a, border, padding, max-width)
  - Header with title and close button
  - Footer with action buttons
- Update all modals to use the new Modal component
- Update form field styling (inputs, textareas, selects, checkboxes)
- Apply new button variants to modal actions

### 6. Video Player Section

**Files to update:**

- [`components/sessions/SessionViewer.tsx`](components/sessions/SessionViewer.tsx) - Main session viewer layout
- [`components/sessions/Timeline.tsx`](components/sessions/Timeline.tsx) - Timeline component
- [`components/sessions/ScoreDisplay.tsx`](components/sessions/ScoreDisplay.tsx) - Score display

**Changes:**

- Update video player container styling (background #1a1a1a, border, border-radius)
- Update timeline container and progress bar styling
- Update timeline markers (points and notes) with new colors and hover effects
- Update score display with new typography and background
- Add permission banner styling
- Implement responsive timeline (desktop overlay, mobile list)

### 7. Sidebar Components

**Files to update:**

- [`components/sessions/ActiveViewers.tsx`](components/sessions/ActiveViewers.tsx)
- [`components/sessions/NotesPanel.tsx`](components/sessions/NotesPanel.tsx)
- [`components/sessions/PointsList.tsx`](components/sessions/PointsList.tsx)

**Changes:**

- Update ActiveViewers panel with:
  - New background and border styling
  - Header typography (uppercase, letter-spacing)
  - Viewer item styling with green dot indicator
  - "Can Mark" badge styling
- Update NotesPanel with:
  - Note item styling (background #0f0f0f, border-left yellow)
  - Updated typography and spacing
  - Private badge styling
  - Truncated content with ellipsis
- Update PointsList with:
  - New container styling
  - Header with target icon in accent color
  - Point item styling with team color dots
  - Updated typography and hover states

### 8. Stats Page Components

**Files to update:**

- [`app/(dashboard)/stats/page.tsx`](app/\\(dashboard)/stats/page.tsx) - Main stats page
- [`components/stats/StatsFilters.tsx`](components/stats/StatsFilters.tsx) - Filter bar
- [`components/stats/PlayerLeaderboard.tsx`](components/stats/PlayerLeaderboard.tsx) - Stats table

**Changes:**

- Update filter bar with:
  - Grid layout (4 columns)
  - Input/select styling (background #0f0f0f, border, focus states)
  - Label typography
- Update stats table with:
  - New background and border styling
  - Header row styling (background #0f0f0f)
  - Row hover effects
  - Special styling for rank (medals, accent color for top 3)
  - Goals column highlighting
- Add quick stats cards component with 3-column grid layout
- Update page layout with max-width container

### 9. Page Layouts

**Files to update:**

- [`app/(dashboard)/teams/page.tsx`](app/\\(dashboard)/teams/page.tsx)
- [`app/(dashboard)/sessions/page.tsx`](app/\\(dashboard)/sessions/page.tsx)
- [`app/(dashboard)/sessions/[id]/page.tsx`](app/(dashboard)/sessions/[id]/page.tsx)
- [`app/(dashboard)/teams/[id]/page.tsx`](app/(dashboard)/teams/[id]/page.tsx)

**Changes:**

- Replace inline navigation with Navigation component
- Update page backgrounds to #0f0f0f
- Update container max-widths to 1280px
- Apply consistent padding (24px)
- Update grid layouts for responsive design
- Update empty states styling

### 10. Fullscreen Mode

**Files to update:**

- [`components/sessions/SessionViewer.tsx`](components/sessions/SessionViewer.tsx) - Add fullscreen mode UI

**Implementation:**

- Add floating action buttons for:
  - Team A scoring (team color background)
  - Team B scoring (team color background)
  - Note creation (accent green background)
- Position buttons fixed on right side
- Add exit fullscreen button (top-right)
- Apply design spec styling (circular, shadows, hover effects)

### 11. Responsive Design

**Files to update:**

- All component files - Add responsive breakpoints

**Implementation:**

- Mobile (< 768px):
  - Stack grid columns
  - Reduce padding to 16px
  - Hide desktop nav, show mobile menu
  - Video takes full width
  - Sidebar moves below video
  - Timeline markers as horizontal scrollable list
- Tablet (768px - 1024px):
  - 2-column grid for team cards
  - Adjusted spacing
- Desktop (> 1024px):
  - Full 2-column layout for review room
  - 3-4 column grids for team cards

### 12. Animations & Transitions

**Files to update:**

- All interactive components

**Implementation:**

- Add standard transitions (0.2s ease) to all interactive elements
- Implement hover effects:
  - Cards: translateY(-2px)
  - Buttons: translateY(-1px)
  - Timeline markers: scale(1.25)
- Update skeleton loader with new gradient animation
- Add loading states with new color scheme

### 13. Accessibility Enhancements

**Files to update:**

- All interactive components

**Implementation:**

- Add focus states with accent color outline (2px solid #10b981)
- Ensure minimum touch target size (44x44px) on mobile
- Add ARIA labels to icon-only buttons
- Verify color contrast ratios meet WCAG AA standards
- Test keyboard navigation

### 14. Icon Integration

**Files to update:**

- All components using icons

**Implementation:**

- Ensure Lucide React icons are used consistently
- Apply accent color (#10b981) to primary icons
- Use appropriate icon sizes (14px, 16px, 20px, 24px)
- Add icons to navigation, buttons, and headers as specified

## File Structure

```
components/
  common/
    Button.tsx          (NEW - reusable button component)
    Modal.tsx           (NEW - base modal component)
    Navigation.tsx      (NEW - global navigation)
  sessions/
    SessionViewer.tsx   (UPDATE - video player section)
    Timeline.tsx        (UPDATE - timeline styling)
    ScoreDisplay.tsx    (UPDATE - score display)
    ActiveViewers.tsx   (UPDATE - sidebar panel)
    NotesPanel.tsx      (UPDATE - sidebar panel)
    PointsList.tsx      (UPDATE - points list)
    CreateNoteModal.tsx (UPDATE - modal styling)
    CreatePointModal.tsx (UPDATE - modal styling)
    ... (all other modals)
  teams/
    TeamCard.tsx        (UPDATE - card styling)
    CreateTeamModal.tsx (UPDATE - modal styling)
    ... (other team components)
  stats/
    StatsFilters.tsx    (UPDATE - filter bar)
    PlayerLeaderboard.tsx (UPDATE - table styling)
app/
  globals.css          (UPDATE - design tokens)
  (dashboard)/
    teams/page.tsx      (UPDATE - layout)
    sessions/page.tsx   (UPDATE - layout)
    stats/page.tsx      (UPDATE - layout)
    ... (other pages)
tailwind.config.ts     (UPDATE - theme extension)
```

## Design Token Mapping

The design spec CSS variables will be mapped to Tailwind classes:

- Background colors: `bg-[#0f0f0f]`, `bg-[#1a1a1a]`, `bg-[#252525]`
- Text colors: `text-[#e5e5e5]`, `text-[#9ca3af]`, `text-[#6b7280]`
- Accent colors: `bg-[#10b981]`, `text-[#34d399]`, `border-[#10b981]`
- Spacing: Use Tailwind spacing scale (p-4, p-6, gap-4, etc.)
- Border radius: `rounded-sm`, `rounded-md`, `rounded-lg`, `rounded-xl`, `rounded-full`

## Testing Checklist

- [ ] All pages render with new design system
- [ ] Navigation works across all pages
- [ ] Buttons have correct hover states
- [ ] Modals display correctly with new styling
- [ ] Video player section matches design spec
- [ ] Timeline markers are visible and clickable
- [ ] Sidebar panels display correctly
- [ ] Stats page filters and table work correctly
- [ ] Responsive breakpoints work on mobile, tablet, desktop
- [ ] Focus states are visible for keyboard navigation
- [ ] Color contrast meets accessibility standards
- [ ] All icons display correctly
- [ ] Loading states use new color scheme
- [ ] Fullscreen mode UI displays correctly

## Notes

- Preserve all existing functionality while updating styles
- Use Tailwind utility classes where possible, custom CSS for complex styling
- Maintain component props and interfaces
- Test thoroughly on multiple screen sizes
- Ensure dark theme is consistent across all pages
- Keep emerald green accent color consistent (#10b981 for backgrounds, #34d399 for text)
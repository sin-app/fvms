# UI/UX Design Document

## 1. Design Philosophy

The FVMS follows a **mobile-first, minimal, and professional** design language inspired by Vercel, Linear, and Notion. The interface prioritizes clarity, speed, and touch-friendly interactions.

## 2. Design Principles

### Mobile First
- All layouts start at 320px width
- Progressive enhancement for larger screens
- Touch targets minimum 44x44px
- Thumb-friendly navigation (bottom nav on mobile)

### Minimal & Clean
- Ample white space (8px grid system)
- Maximum 3 font sizes per page
- Limited color palette
- Content-focused, not chrome-focused

### Professional
- Consistent spacing and alignment
- Clear visual hierarchy
- Purposeful animations (subtle, 200-300ms)
- Data-dense but readable

## 3. Color System

### Primary Palette
```
--primary: #0F172A      (Slate 900 - headings, primary text)
--primary-foreground: #FFFFFF
--accent: #3B82F6       (Blue 500 - primary actions, links)
--accent-foreground: #FFFFFF
--accent-hover: #2563EB  (Blue 600)
```

### Neutral Palette
```
--background: #FFFFFF
--foreground: #0F172A
--muted: #F1F5F9         (Slate 100 - card backgrounds)
--muted-foreground: #64748B (Slate 500 - secondary text)
--border: #E2E8F0        (Slate 200 - borders)
--ring: #3B82F6          (Focus ring)
```

### Semantic Colors
```
--success: #22C55E       (Green 500 - completed)
--warning: #F59E0B       (Amber 500 - pending/warning)
--danger: #EF4444        (Red 500 - late/cancelled)
--info: #3B82F6          (Blue 500 - information)
```

### Status Colors
```
--status-pending: #F59E0B    (Amber)
--status-on-the-way: #3B82F6 (Blue)
--status-in-progress: #8B5CF6 (Purple)
--status-completed: #22C55E   (Green)
--status-cancelled: #EF4444   (Red)
--status-late: #DC2626        (Dark Red)
```

## 4. Typography

- **Font Family:** Inter (sans-serif)
- **Weights:** 400 (Regular), 500 (Medium), 600 (SemiBold), 700 (Bold)

### Type Scale
```
--text-xs:   0.75rem  (12px)
--text-sm:   0.875rem (14px)
--text-base: 1rem     (16px) - body text
--text-lg:   1.125rem (18px)
--text-xl:   1.25rem  (20px)
--text-2xl:  1.5rem   (24px) - page titles
--text-3xl:  1.875rem (30px) - dashboard numbers
```

## 5. Spacing (8px Grid)

```
--space-1:  0.25rem (4px)
--space-2:  0.5rem  (8px)
--space-3:  0.75rem (12px)
--space-4:  1rem    (16px)
--space-5:  1.25rem (20px)
--space-6:  1.5rem  (24px)
--space-8:  2rem    (32px)
--space-10: 2.5rem  (40px)
--space-12: 3rem    (48px)
--space-16: 4rem    (64px)
```

## 6. Layout Structure

### Mobile (< 768px)
```
┌─────────────────┐
│    Top Bar      │  ← 56px, hamburger + title + notification
├─────────────────┤
│                 │
│   Page Content  │  ← Scrollable
│                 │
│                 │
├─────────────────┤
│  Bottom Nav     │  ← 56px, 4-5 icons
└─────────────────┘
```

### Desktop (>= 768px)
```
┌────────┬────────────────────────────┐
│        │       Top Bar              │  ← 64px
│ Sidebar│────────────────────────────│
│  240px │                            │
│        │     Page Content           │
│        │                            │
│        │                            │
└────────┴────────────────────────────┘
```

## 7. Component Design Specifications

### Cards
- Background: white
- Border: 1px solid var(--border)
- Border-radius: 12px
- Padding: 16px (mobile), 24px (desktop)
- Shadow: none (flat design) or very subtle

### Buttons
- Default: 40px height, 12px horizontal padding
- Small: 32px height, 8px horizontal padding
- Large: 48px height, 16px horizontal padding
- Border-radius: 8px
- Full-width on mobile for primary actions

### Input Fields
- Height: 44px (mobile touch target)
- Border-radius: 8px
- Border: 1.5px solid var(--border)
- Focus: 2px solid var(--ring) with offset
- Label: above the field, text-sm font-medium

### Tables (Data)
- Minimal borders (only horizontal)
- Row height: 48px (touchable)
- Hover state: var(--muted) background
- Responsive: horizontal scroll on mobile
- Sortable headers with visual indicator

### Status Badges
- Height: 24px
- Horizontal padding: 8px
- Border-radius: 9999px (pill)
- Font size: 12px, font-medium
- Colored dot + label

### Dialog/Modal
- Width: 90% (mobile), 480px (desktop)
- Max height: 90vh
- Border-radius: 16px (top corners only on mobile)
- Backdrop: black with 50% opacity
- Close button: top-right

### Empty States
- Centered illustration or icon (64px)
- Title: text-lg font-semibold
- Description: text-sm text-muted-foreground
- Action button: primary CTA

### Loading States
- Skeleton loaders matching component shape
- Spinner for actions (16px inline)
- Page-level: centered spinner or skeleton grid
- Button loading: spinner replaces icon

## 8. Navigation Patterns

### Mobile Bottom Navigation
1. Dashboard (home icon)
2. Schedules (calendar icon)
3. Calendar (grid icon)
4. Profile (user icon)
5. More (dots icon - overflow menu)

### Desktop Sidebar
1. Dashboard
2. Master Data (collapsible: Kabupaten, Kecamatan, Desa)
3. Schedules
4. Calendar
5. Import
6. Reports
7. Notifications
8. Users (admin only)
9. Settings (bottom)

## 9. Micro-interactions

- Button press: scale(0.97) for 100ms
- Card tap: subtle lift shadow
- Page transitions: fade in 200ms
- Status change: brief success checkmark animation
- Photo upload: progress bar + thumbnail
- Pull to refresh on mobile schedule list

## 10. Responsive Breakpoints

| Breakpoint | Width | Layout |
|------------|-------|--------|
| Mobile | < 640px | Single column, bottom nav |
| Tablet | 640-1024px | Two column, sidebar collapsed |
| Desktop | > 1024px | Full sidebar, multi-column |

## 11. Accessibility

- All touch targets >= 44px
- Color contrast ratio >= 4.5:1 (WCAG AA)
- Focus indicators visible on all interactive elements
- All images have alt text
- Forms have associated labels
- Error messages announced by screen readers
- Keyboard navigation: Tab, Enter, Escape, Arrow keys
- Reduced motion respect: `prefers-reduced-motion`

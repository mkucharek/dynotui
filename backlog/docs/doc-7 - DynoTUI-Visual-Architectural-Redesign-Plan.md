---
id: doc-7
title: DynoTUI Visual & Architectural Redesign Plan
type: other
created_date: '2025-12-30 10:53'
updated_date: '2025-12-30 14:41'
---
# DynoTUI Visual & Architectural Redesign Plan

Comprehensive plan to transform DynoTUI from functional-but-utilitarian to a polished, AWS-inspired terminal application with lazygit-quality aesthetics.

**Status: Phase 1-2 Implemented** ✓

---

## Design Vision

### Aesthetic Direction
- **Primary Inspiration**: lazygit (clean panels, clear hierarchy, refined spacing)
- **Color Language**: AWS-inspired palette adapted for terminal readability
- **Typography**: Bold hierarchy, generous whitespace, consistent alignment
- **Interaction**: Vim-lite with always-visible hints, mode-based footer

### Core Principles
1. **Professional polish** - Every pixel intentional, no generic defaults
2. **AWS familiarity** - Colors and patterns echo AWS console
3. **Information density** - Dense but readable, smart defaults
4. **Discoverability** - Key hints always visible, no hidden modes

---

## Color System (Implemented ✓)

### AWS-Inspired Palette (24-bit True Color)

```
┌─────────────────────────────────────────────────────────────┐
│  AWS Console Reference → Terminal Adaptation                │
├─────────────────────────────────────────────────────────────┤
│  #232F3E (Squid Ink)  →  Background context, headers        │
│  #FF9900 (Orange)     →  Primary accent, brand, active tabs │
│  #0073BB (Blue)       →  Focused elements, selection        │
│  #1B8A51 (Green)      →  Success, active indicators         │
│  #D13212 (Red)        →  Errors, warnings                   │
│  #879596 (Gray)       →  Secondary text, borders            │
└─────────────────────────────────────────────────────────────┘
```

### Theme Configuration (src/theme.ts)

```typescript
export const colors = {
  brand: '#FF9900',      // AWS Orange - brand, active tabs
  focus: '#0073BB',      // AWS Blue - focused panels, selection
  active: '#1B8A51',     // AWS Green - active indicators (●)
  error: '#D13212',      // AWS Red - errors
  text: '#FFFFFF',       // Primary text
  textSecondary: '#879596', // Secondary text
  textMuted: '#5C6773',  // Muted text, hints
  border: '#3D4F5F',     // Panel borders
  surface: '#232F3E',    // Background surfaces
}

export const borders = {
  style: 'round',        // ╭─╮│╰╯
}

export const symbols = {
  brand: '●',
  active: '●',
  selected: '▸',
  expanded: '▾',
  collapsed: '▸',
  scrollUp: '▲',
  scrollDown: '▼',
  sectionSeparator: '┄',
}
```

---

## Layout Architecture (Implemented ✓)

### Current Implementation

```
╭─────────────────────────────────────────────────────────────────────────────╮
│ ● DynoTUI              default › us-east-1 › production-events › scan    ● │
├─────────────────────────────────────────────────────────────────────────────┤
│╭───────────────────────────╮                                                │
││[1] Profile  Region        │  ╭─ production-events › scan ────────────────╮ │
││┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄││  │                                           │ │
││▸ default          ●      │  │  app_id  event_id  user_email  timestamp  │ │
││  production              │  │  ─────────────────────────────────────────│ │
││  staging                 │  │  10151571  01J1Q3S...  dda283...  2024-07 │ │
││                          │  │▸ 10151571  01J3AE1...  fe2b3b...  2024-07 │ │
│╰───────────────────────────╯  │  10151571  01J3AE1...  f8f22a...  2024-07 │ │
│╭───────────────────────────╮  │                                           │ │
││[2] Tables  Saved          │  ╰───────────────────────────────────────────╯ │
││┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄││                                                │
││  users                   │  Scanned: 100  ▼ n Load more  r Refresh        │
││▸ production-events    ●  │                                                │
││  orders                  │                                                │
││                        ▼ │                                                │
│╰───────────────────────────╯                                                │
├─────────────────────────────────────────────────────────────────────────────┤
│ j/k Navigate  Enter View  s Scan  q Query  f Filter  n Next  1/2/0 Panel   │
╰─────────────────────────────────────────────────────────────────────────────╯
```

### Layout Structure

1. **Outer Frame**: Rounded border (`borderStyle="round"`) wrapping entire app
2. **Header**: Single line with brand + breadcrumb + connection indicator
3. **Horizontal Separator**: Full terminal width (`─` repeated)
4. **Content Area**: Sidebar + Main (no vertical separator between them)
5. **Horizontal Separator**: Full terminal width
6. **Footer**: Single line with mode-based keybindings

### Header Design (1 line)

```
│ ● DynoTUI              default › us-east-1 › table-name › mode           ● │
  ↑ brand                ↑ breadcrumb path                                  ↑ connection
```

- Brand mark `●` in orange (#FF9900)
- Breadcrumb: profile › region › table › mode (colored segments)
- Connection indicator: `●` green (connected) or `○` red (disconnected)

### Footer Design (1 line)

```
│ j/k Navigate  Enter View  s Scan  q Query  f Filter  n Next  1/2/0 Panel   │
```

- Mode-based keybindings that change per context
- Key in accent color (blue), description in secondary text
- Modes: `sidebar`, `normal`, `query-form`, `scan-filter`, `item-detail`

### Sidebar Structure (Stacked Panels)

**Connection Panel [1]** - Fixed height (10 lines)
- Tabs: Profile | Region (switch with h/l or arrows)
- Shows list of AWS profiles or regions
- Active item marked with green `●`

**Browse Panel [2]** - Flexible height (fills remaining space)
- Tabs: Tables | Saved (switch with h/l or arrows)
- Shows list of DynamoDB tables or saved queries
- Active table marked with green `●`

---

## Keyboard Navigation (Implemented ✓)

### Panel Navigation
| Key | Action |
|-----|--------|
| `1` | Focus Connection panel (or toggle Profile/Region if already focused) |
| `2` | Focus Browse panel (or toggle Tables/Saved if already focused) |
| `0` | Focus Main panel |
| `Tab` | Cycle through panels (connection → browse → main) |
| `Shift+Tab` | Cycle backwards |

### Tab Switching (within sidebar panels)
| Key | Action |
|-----|--------|
| `h` / `←` | Previous tab |
| `l` / `→` | Next tab |

### List Navigation
| Key | Action |
|-----|--------|
| `j` / `↓` | Move down |
| `k` / `↑` | Move up |
| `Enter` | Select/activate item |

### Table View (Main Panel)
| Key | Action |
|-----|--------|
| `s` | Switch to Scan mode |
| `q` | Open Query form |
| `f` | Open Filter form (scan mode) |
| `n` | Load next page |
| `r` | Refresh |
| `Enter` | View item details |
| `Esc` | Go back |

---

## State Architecture (Implemented ✓)

### Panel & Tab State

```typescript
type FocusedPanel = 'connection' | 'browse' | 'main'
type ConnectionTab = 'profile' | 'region'
type BrowseTab = 'tables' | 'saved'
type InputMode = 'sidebar' | 'normal' | 'query-form' | 'scan-filter' | 'item-detail'
```

### Key Store Actions

```typescript
// Panel focus
setFocusedPanel: (panel: FocusedPanel) => void  // Also toggles tabs if already focused
cycleFocusedPanel: (direction: 'next' | 'prev') => void

// Tab switching
setConnectionTab: (tab: ConnectionTab) => void
setBrowseTab: (tab: BrowseTab) => void
cycleCurrentPanelTab: (direction: 'next' | 'prev') => void

// Input mode (affects footer keybindings)
setInputMode: (mode: InputMode) => void
```

---

## Component Structure (Implemented ✓)

### Files Changed/Created

| File | Status | Description |
|------|--------|-------------|
| `src/theme.ts` | ✓ | Centralized colors, borders, symbols |
| `src/store/app-store.ts` | ✓ | Panel/tab state, navigation |
| `src/components/layout/header.tsx` | ✓ | Single-line with breadcrumb |
| `src/components/layout/footer.tsx` | ✓ | Mode-based keybindings |
| `src/components/layout/split-layout.tsx` | ✓ | Sidebar + main (no separator) |
| `src/components/sidebar/sidebar.tsx` | ✓ | Stacked panels container |
| `src/components/sidebar/sidebar-panel.tsx` | ✓ NEW | Tabbed panel with [N] prefix |
| `src/components/sidebar/sidebar-section.tsx` | ✓ | Scrollable list with indicators |
| `src/index.tsx` | ✓ | Outer frame, keyboard handlers |

### Deleted Files
| File | Reason |
|------|--------|
| `src/components/sidebar/sidebar-tabs.tsx` | Replaced by SidebarPanel |

---

## Remaining Work

### Phase 3: Data Display (TODO)
- [ ] DataTable type formatting (null as `∅`, sets as `{a,b,c}`)
- [ ] Smart column detection based on frequency
- [ ] Numbers right-aligned
- [ ] Binary display as `<binary 256b>`

### Phase 4: Feedback States (TODO)
- [ ] Loading with metrics (RCU, timing)
- [ ] Error states with actionable guidance
- [ ] Empty states
- [ ] Connection status indicator in header

### Phase 5: Polish (TODO)
- [ ] Metrics display bar
- [ ] Animation refinements
- [ ] Edge case handling

---

## Success Criteria

1. ✓ **Visual**: Professional, AWS-aligned, lazygit-quality
2. ✓ **Interaction**: Mode-based footer hints
3. ✓ **Architecture**: Clean panel/tab state model
4. ○ **Metrics**: RCU, timing, scan count visible (TODO)
5. ○ **Errors**: Actionable guidance for common issues (TODO)
6. ○ **Types**: Proper formatting for DDB types (TODO)

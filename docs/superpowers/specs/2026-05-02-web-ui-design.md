# jcode Web UI Design Specification

**Date**: 2026-05-02
**Author**: Based on brainstorming with jcode project
**Status**: Approved

## Overview

A desktop-capable Web UI for jcode that enables UI-based interaction through the browser. Built as a pure frontend application that communicates with jcode via the existing Gateway API (port 7643).

## Design System

### Official Design Tokens (from `figma/jcode-mobile-design-spec.md`)

```css
:root {
  /* Colors */
  --bg: #0F0F14;
  --surface: #1A1A1F;
  --surface-elevated: #242429;
  --border: rgba(255,255,255,0.08);
  --accent: #4DD9A6;
  --accent-tint: rgba(77,217,166,0.15);
  --text-primary: rgba(255,255,255,0.92);
  --text-secondary: rgba(255,255,255,0.55);
  --text-tertiary: rgba(255,255,255,0.35);
  --warning: #F59E0B;
  --error: #D94D59;

  /* Typography */
  --font-ui: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-mono: 'Roboto Mono', 'SF Mono', Consolas, monospace;

  /* Font Sizes */
  --text-xs: 11px;
  --text-sm: 12px;
  --text-base: 14px;
  --text-lg: 15px;
  --text-xl: 17px;
  --text-2xl: 22px;
  --text-3xl: 28px;

  /* Spacing */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;

  /* Border Radius */
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 20px;
}
```

### Visual Principles

- Dark, calm, focused
- Terminal-native identity without looking retro
- Mint accent for active / live / connected states
- Dense information presented in touchable cards
- High signal, low chrome

## Technical Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Browser (Web UI)                     │
│  ┌─────────┐  ┌──────────┐  ┌────────────────────┐   │
│  │  Chat   │  │ Workbench │  │   Memory Panel     │   │
│  └────┬────┘  └────┬─────┘  └─────────┬──────────┘   │
│       │            │                  │               │
│  ┌────┴────────────┴──────────────────┴─────────┐     │
│  │              WebSocket / HTTP Client         │     │
│  └─────────────────────┬───────────────────────┘     │
└────────────────────────┼─────────────────────────────┘
                         │ :7643
┌────────────────────────┼─────────────────────────────┐
│                    jcode Gateway                      │
│  (existing jcode HTTP/WebSocket server)               │
└───────────────────────────────────────────────────────┘
```

### Communication Protocol

- **WebSocket**: `ws://127.0.0.1:7643/ws` for real-time messaging
- **HTTP**: `http://127.0.0.1:7643/api/*` for REST operations
- **Auth**: Existing pairing code mechanism
- **Format**: JSON-RPC 2.0 for messages

## Folder Structure

```
web-ui/
├── index.html              # Main entry point
├── css/
│   ├── variables.css       # CSS variables (official design system)
│   ├── base.css            # Base styles
│   ├── components.css      # Shared component styles
│   └── pages/
│       ├── chat.css
│       ├── sessions.css
│       └── settings.css
├── js/
│   ├── main.js             # Application entry
│   ├── api.js              # Gateway API client
│   ├── websocket.js        # WebSocket connection manager
│   ├── router.js           # SPA routing
│   ├── components/
│   │   ├── header.js
│   │   ├── sidebar.js
│   │   ├── chat.js
│   │   ├── message.js
│   │   ├── composer.js
│   │   ├── session-list.js
│   │   ├── memory-panel.js
│   │   └── tool-chain.js
│   └── stores/
│       ├── connection.js   # Gateway connection state
│       ├── session.js      # Current session state
│       └── messages.js     # Chat messages state
└── assets/
    └── icons/              # SVG icons
```

## Functional Modules

### 1. Chat Module
- Message input with auto-resize
- AI response display with typing animation
- Collapsible tool execution chains
- Markdown rendering for code blocks
- Stop/interrupt button for active responses

### 2. Sessions Module
- Session list with status indicators
- Create new session
- Switch between sessions
- Delete/archive sessions
- Session metadata display

### 3. Memory Panel
- Memory context visualization
- Memory graph overview
- Recent memory entries
- Memory budget display

### 4. Settings Module
- Gateway connection status
- Server URL configuration
- Model selection
- Theme preferences (future)

### 5. Workbench Module
- Workspace management (from existing Config Workbench)
- Provider configuration display
- Gateway device management

## Page Layout

```
┌─────────────────────────────────────────────────────────┐
│  Header: Logo + Connection Status + Model + Settings   │
├──────────┬──────────────────────────────────────────────┤
│          │                                              │
│ Sidebar  │  Main Content Area                          │
│          │  ┌────────────────────────────────────────┐  │
│ - Chat   │  │                                        │  │
│ - Sessions│ │     Dynamic Content                    │  │
│ - Memory │  │     (Chat / Sessions / Settings / ...)  │  │
│ - Settings│ │                                        │  │
│          │  └────────────────────────────────────────┘  │
│          │  ┌────────────────────────────────────────┐  │
│          │  │ Input Composer                         │  │
│          │  └────────────────────────────────────────┘  │
└──────────┴──────────────────────────────────────────────┘
```

### Responsive Behavior
- Desktop: Full 3-column layout
- Tablet: Collapsible sidebar
- Mobile: Bottom navigation bar

## Component States

### Connection Status Indicator
- **Connected**: Mint green dot (#4DD9A6)
- **Connecting**: Amber dot (#F59E0B) with pulse animation
- **Disconnected**: Red dot (#D94D59)

### Message Bubbles
- **User**: Left-aligned, mint tint background
- **Assistant**: Left-aligned, surface elevated background
- **System**: Centered, warning tint background

### Tool Chain
- **Collapsed**: Single line with tool indicators
- **Expanded**: Full detail with input/output

## Implementation Priorities

### Phase 1: Core Chat UI
1. HTML structure with official design tokens
2. Basic CSS with responsive layout
3. Gateway API client
4. WebSocket connection
5. Message display
6. Input composer
7. Tool chain display

### Phase 2: Session Management
1. Session list
2. Create/switch/delete sessions
3. Session persistence

### Phase 3: Additional Panels
1. Memory panel
2. Settings page
3. Workbench integration

## Dependencies

- None (pure vanilla HTML/CSS/JS)
- Uses native WebSocket API
- Uses native fetch API
- Google Fonts for Inter and Roboto Mono (fallback to system fonts)

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- ES2020+ JavaScript support
- CSS Grid and Flexbox

## Success Criteria

1. Web UI can connect to jcode Gateway
2. User can send and receive chat messages
3. Tool execution chains are displayed correctly
4. Session management works via UI
5. Design follows official design system
6. Responsive across desktop and tablet sizes
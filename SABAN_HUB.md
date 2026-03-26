# SABAN HUB - AI Customer Management Platform

## Overview

SABAN HUB is a unified platform for managing customer interactions with AI-powered automation capabilities. It combines real-time WhatsApp-style messaging with advanced AI behavior configuration and infrastructure monitoring.

## Architecture

### Three-Column Layout

```
┌─────────────────────────────────────────────────────────┐
│  Customer List  │  Chat / Pipeline / Infrastructure  │  AI Studio
│  (Left Panel)   │  (Center Panel)                     │  (Right Panel)
└─────────────────────────────────────────────────────────┘
```

### Components

#### Left Panel: Customer List
- **File**: `components/dashboard/CustomerList.tsx`
- Real-time customer list with search functionality
- Status indicators (online/offline/away)
- Last active timestamp tracking
- Firebase Realtime Database integration

#### Center Panel: Multi-Tab Interface
1. **Chat Tab**: `components/chat/ChatWindow.tsx`
   - WhatsApp-style message interface
   - Message history with real-time updates
   - Status indicators (sent, delivered, read)
   - Direct Firebase message persistence

2. **Pipeline Monitor (Malshinan)**: `components/dashboard/PipelineMonitor.tsx`
   - Real-time packet sniffer for `rami/incoming` and `rami/outgoing` paths
   - Color-coded JSON packet display
   - Latency visualization
   - Auto-scroll and pause controls
   - Filter by direction (incoming/outgoing/all)

3. **Infrastructure Controls**: `components/dashboard/Infrastructure.tsx`
   - RTDB URL configuration
   - Callback URL management
   - Message throttling settings
   - Heartbeat interval configuration
   - Log level configuration
   - Connection health monitoring

#### Right Panel: AI Studio
- **File**: `components/dashboard/AIStudio.tsx`
- **Identity Tab**: System prompt and response style configuration
- **DNA Tab**: AI behavior rules editor for prompt injection
- **Metrics Tab**: Success metrics dashboard with:
  - Total messages count
  - Delivery rate
  - Average response time
  - Automation rate
  - Peak hour activity chart (Recharts)

### Main Dashboard
- **File**: `components/dashboard/Dashboard.tsx`
- Orchestrates all three panels
- Manages customer selection state
- Handles tab navigation
- Responsive layout with flexbox

## Design System

### Color Palette
- **Primary Dark**: `#0B141A` (saban-dark)
- **Accent Emerald**: `#00A884` (saban-emerald) - Action buttons, success states
- **Accent Blue**: `#3B82F6` (saban-blue) - Secondary actions
- **Surface**: `#1E293B` (saban-surface) - Component backgrounds
- **Muted**: `#94A3B8` (saban-muted) - Secondary text

### Styling Features
- **Glassmorphism**: `backdrop-blur-glass`, `bg-glass` classes
- **Terminal Font**: `font-mono` for pipeline logs
- **Responsive**: Mobile-first with Tailwind breakpoints

## Data Models

### Customer Identity
```typescript
interface CustomerIdentity {
  id: string;
  name: string;
  phone: string;
  email?: string;
  profilePicture?: string;
  joinedAt: number;
  lastActive: number;
  tags?: string[];
}
```

### AI Behavior Rules
```typescript
interface AIBehaviorRules {
  id: string;
  customerId: string;
  systemPrompt: string;
  dnaRules: string;  // DNA Rules for AI behavior injection
  temperature: number;  // 0.0 - 1.0
  maxTokens: number;
  responseStyle: 'formal' | 'casual' | 'professional' | 'creative';
  createdAt: number;
  updatedAt: number;
}
```

### Pipeline Packet
```typescript
interface PipelinePacket {
  id: string;
  timestamp: number;
  direction: 'incoming' | 'outgoing';
  source: string;
  destination: string;
  payload: Record<string, any>;
  status: 'processed' | 'pending' | 'failed';
  latency: number;  // milliseconds
}
```

### Infrastructure Config
```typescript
interface InfrastructureConfig {
  rtdbUrl: string;
  callbackUrls: string[];
  messageThrottle: number;  // milliseconds
  heartbeatInterval: number;  // milliseconds
  enableMonitoring: boolean;
  logLevel: 'error' | 'warn' | 'info' | 'debug';
}
```

### Success Metrics
```typescript
interface SuccessMetrics {
  totalMessages: number;
  deliveredMessages: number;
  responseTime: number;  // average in ms
  customerSatisfaction: number;  // 0-100
  automationRate: number;  // percentage
  peakHourActivity: Array<{ hour: number; count: number }>;
}
```

## Firebase Realtime Database Structure

```
├── customers/
│   └── {customerId}/
│       ├── name: string
│       ├── phone: string
│       ├── joinedAt: number
│       └── lastActive: number
├── messages/
│   └── {customerId}/
│       └── {messageId}/
│           ├── content: string
│           ├── fromMe: boolean
│           ├── timestamp: number
│           ├── status: string
│           └── kind: string
├── ai-rules/
│   └── {customerId}/
│       ├── systemPrompt: string
│       ├── dnaRules: string
│       ├── temperature: number
│       └── responseStyle: string
├── success-metrics/
│   └── {customerId}/
│       ├── totalMessages: number
│       ├── deliveredMessages: number
│       ├── responseTime: number
│       └── peakHourActivity: Array
├── rami/
│   ├── incoming/
│   │   └── {packetData}
│   └── outgoing/
│       └── {packetData}
└── infrastructure-config/
    ├── rtdbUrl: string
    ├── callbackUrls: Array
    ├── messageThrottle: number
    └── heartbeatInterval: number
```

## Environment Variables

Required environment variables (add to `.env.local`):

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://your-project-default-rtdb.firebaseio.com/
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

## Getting Started

1. **Install Dependencies**
   ```bash
   npm install
   # or
   pnpm install
   ```

2. **Configure Firebase**
   - Create a Firebase Realtime Database project
   - Add credentials to `.env.local`

3. **Run Development Server**
   ```bash
   npm run dev
   ```

4. **Access Dashboard**
   - Open `http://localhost:3000`
   - Select a customer from the left panel
   - Switch between Chat, Pipeline, and Infrastructure tabs

## Key Features

### Real-time Updates
- Firebase listeners for live customer status
- Real-time message synchronization
- Live pipeline packet monitoring

### AI Capabilities
- Customizable system prompts per customer
- DNA rule injection for AI behavior
- Temperature control for response creativity
- Response style selection (formal/casual/professional/creative)

### Infrastructure Monitoring
- Connection health tracking
- Latency monitoring
- Configurable heartbeat intervals
- Message throttling for rate limiting

### Pipeline Visibility
- "Malshinan" packet sniffer
- Color-coded incoming/outgoing messages
- JSON payload inspection
- Latency visualization

## Styling & Theming

All styles use the SABAN color palette. Customize in:
- `tailwind.config.js` - Color definitions
- `styles/globals.css` - Global styles and utilities

### Key CSS Classes
- `.glass` - Glassmorphism effect
- `.terminal` - Monospace terminal styling
- `.chat-container` - Chat background pattern

## Performance Optimizations

- Real-time database listeners with proper cleanup
- Message pagination (limiting last 50 messages)
- Customer list pagination (last 100)
- Efficient state management with React hooks
- Auto-scroll with configurable behavior

## Future Enhancements

- User authentication system
- Multi-user access control
- Advanced analytics dashboard
- AI model integration with Anthropic/OpenAI
- SMS channel support
- Bulk message campaigns
- Customer segmentation and tagging

## Support

For issues or feature requests, contact the development team.

---

**Last Updated**: 2026-03-26
**Version**: 1.0.0-beta

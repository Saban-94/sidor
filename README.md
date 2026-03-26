# SABAN HUB - AI Customer Management Platform

![SABAN HUB](public/saban-hub-logo.jpg)

## Overview

**SABAN HUB** is a unified AI-powered customer management platform combining real-time WhatsApp-style messaging, advanced AI behavior configuration, and comprehensive infrastructure monitoring.

### 🎯 Key Features

✨ **Real-time Customer Management** - Live customer list with status indicators  
💬 **Chat Interface** - WhatsApp-style messaging with Firebase sync  
🧠 **AI Studio** - Configure AI behavior with DNA rules and system prompts  
🔌 **Pipeline Monitor (Malshinan)** - Real-time packet sniffer for message tracking  
⚙️ **Infrastructure Controls** - Complete system configuration and monitoring  
📊 **Success Metrics** - Real-time analytics dashboard with Recharts  

## Quick Start

### Prerequisites
- Node.js 18+
- Firebase Realtime Database project
- pnpm (or npm/yarn)

### Setup

```bash
# 1. Clone and install
git clone <repo>
cd sidor
pnpm install

# 2. Configure Firebase
# Copy .env.example to .env.local
cp .env.example .env.local
# Add your Firebase credentials

# 3. Run development server
pnpm dev

# 4. Open http://localhost:3000
```

## Architecture

### Three-Column Layout

```
┌─────────────────────────────────────────────────┐
│ SABAN HUB                                       │
├─────────────────────────────────────────────────┤
│ Customers │ Chat/Pipeline/Infra │ AI Studio    │
│  • Search │  • Messages         │ • Prompts    │
│  • List   │  • Packets          │ • DNA Rules  │
│  • Status │  • Controls         │ • Metrics    │
└─────────────────────────────────────────────────┘
```

### Components

- **CustomerList** - Real-time customer management with search
- **ChatWindow** - WhatsApp-style message interface
- **PipelineMonitor** - "Malshinan" packet sniffer
- **Infrastructure** - System configuration controls
- **AIStudio** - AI behavior configuration with metrics
- **Dashboard** - Main orchestrator layout

## Technology Stack

- **Next.js 16** - React framework
- **React 19.2** - UI library
- **Tailwind CSS v4** - Styling
- **Firebase Realtime DB** - Backend
- **Recharts** - Data visualization
- **TypeScript** - Type safety

## Database Schema

```
firebase/
├── customers/{id}
├── messages/{customerId}/{messageId}
├── ai-rules/{customerId}
├── success-metrics/{customerId}
├── rami/incoming & rami/outgoing
└── infrastructure-config/
```

## Design System

### Colors
- **Saban Dark**: #0B141A (primary background)
- **Saban Emerald**: #00A884 (actions, success)
- **Saban Blue**: #3B82F6 (secondary)
- **Saban Surface**: #1E293B (components)
- **Saban Muted**: #94A3B8 (text)

### Features
- Glassmorphism with backdrop blur
- Terminal-style monospace fonts
- Smooth transitions
- Responsive mobile design

## Documentation

- **[QUICK_START.md](QUICK_START.md)** - Step-by-step guide
- **[SABAN_HUB.md](SABAN_HUB.md)** - Complete architecture
- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Production setup
- **[IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)** - Technical details
- **[BUILD_COMPLETE.md](BUILD_COMPLETE.md)** - What was built

## Environment Variables

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_DATABASE_URL=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

See `.env.example` for template.

## Running

```bash
# Development
pnpm dev

# Production build
pnpm build
pnpm start

# Lint
pnpm lint
```

## Project Structure

```
components/
├── chat/          - Messaging components
└── dashboard/     - Main dashboard components

lib/
├── firebase.ts    - Firebase configuration
└── realtime/      - Real-time adapters

pages/
├── index.tsx      - Main dashboard
└── _app.tsx       - App wrapper

styles/
└── globals.css    - Global styles

types/
└── index.ts       - TypeScript definitions
```

## Features in Detail

### Chat Panel
- Real-time message synchronization
- Message status indicators
- Auto-scroll functionality
- Search and filter support

### Pipeline Monitor (Malshinan)
- Real-time packet inspection
- Color-coded incoming/outgoing
- JSON payload display
- Latency visualization
- Auto-scroll with pause control

### AI Studio
- **Identity**: System prompt, response style, temperature
- **DNA Rules**: Behavior injection system
- **Metrics**: Activity dashboard with charts

### Infrastructure
- RTDB URL management
- Callback URL configuration
- Message throttling
- Heartbeat monitoring
- Connection health tracking

## Firebase Structure

### Collections
- **customers** - User profiles with status
- **messages** - Chat history by customer
- **ai-rules** - AI configuration per customer
- **success-metrics** - Analytics and KPIs
- **rami** - Pipeline incoming/outgoing packets
- **infrastructure-config** - System settings

## Real-time Features

✅ Live customer status updates  
✅ Instant message synchronization  
✅ Real-time metrics dashboard  
✅ Live packet monitoring  
✅ Automatic configuration sync  

## Performance

- Firebase listeners with cleanup
- Message pagination (last 50)
- Customer pagination (last 100)
- Efficient component rendering
- Optimized re-renders

## Deployment

### Vercel (Recommended)

```bash
# Deploy
vercel --prod

# Add environment variables in Vercel dashboard
```

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions.

## Security Notes

- Use Firebase security rules for production
- Never commit `.env.local` to git
- Set up proper authentication
- Configure CORS for APIs
- Enable HTTPS in production

## Troubleshooting

### Firebase Connection Issues
1. Check credentials in `.env.local`
2. Verify database URL is correct
3. Check Firebase security rules
4. Review browser console for errors

### Build Problems
1. Clear `.next` folder
2. Reinstall dependencies: `pnpm install`
3. Check Node.js version (18+)
4. Verify all env variables are set

### Real-time Updates Not Working
1. Check Firebase path structure
2. Verify listener setup in components
3. Review Firebase rules allow read/write
4. Check for console errors

## Contributing

This is a production application. For changes:

1. Test locally first
2. Follow existing patterns
3. Update documentation
4. Create pull request

## License

Proprietary - Saban Enterprises

## Support

For issues and questions:
1. Review documentation files
2. Check component code comments
3. Verify Firebase configuration
4. Enable debug mode if needed

---

**Version**: 1.0.0-beta  
**Last Updated**: 2026-03-26  
**Status**: Ready for Production  

*Built with ❤️ for modern customer management*

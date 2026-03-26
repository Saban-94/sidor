# SABAN HUB - Quick Start Guide

## 🚀 What's New?

You now have a complete **SABAN HUB** - a professional AI customer management platform with:

✅ Real-time customer management  
✅ WhatsApp-style chat interface  
✅ AI behavior configuration (DNA rules)  
✅ Pipeline monitoring (Malshinan sniffer)  
✅ Infrastructure controls  
✅ Success metrics dashboard  
✅ Premium dark theme with glassmorphism  

## 🎯 Quick Start

### 1. Set Up Firebase

```bash
# 1. Create a Firebase project at https://console.firebase.google.com
# 2. Enable Realtime Database
# 3. Create .env.local with your credentials:

NEXT_PUBLIC_FIREBASE_API_KEY=your_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain.firebaseapp.com
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://your-project-default-rtdb.firebaseio.com/
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_bucket.appspot.com
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 2. Install & Run

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Open http://localhost:3000
```

### 3. Explore

The dashboard has three main sections:

```
┌──────────────────────────────────────────────────────────────┐
│  SABAN HUB                               Connected ●         │
├──────────────────────────────────────────────────────────────┤
│  Customers  │  Chat / Pipeline / Infrastructure  │  AI Studio│
│             │                                    │            │
│  • Search   │  Tab: 💬 Chat                     │ • Prompts  │
│  • List     │        🔌 Pipeline                │ • DNA      │
│  • Status   │        ⚙️ Infrastructure          │ • Metrics  │
│             │                                    │            │
└──────────────────────────────────────────────────────────────┘
```

## 📱 Left Panel: Customer List

- Search customers by name or phone
- View online/offline status (green = online, yellow = idle, gray = offline)
- Click to select and view messages
- Real-time updates from Firebase

## 💬 Center Panel: Three Tabs

### 1. Chat Tab
- WhatsApp-style message interface
- View message history with timestamps
- Send messages directly from the form
- Status indicators: sent ✓ / delivered ✓✓ / read ✓✓

### 2. Pipeline Monitor (Malshinan)
- Real-time packet sniffer showing all incoming/outgoing messages
- Color-coded:
  - **🟢 Emerald** = Incoming messages
  - **🔵 Blue** = Outgoing messages
- Shows JSON payload with latency
- Filter by direction or pause monitoring
- Auto-scroll to latest packets

**Example Output:**
```
[14:32:51] → RCV external → rami
├─ {"message": "Hello", "from": "972..."}
├─ [PROCESSED] latency: 12.5ms

[14:32:52] ← SND rami → external
├─ {"response": "Hi there", "to": "972..."}
├─ [PROCESSED] latency: 8.3ms
```

### 3. Infrastructure Tab
- Configure RTDB URL
- Manage callback URLs (add/remove)
- Set message throttle rate
- Configure heartbeat interval
- View connection health and latency
- Change log level (error/warn/info/debug)

## 🧠 Right Panel: AI Studio

### Identity Tab
- **System Prompt**: Define AI personality and behavior
- **Response Style**: Choose from formal/casual/professional/creative
- **Temperature**: Control randomness (0=deterministic, 1=creative)
- Save and persist to Firebase

### DNA Tab
- Enter AI DNA rules for behavior injection
- Markdown-style rule documentation
- Examples:
  ```
  - Always be helpful and courteous
  - Ask for clarification when context is unclear
  - Maintain conversation history
  - Provide concise responses
  ```

### Metrics Tab
- **Total Messages**: Count of all messages
- **Delivered**: Successfully delivered message count
- **Avg Response**: Average response time in milliseconds
- **Automation Rate**: Percentage of AI-handled messages
- **Activity Chart**: Hourly message volume visualization

## 🎨 Design & Colors

```
Primary Colors:
  Dark Blue    #0B141A  (backgrounds)
  Emerald      #00A884  (actions, success)
  Royal Blue   #3B82F6  (secondary)
  
Supporting:
  Slate        #0F172A  (components)
  Surface      #1E293B  (cards)
  Muted        #94A3B8  (text)
```

## 🔌 Firebase Database Structure

```
Root
├── customers/
│   └── {customerId}/
│       ├── name, phone, email
│       ├── joinedAt, lastActive
│       └── profilePicture, tags
│
├── messages/
│   └── {customerId}/
│       └── {messageId}/
│           ├── content, body
│           ├── fromMe, timestamp
│           └── status, kind
│
├── ai-rules/
│   └── {customerId}/
│       ├── systemPrompt, dnaRules
│       ├── temperature, responseStyle
│       └── createdAt, updatedAt
│
├── success-metrics/
│   └── {customerId}/
│       ├── totalMessages, deliveredMessages
│       ├── responseTime, automationRate
│       └── peakHourActivity
│
├── rami/
│   ├── incoming/
│   └── outgoing/
│
└── infrastructure-config/
    ├── rtdbUrl, callbackUrls
    ├── messageThrottle, heartbeatInterval
    └── enableMonitoring, logLevel
```

## 🔄 Real-time Features

- **Customer List**: Updates when a customer's status changes
- **Messages**: New messages appear instantly
- **Metrics**: Dashboard updates with new activity
- **Pipeline**: All incoming/outgoing packets show in real-time
- **Infrastructure**: Configuration changes take effect immediately

## 🛠️ Developer Features

### Component Structure
```
components/
├── chat/
│   ├── ChatWindow.tsx      (Message interface)
│   └── MessageBubble.tsx   (Message display)
└── dashboard/
    ├── Dashboard.tsx       (Main layout)
    ├── CustomerList.tsx    (Left panel)
    ├── AIStudio.tsx        (Right panel)
    ├── PipelineMonitor.tsx (Malshinan)
    └── Infrastructure.tsx  (Controls)
```

### Type Definitions
All types are in `types/index.ts`:
- `CustomerIdentity` - Customer profile
- `AIBehaviorRules` - AI configuration
- `PipelinePacket` - Message packet
- `InfrastructureConfig` - System config
- `SuccessMetrics` - Analytics

### Firebase Integration
- All components use real-time listeners
- Automatic cleanup on unmount
- No polling - pure reactive updates
- Optimized query limits (last 50 messages, last 100 customers)

## 📊 Sample Test Data Setup

Add this to your Firebase Realtime Database manually:

```json
{
  "customers": {
    "cust_001": {
      "name": "John Smith",
      "phone": "972551234567",
      "email": "john@example.com",
      "joinedAt": 1709000000000,
      "lastActive": 1709086400000
    },
    "cust_002": {
      "name": "Sarah Johnson",
      "phone": "972559876543",
      "email": "sarah@example.com",
      "joinedAt": 1708900000000,
      "lastActive": 1709086200000
    }
  },
  "messages": {
    "cust_001": {
      "msg_001": {
        "content": "Hi, can you help me?",
        "body": "Hi, can you help me?",
        "fromMe": false,
        "timestamp": 1709086300000,
        "status": "read",
        "kind": "text",
        "senderId": "cust_001"
      }
    }
  },
  "ai-rules": {
    "cust_001": {
      "systemPrompt": "You are a helpful customer support agent. Be professional and courteous.",
      "dnaRules": "- Always be helpful\n- Ask for clarification\n- Maintain context",
      "temperature": 0.7,
      "responseStyle": "professional",
      "maxTokens": 1024,
      "createdAt": 1709000000000,
      "updatedAt": 1709086400000
    }
  }
}
```

## 🚀 Next Steps

1. **Add Authentication**: Implement Firebase Auth for user login
2. **API Integration**: Connect to WhatsApp Business API
3. **AI Integration**: Add LLM provider (Anthropic/OpenAI)
4. **Database Rules**: Configure Firebase security rules
5. **Notifications**: Add email/SMS notifications
6. **Analytics**: Track user behavior and engagement
7. **Testing**: Add unit and integration tests
8. **Deployment**: Deploy to Vercel

## 📚 Documentation

- **SABAN_HUB.md** - Full feature documentation
- **DEPLOYMENT.md** - Production deployment guide
- **IMPLEMENTATION_SUMMARY.md** - Technical details

## 🆘 Troubleshooting

### Can't connect to Firebase?
- Check `.env.local` has correct credentials
- Verify Firebase project exists
- Check database URL in Firebase Console

### Messages not appearing?
- Ensure customer exists in `customers/` path
- Check Firebase rules allow read/write
- Look for errors in browser console

### Build fails?
- Delete `.next` folder: `rm -rf .next`
- Reinstall: `pnpm install`
- Check Node.js version: `node --version` (needs 18+)

## 📞 Support

For issues and questions:
1. Check the documentation files in the project
2. Review the component code comments
3. Check Firebase Console for database issues
4. Enable debug mode in `.env.local`

---

**Welcome to SABAN HUB!** 🎉  
Happy building!

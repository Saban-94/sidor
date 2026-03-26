# SABAN HUB - Deployment Guide

## Prerequisites

- Node.js 18+ and npm/pnpm/yarn
- Firebase Realtime Database project
- Vercel account (optional, for production deployment)

## Environment Setup

### 1. Firebase Configuration

Create a Firebase Realtime Database project:

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project
3. Enable Realtime Database (start in test mode for development)
4. Go to Project Settings > Service Accounts
5. Copy your Web API configuration

### 2. Create `.env.local`

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://your_project-default-rtdb.firebaseio.com/
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

## Local Development

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Open http://localhost:3000
```

## Database Rules (Security)

For production, set up proper Firebase Security Rules:

```json
{
  "rules": {
    "customers": {
      "$uid": {
        ".read": "auth.uid === $uid || auth.uid === 'admin'",
        ".write": "auth.uid === $uid || auth.uid === 'admin'"
      }
    },
    "messages": {
      "$customerId": {
        ".read": "auth.uid === $customerId || auth.uid === 'admin'",
        ".write": "auth.uid === 'admin' || request.auth.uid === 'admin'"
      }
    },
    "ai-rules": {
      "$customerId": {
        ".read": "auth.uid === 'admin'",
        ".write": "auth.uid === 'admin'"
      }
    },
    "success-metrics": {
      "$customerId": {
        ".read": "auth.uid === 'admin'",
        ".write": "auth.uid === 'admin'"
      }
    },
    "rami": {
      "incoming": {
        ".read": "auth.uid === 'admin'",
        ".write": "root.child('users').child(auth.uid).exists()"
      },
      "outgoing": {
        ".read": "auth.uid === 'admin'",
        ".write": "root.child('users').child(auth.uid).exists()"
      }
    },
    "infrastructure-config": {
      ".read": "auth.uid === 'admin'",
      ".write": "auth.uid === 'admin'"
    }
  }
}
```

## Building for Production

```bash
# Build the application
pnpm build

# Start production server
pnpm start
```

## Deployment to Vercel

### Option 1: Git Integration

1. Push your repository to GitHub
2. Connect your GitHub repository to Vercel
3. Add environment variables in Vercel Project Settings
4. Deploy automatically on push

### Option 2: CLI Deployment

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod

# Add environment variables when prompted
```

## Performance Optimization

### Database Indexing

For better query performance, add indexes to your Realtime Database:

```json
{
  "rules": {
    "customers": {
      ".indexOn": ["lastActive", "joinedAt"]
    },
    "messages": {
      ".indexOn": ["timestamp"]
    }
  }
}
```

### Caching Strategy

- Messages are limited to last 50 for initial load
- Customers limited to last 100 for list view
- Real-time listeners for live updates

## Monitoring

### Firebase Console

- Monitor database usage in Firebase Console
- Check for security issues in "Rules" tab
- View real-time database activity

### Application Logging

Enable debug logging in `.env.local`:

```bash
DEBUG=saban-hub:*
```

## Troubleshooting

### Firebase Connection Issues

1. Check Firebase credentials in `.env.local`
2. Verify database URL is correct
3. Check Firebase security rules allow read/write
4. Ensure CORS is properly configured

### Message Not Syncing

1. Check Firebase Realtime Database path
2. Verify customer exists in database
3. Check browser console for errors
4. Look for Firebase auth issues

### Build Failures

1. Clear `.next` folder: `rm -rf .next`
2. Reinstall dependencies: `pnpm install`
3. Check Node.js version: `node --version`
4. Verify all environment variables are set

## Database Backup

### Automated Backup

Enable automated backups in Firebase Console:
- Settings > Backups
- Schedule daily backups

### Manual Export

```bash
# Export data as JSON
# Use Firebase Console > Realtime Database > Menu > Import JSON
```

## Scaling Considerations

### Current Limitations
- Limited to Realtime Database read/write limits
- Single region deployment
- No caching layer

### Scaling Strategy

1. **Add Caching**: Implement Redis for frequently accessed data
2. **Database Sharding**: Distribute customers across regions
3. **Load Balancing**: Use Vercel's auto-scaling
4. **Message Queue**: Implement Bull/RabbitMQ for pipeline

## Security Checklist

- [ ] Firebase rules configured for production
- [ ] Environment variables secured (not in git)
- [ ] HTTPS enforced in production
- [ ] API rate limiting configured
- [ ] User authentication implemented
- [ ] Data encryption at rest enabled
- [ ] Regular security audits scheduled
- [ ] Backup and recovery plan in place

## Support

For deployment issues, refer to:
- [Vercel Docs](https://vercel.com/docs)
- [Firebase Docs](https://firebase.google.com/docs)
- [Next.js Docs](https://nextjs.org/docs)

---

**Last Updated**: 2026-03-26

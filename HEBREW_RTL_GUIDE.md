# SabanOS Hebrew RTL & Dual-Theme Implementation Guide

## Overview
This document describes the complete Hebrew RTL (Right-to-Left) interface with dual dark/light theme system implemented for SabanOS.

## Theme System Architecture

### Design Tokens (CSS Variables)
Located in `/styles/globals.css`, the theme system uses CSS custom properties for seamless theme switching:

**Dark Theme (Default)**
- Background: `#0b141a`
- Surface: `#111f2e`
- Primary: `#10b981` (Emerald Green)
- Text Primary: `#ffffff`

**Light Theme**
- Background: `#f8f9fa`
- Surface: `#ffffff`
- Primary: `#10b981` (Emerald Green)
- Text Primary: `#1f2937`

### Theme Provider Context
`/contexts/ThemeContext.tsx` - Manages:
- Theme state (dark/light)
- Language state (Hebrew/English)
- LocalStorage persistence
- System preference detection

```tsx
import { useTheme } from '@/contexts/ThemeContext';

const { theme, language, toggleTheme, setLanguage } = useTheme();
```

## RTL Implementation

### HTML Direction
The theme provider automatically sets:
- `dir="rtl"` for Hebrew
- `dir="ltr"` for English
- `html.lang` attribute

### Layout Adjustments
All components use Tailwind's RTL support:
- Padding/Margin automatically flip (e.g., `pr-4` becomes `pl-4` in RTL)
- Text alignment respects direction
- Flexbox and grid flows adjust automatically

### Example RTL Pattern
```tsx
<motion.div
  initial={{ x: language === 'he' ? 300 : -300 }}
  animate={{ x: 0 }}
  className={`${language === 'he' ? 'right-0' : 'left-0'}`}
/>
```

## New Components

### 1. ProductCard
**Location:** `/components/sabanOS/ProductCard.tsx`

Displays products with:
- Supabase storage image fetching
- Price and stock status indicators
- Success animation on add-to-cart
- Magic chime sound effect + success beep

```tsx
<ProductCard
  id="1"
  name="Portland Cement"
  price={450}
  stock={25}
  imageUrl="..."
  onAddToCart={handleAddToCart}
/>
```

### 2. SideNavigation
**Location:** `/components/sabanOS/SideNavigation.tsx`

Animated hamburger menu with:
- Navigation links (Dashboard, Inventory, Order History)
- Theme toggle (Dark/Light)
- Language toggle (Hebrew/English)
- Smooth slide-in animation (RTL-aware)

### 3. OrderSummary
**Location:** `/components/sabanOS/OrderSummary.tsx`

Displays exact user input as a bubble above chat input:
- Shows what user typed (e.g., "רוצה 4 טיט")
- Animated entrance
- Contextual positioning

### 4. ThemeProvider
**Location:** `/contexts/ThemeContext.tsx`

Custom React context providing:
- `theme`: 'dark' | 'light'
- `language`: 'he' | 'en'
- `toggleTheme()`: Switch themes
- `setLanguage()`: Change language
- Automatic localStorage sync
- System preference detection

## Audio Integration

### Magic Chime Sound
**File:** `/public/magic-chime.mp3`

Triggered when items are added to cart:
```tsx
import { playChimeSound, playSuccessSound } from '@/lib/audio';

playChimeSound(); // Plays magic chime
playSuccessSound(); // Plays Web Audio beep
```

**Utility Functions** (`/lib/audio.ts`):
- `playChimeSound()` - Plays magic-chime.mp3
- `playSuccessSound()` - Creates synth beep using Web Audio API (fallback)

## Supabase Integration

### Storage & Database
**File:** `/lib/supabase.ts`

Provides utilities for:
- `getProductImageUrl()` - Fetch from Supabase Storage
- `getProductByName()` - Query products by name
- `getProducts()` - Get all products
- `updateProductStock()` - Update inventory

### Expected Database Schema
```sql
CREATE TABLE products (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  price DECIMAL NOT NULL,
  stock INTEGER NOT NULL,
  image_path TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Backend Integration

### API Service
**File:** `/lib/api.ts`

Functions for backend communication:

```tsx
// Chat with AI
const response = await sendMessageToAI(message, language);
// Expected response:
// {
//   reply: "string",
//   orderPlaced?: boolean,
//   items?: [{ id, name, price, stock, imageUrl }]
// }

// Create order
const order = await createOrder(items, totalPrice, language);

// Get recommendations
const products = await getProductRecommendations(query, language);
```

### API Endpoints (to implement in backend)
- `POST /api/chat` - Send message, get AI response
- `POST /api/orders` - Create order
- `POST /api/products/recommendations` - Get product suggestions

## Component Tree

```
_app.tsx (ThemeProvider wrapper)
└── saban-os.tsx
    ├── Header (with hamburger menu)
    │   └── SideNavigation (drawer)
    ├── ChatMessages
    ├── ProductCard (dynamically shown)
    ├── OrderSummary (input echo)
    ├── QuickActions
    ├── ChatInput
    ├── FloatingActionButton
    └── CartDrawer (RTL-aware positioning)
```

## Styling System

### Glass-Effect Classes
```css
.glass-effect /* Light blur, semi-transparent */
.glass-effect-strong /* Strong blur, more opaque */
.glass-effect-light /* Subtle effect */

/* Automatically supports light theme:
   :root.light .glass-effect { ... } */
```

### Text with Zero Transparency Issues
All text colors use CSS variables directly:
```css
color: var(--color-text-primary);
background-color: var(--color-surface);
```

This ensures:
- No text transparency issues
- Proper contrast ratios in both themes
- Consistent readability

## Usage Examples

### Toggle Theme
```tsx
const { theme, toggleTheme } = useTheme();

<button onClick={toggleTheme}>
  {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
</button>
```

### Switch Language
```tsx
const { language, setLanguage } = useTheme();

<button onClick={() => setLanguage(language === 'he' ? 'en' : 'he')}>
  {language === 'he' ? 'English' : 'עברית'}
</button>
```

### Use Product Card
```tsx
<ProductCard
  id="cement-1"
  name={language === 'he' ? 'צמנט פורטלנד' : 'Portland Cement'}
  price={450}
  stock={50}
  imageUrl="https://supabase.../cement.jpg"
  onAddToCart={(id, name, price) => {
    // Add to cart logic
  }}
/>
```

## Mobile Optimization

- No zoom allowed (viewport-fit=cover)
- Safe area insets for notched devices
- RTL layout fully responsive
- Native app feel (glassmorphism + animations)
- Touch-friendly targets (min 44x44px)

## Browser Support

- Modern browsers (Chrome, Safari, Firefox, Edge)
- iOS 14+ (full PWA support)
- Android 6+ (full PWA support)
- IE11+ (basic support, no CSS variables)

## Performance Considerations

1. **Theme switching** - Uses CSS variables (instant, no re-renders)
2. **Image lazy-loading** - ProductCard uses native lazy-loading
3. **Audio playback** - Falls back to Web Audio API if mp3 unavailable
4. **RTL support** - No performance impact (CSS-based)

## Accessibility

- Semantic HTML elements
- ARIA labels on interactive components
- High contrast ratios in both themes
- Keyboard navigation support
- Screen reader friendly

## Debugging

Enable debug logging:
```tsx
console.log('[v0] Theme changed to:', theme);
console.log('[v0] Language set to:', language);
console.log('[v0] Error getting product image:', error);
```

All debug statements use the `[v0]` prefix for easy filtering.

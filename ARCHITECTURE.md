# Avax Ledger - Architecture Documentation

## System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                               │
│                                                                      │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐   │
│  │  Landing   │  │ Dashboard  │  │  Insights  │  │  Settings  │   │
│  │    Page    │  │    Page    │  │    Page    │  │    Page    │   │
│  └────────────┘  └────────────┘  └────────────┘  └────────────┘   │
│         │               │                │               │          │
│         └───────────────┴────────────────┴───────────────┘          │
│                              │                                       │
│                    ┌─────────▼─────────┐                           │
│                    │    Header         │                           │
│                    │  • WalletButton   │                           │
│                    │  • ThemeToggle    │                           │
│                    │  • Navigation     │                           │
│                    └─────────┬─────────┘                           │
└──────────────────────────────┼───────────────────────────────────────┘
                               │
┌──────────────────────────────▼───────────────────────────────────────┐
│                      WALLET INTEGRATION                               │
│                                                                      │
│  ┌──────────────────────┐        ┌──────────────────────┐          │
│  │   WalletButton       │◀──────▶│    useWallet Hook    │          │
│  │  • Connect           │        │  • State Management   │          │
│  │  • Sign Message      │        │  • Auth Check         │          │
│  │  • Disconnect        │        │  • Chain Validation   │          │
│  └──────────┬───────────┘        └──────────┬───────────┘          │
│             │                               │                       │
│             └───────────────┬───────────────┘                       │
│                             │                                       │
│                    ┌────────▼────────┐                             │
│                    │  wagmi + viem   │                             │
│                    │  • Connectors   │                             │
│                    │  • RPC Calls    │                             │
│                    │  • Signatures   │                             │
│                    └────────┬────────┘                             │
└─────────────────────────────┼──────────────────────────────────────┘
                              │
                    ┌─────────▼─────────┐
                    │   Wallet         │
                    │  (MetaMask, WC)  │
                    └─────────┬─────────┘
                              │
┌─────────────────────────────▼──────────────────────────────────────┐
│                    AUTHENTICATION FLOW                              │
│                                                                     │
│  1. Request Nonce                                                  │
│     Frontend ──────▶ POST /api/auth/nonce ──────▶ Generate Nonce │
│                                                                     │
│  2. Sign Message                                                   │
│     Frontend ──────▶ Wallet.signMessage() ──────▶ User Signs     │
│                                                                     │
│  3. Verify Signature                                               │
│     Frontend ──────▶ POST /api/auth/verify ──────▶ SIWE Verify   │
│                          ↓                                         │
│                     Create Session                                 │
│                          ↓                                         │
│                     Set Cookie (HTTP-Only)                        │
│                                                                     │
│  4. Authenticated Requests                                         │
│     Frontend ──────▶ API Routes ──────▶ Check Session Cookie     │
└─────────────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────▼──────────────────────────────────────┐
│                        API ROUTES                                   │
│                                                                     │
│  ┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐ │
│  │   /api/auth     │   │ /api/portfolio  │   │  /api/insights  │ │
│  │  • nonce        │   │  • [address]    │   │  • [address]    │ │
│  │  • verify       │   │  • history      │   │  • generate     │ │
│  │  • session      │   │  • refresh      │   │                 │ │
│  │  • logout       │   │                 │   │                 │ │
│  └────────┬────────┘   └────────┬────────┘   └────────┬────────┘ │
│           │                     │                      │          │
│           └──────────┬──────────┴──────────────────────┘          │
└──────────────────────┼─────────────────────────────────────────────┘
                       │
┌──────────────────────▼─────────────────────────────────────────────┐
│                       SERVICES                                      │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │  Portfolio Aggregation Service                                │ │
│  │  • Fetch from Zerion                                          │ │
│  │  • Fetch from CoinGecko                                       │ │
│  │  • Fetch from DeFi Llama                                      │ │
│  │  • Calculate metrics                                          │ │
│  └──────────────────────┬───────────────────────────────────────┘ │
│                         │                                          │
│  ┌──────────────────────▼───────────────────────────────────────┐ │
│  │  AI Insights Service                                          │ │
│  │  • OpenAI integration                                         │ │
│  │  • Prompt engineering                                         │ │
│  │  • Insight generation                                         │ │
│  │  • Validation                                                 │ │
│  └──────────────────────┬───────────────────────────────────────┘ │
└─────────────────────────┼─────────────────────────────────────────┘
                          │
┌─────────────────────────▼─────────────────────────────────────────┐
│                     DATA LAYER                                     │
│                                                                    │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐         │
│  │   MongoDB    │   │  External    │   │  Blockchain  │         │
│  │              │   │    APIs      │   │     RPCs     │         │
│  │ • Users      │   │ • Zerion     │   │ • Avalanche  │         │
│  │ • Sessions   │   │ • CoinGecko  │   │ • Fuji       │         │
│  │ • Portfolios │   │ • DeFi Llama │   │              │         │
│  │ • Insights   │   │              │   │              │         │
│  └──────────────┘   └──────────────┘   └──────────────┘         │
└────────────────────────────────────────────────────────────────────┘
```

## Component Hierarchy

```
RootLayout
├── ThemeProvider
│   └── WagmiProvider
│       ├── QueryClientProvider
│       │   ├── Header
│       │   │   ├── Logo
│       │   │   ├── ThemeToggle
│       │   │   └── WalletButton
│       │   │       ├── ConnectDialog
│       │   │       └── AccountDropdown
│       │   │
│       │   └── Page Content
│       │       ├── Landing Page
│       │       │   ├── Hero Section
│       │       │   ├── Features Grid
│       │       │   ├── How It Works
│       │       │   └── CTA Section
│       │       │
│       │       └── Dashboard Page
│       │           ├── NetworkSwitcher
│       │           ├── Connection Alerts
│       │           └── Dashboard Grid
│       │               ├── Portfolio Card
│       │               ├── Allocation Card
│       │               ├── Insights Card
│       │               └── Performance Card
│       │
│       └── Toaster (Notifications)
```

## Data Flow

### Authentication Flow

```
User                    Frontend                Backend                 Wallet
 │                         │                       │                      │
 │  1. Click Connect       │                       │                      │
 ├────────────────────────▶│                       │                      │
 │                         │  2. Request Nonce     │                      │
 │                         ├──────────────────────▶│                      │
 │                         │  3. Return Nonce      │                      │
 │                         │◀──────────────────────┤                      │
 │                         │  4. Request Signature │                      │
 │                         ├───────────────────────┼─────────────────────▶│
 │  5. Approve in Wallet   │                       │                      │
 ├─────────────────────────┼───────────────────────┼─────────────────────▶│
 │                         │  6. Return Signature  │                      │
 │                         │◀──────────────────────┼──────────────────────┤
 │                         │  7. Verify Signature  │                      │
 │                         ├──────────────────────▶│                      │
 │                         │  8. Create Session    │                      │
 │                         │◀──────────────────────┤                      │
 │  9. Authenticated       │                       │                      │
 │◀────────────────────────┤                       │                      │
```

### Portfolio Data Flow (Future)

```
User                 Frontend              Backend             External APIs
 │                      │                     │                      │
 │  1. View Dashboard   │                     │                      │
 ├─────────────────────▶│                     │                      │
 │                      │  2. Request Portfolio                      │
 │                      ├────────────────────▶│                      │
 │                      │                     │  3. Fetch Positions  │
 │                      │                     ├─────────────────────▶│
 │                      │                     │  4. Fetch Prices     │
 │                      │                     ├─────────────────────▶│
 │                      │                     │  5. Fetch TVL Data   │
 │                      │                     ├─────────────────────▶│
 │                      │                     │  6. Aggregate Data   │
 │                      │                     │  7. Calculate Metrics│
 │                      │  8. Return Portfolio                       │
 │                      │◀────────────────────┤                      │
 │  9. Display Data     │                     │                      │
 │◀─────────────────────┤                     │                      │
```

## Technology Stack

### Frontend Stack
```
┌─────────────────────────────────────────┐
│            Next.js 15                    │
│  (App Router + Server Components)        │
├─────────────────────────────────────────┤
│            React 19                      │
│         (Client Components)              │
├─────────────────────────────────────────┤
│          TypeScript                      │
│        (Type Safety)                     │
├─────────────────────────────────────────┤
│        Tailwind CSS 4                    │
│         (Styling)                        │
├─────────────────────────────────────────┤
│      shadcn/ui + Radix UI               │
│      (Component Library)                 │
├─────────────────────────────────────────┤
│       wagmi v2 + viem                    │
│      (Web3 Integration)                  │
├─────────────────────────────────────────┤
│      React Query (TanStack)             │
│      (State Management)                  │
└─────────────────────────────────────────┘
```

### Backend Stack
```
┌─────────────────────────────────────────┐
│        Next.js API Routes               │
│       (Serverless Functions)             │
├─────────────────────────────────────────┤
│            SIWE                          │
│      (Authentication)                    │
├─────────────────────────────────────────┤
│        iron-session                      │
│      (Session Management)                │
├─────────────────────────────────────────┤
│          MongoDB                         │
│        (Database)                        │
├─────────────────────────────────────────┤
│         OpenAI API                       │
│      (AI Insights)                       │
└─────────────────────────────────────────┘
```

## Security Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Security Layers                          │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  1. Transport Layer Security (HTTPS)                   │ │
│  │     • TLS 1.3                                          │ │
│  │     • Secure cookies                                   │ │
│  └────────────────────────────────────────────────────────┘ │
│                             │                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  2. Authentication (SIWE)                              │ │
│  │     • Cryptographic signatures                         │ │
│  │     • Nonce-based replay protection                    │ │
│  │     • Message expiration (15 min)                      │ │
│  │     • Domain & chain ID binding                        │ │
│  └────────────────────────────────────────────────────────┘ │
│                             │                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  3. Session Security (iron-session)                    │ │
│  │     • AES-256-GCM encryption                           │ │
│  │     • HTTP-only cookies                                │ │
│  │     • SameSite: Lax                                    │ │
│  │     • Secure flag (production)                         │ │
│  │     • 7-day expiration                                 │ │
│  └────────────────────────────────────────────────────────┘ │
│                             │                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  4. API Security                                       │ │
│  │     • Middleware validation                            │ │
│  │     • Rate limiting (future)                           │ │
│  │     • Input sanitization                               │ │
│  │     • CORS policies                                    │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Vercel Edge                          │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              CDN & Edge Functions                       │ │
│  │  • Static assets (CSS, JS, images)                     │ │
│  │  • Edge middleware                                     │ │
│  │  • ISR (Incremental Static Regeneration)              │ │
│  └──────────────────────┬─────────────────────────────────┘ │
└─────────────────────────┼───────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│                  Next.js Application                        │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              Serverless Functions                       │ │
│  │  • API Routes (/api/*)                                 │ │
│  │  • Server Components                                    │ │
│  │  • Server Actions                                       │ │
│  └──────────────────────┬─────────────────────────────────┘ │
└─────────────────────────┼───────────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
        ▼                 ▼                 ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   MongoDB    │  │ External APIs│  │   Avalanche  │
│    Atlas     │  │ (Zerion, etc)│  │     RPC      │
└──────────────┘  └──────────────┘  └──────────────┘
```

## State Management

```
┌─────────────────────────────────────────────────────────────┐
│                    Application State                         │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Wallet State (wagmi)                                   │ │
│  │  • Connection status                                    │ │
│  │  • Address                                              │ │
│  │  • Chain ID                                             │ │
│  │  • Balance                                              │ │
│  └────────────────────────────────────────────────────────┘ │
│                             │                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Auth State (useWallet hook)                           │ │
│  │  • Authentication status                                │ │
│  │  • Session data                                         │ │
│  │  • User preferences                                     │ │
│  └────────────────────────────────────────────────────────┘ │
│                             │                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Theme State (next-themes)                             │ │
│  │  • Current theme                                        │ │
│  │  • System preference                                    │ │
│  └────────────────────────────────────────────────────────┘ │
│                             │                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Query Cache (React Query)                             │ │
│  │  • Portfolio data                                       │ │
│  │  • Historical data                                      │ │
│  │  • Insights data                                        │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Performance Optimizations

- **Code Splitting**: Automatic route-based splitting
- **Lazy Loading**: Dynamic imports for heavy components
- **Image Optimization**: Next.js Image component
- **CSS Optimization**: Tailwind CSS purging
- **React Query Caching**: 1-minute stale time
- **Server Components**: Reduced client-side JavaScript
- **Edge Middleware**: Fast authentication checks
- **Static Generation**: Pre-rendered pages where possible

## Monitoring & Observability (Future)

```
┌─────────────────────────────────────────────────────────────┐
│                    Monitoring Stack                          │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Error Tracking (Sentry)                                │ │
│  │  • Frontend errors                                      │ │
│  │  • API errors                                           │ │
│  │  • Performance metrics                                  │ │
│  └────────────────────────────────────────────────────────┘ │
│                             │                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Analytics                                              │ │
│  │  • User flows                                           │ │
│  │  • Feature usage                                        │ │
│  │  • Conversion rates                                     │ │
│  └────────────────────────────────────────────────────────┘ │
│                             │                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Logging (Winston)                                      │ │
│  │  • Structured JSON logs                                 │ │
│  │  • Request tracing                                      │ │
│  │  • API usage metrics                                    │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Summary

The architecture is:
- ✅ **Modular**: Clear separation of concerns
- ✅ **Scalable**: Monorepo ready for growth
- ✅ **Secure**: Multiple layers of security
- ✅ **Performant**: Optimized at every layer
- ✅ **Maintainable**: Well-documented and typed
- ✅ **Extensible**: Easy to add new features


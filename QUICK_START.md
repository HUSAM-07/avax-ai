# Quick Start Guide

Get your Avax Ledger development environment up and running in minutes.

## Prerequisites

- Node.js 20+ and npm
- A Web3 wallet (MetaMask, Coinbase Wallet, etc.)
- MongoDB instance (local or cloud)

## Installation

### 1. Clone and Install

```bash
git clone <your-repo-url> avax-ledger
cd avax-ledger
npm install
```

### 2. Environment Setup

Copy the example environment file:

```bash
cp .env.example .env.local
```

### 3. Configure Environment Variables

Edit `.env.local` with your values:

```bash
# Required
MONGODB_URI=mongodb://localhost:27017/avax-ledger
SESSION_SECRET=$(openssl rand -base64 32)

# WalletConnect (Get from: https://cloud.walletconnect.com)
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_project_id

# Optional for full functionality
OPENAI_API_KEY=sk-proj-...
ZERION_API_KEY=your_zerion_key
COINGECKO_API_KEY=your_coingecko_key
```

### 4. Start MongoDB

**Option A: Local MongoDB**
```bash
# macOS
brew services start mongodb-community

# Linux
sudo systemctl start mongod

# Windows
net start MongoDB
```

**Option B: Docker**
```bash
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

**Option C: MongoDB Atlas** (Recommended)
- Sign up at https://www.mongodb.com/cloud/atlas
- Create a free cluster
- Get connection string and add to `.env.local`

### 5. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## First Steps

### 1. Connect Your Wallet

1. Click "Connect Wallet" button in the header
2. Select your wallet provider (MetaMask, WalletConnect, etc.)
3. Approve the connection in your wallet

### 2. Sign In

1. After connecting, click "Sign Message"
2. Sign the SIWE message in your wallet
3. You're now authenticated!

### 3. View Dashboard

1. Navigate to `/dashboard`
2. See your portfolio overview (placeholder data for now)
3. Explore the UI components

## Project Structure

```
avax-ledger/
├── apps/
│   └── web/                    # Next.js frontend
│       ├── app/                # App router pages
│       │   ├── api/           # API routes
│       │   ├── dashboard/     # Dashboard page
│       │   └── page.tsx       # Landing page
│       ├── components/         # React components
│       │   ├── layout/        # Layout components
│       │   ├── providers/     # Context providers
│       │   ├── theme/         # Theme components
│       │   ├── ui/            # shadcn/ui components
│       │   └── wallet/        # Wallet components
│       ├── hooks/             # Custom React hooks
│       ├── lib/               # Utilities
│       │   ├── auth/          # Authentication
│       │   ├── blockchain/    # Blockchain utilities
│       │   ├── services/      # API clients
│       │   └── wagmi/         # wagmi configuration
│       └── package.json
├── packages/
│   ├── config/                # Shared configuration
│   ├── types/                 # Shared TypeScript types
│   └── utils/                 # Shared utilities
├── services/
│   ├── insights/              # AI insights service
│   └── portfolio/             # Portfolio aggregation
└── infrastructure/
    └── mongodb/               # Database schemas
```

## Available Scripts

```bash
# Development
npm run dev              # Start development server
npm run build            # Build for production
npm run start            # Start production server

# Code Quality
npm run lint             # Run ESLint
npm run type-check       # Run TypeScript type checker

# Testing (to be implemented)
npm run test             # Run tests
npm run test:watch       # Run tests in watch mode

# Utilities
npm run clean            # Clean build artifacts
```

## Key Features Implemented

✅ **Wallet Integration**
- Connect with MetaMask, WalletConnect, Coinbase Wallet
- Sign-In with Ethereum (SIWE) authentication
- Secure session management

✅ **UI Components**
- Beautiful landing page
- Responsive header with theme toggle
- Dashboard with authentication states
- Full shadcn/ui component library

✅ **Authentication Flow**
- Nonce generation
- SIWE message signing
- Signature verification
- Session management with iron-session

✅ **Developer Experience**
- TypeScript throughout
- ESLint configured
- Monorepo with Turborepo
- Hot reload with Next.js 15

## Next Steps

### Immediate (Already Implemented)
- ✅ Wallet connection UI
- ✅ SIWE authentication
- ✅ Basic dashboard layout
- ✅ Theme support (light/dark mode)

### In Progress
- 🔄 Portfolio API endpoints
- 🔄 Data aggregation from Zerion/CoinGecko
- 🔄 Dashboard data visualization
- 🔄 AI insights integration

### Coming Soon
- ⏳ Real-time portfolio tracking
- ⏳ Historical performance charts
- ⏳ AI-powered recommendations
- ⏳ Alert system
- ⏳ What-if simulator

## Troubleshooting

### Wallet Won't Connect

**Issue:** MetaMask doesn't open
- **Solution:** Ensure MetaMask extension is installed and unlocked

**Issue:** WalletConnect not working
- **Solution:** Add `NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID` to `.env.local`

### Session Issues

**Issue:** "Unauthorized" errors after signing in
- **Solution:** Check that `SESSION_SECRET` is at least 32 characters
- **Solution:** Ensure cookies are enabled in your browser

### Network Issues

**Issue:** "Wrong Network" error
- **Solution:** Switch to Avalanche C-Chain (Chain ID: 43114) in your wallet
- **Solution:** Use the NetworkSwitcher component in the UI

### MongoDB Connection

**Issue:** "MongooseServerSelectionError"
- **Solution:** Ensure MongoDB is running
- **Solution:** Check connection string in `.env.local`
- **Solution:** Whitelist your IP in MongoDB Atlas

## Development Tips

1. **Use the Dev Tools**: Install React DevTools and wagmi DevTools
2. **Check Console**: Many helpful debug messages in browser console
3. **Environment Variables**: Restart dev server after changing `.env.local`
4. **Clear Cookies**: If auth issues persist, clear browser cookies
5. **Network Tab**: Monitor API calls in browser network tab

## Resources

- **Documentation**: See `WALLET_INTEGRATION.md` for detailed docs
- **Architecture**: See `adr/plan.md` for architecture decisions
- **API Reference**: See individual API route files for endpoint docs
- **Component Library**: Browse `apps/web/components/ui/` for available components

## Getting Help

1. Check the documentation files in the repo
2. Look for similar issues in the codebase
3. Check console and network tab for errors
4. Review the component README files

## What's Next?

Now that your environment is set up, you can:

1. **Explore the codebase** - Understand the structure
2. **Connect your wallet** - Test the authentication flow
3. **View the dashboard** - See the placeholder UI
4. **Read the docs** - Learn about wallet integration
5. **Start building** - Add new features!

Happy coding! 🚀


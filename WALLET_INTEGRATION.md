# Wallet Integration Guide

This document explains the wallet integration implementation for Avax Ledger, including setup, architecture, and usage.

## Overview

The wallet integration uses **wagmi v2** with **viem** for Web3 interactions, **SIWE (Sign-In with Ethereum)** for authentication, and **iron-session** for secure session management.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                             │
│                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │ WalletButton │───▶│ wagmi hooks  │───▶│   viem       │  │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
│         │                                         │          │
│         │                                         │          │
│         ▼                                         ▼          │
│  ┌──────────────┐                        ┌──────────────┐  │
│  │  useWallet   │                        │   Wallet     │  │
│  │     hook     │                        │  (MetaMask)  │  │
│  └──────────────┘                        └──────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ Sign SIWE Message
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                         Backend                              │
│                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │ /api/auth    │───▶│     SIWE     │───▶│ iron-session │  │
│  │   routes     │    │  Verification│    │   (cookies)  │  │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Setup

### 1. Environment Variables

Create a `.env.local` file with the following:

```bash
# WalletConnect Project ID (Get from https://cloud.walletconnect.com)
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_project_id_here

# Session secret (Generate with: openssl rand -base64 32)
SESSION_SECRET=your_32_char_secret_here

# Optional: Custom Avalanche RPC
AVALANCHE_RPC_URL=https://api.avax.network/ext/bc/C/rpc
```

### 2. Install Dependencies

All dependencies are already included in `package.json`:

```bash
npm install
```

Key packages:
- `wagmi` - React hooks for Web3
- `viem` - TypeScript Web3 library
- `@web3modal/wagmi` - WalletConnect modal
- `siwe` - Sign-In with Ethereum
- `iron-session` - Secure session management

### 3. Configuration

The wagmi configuration is in `apps/web/lib/wagmi/config.ts`:

```typescript
import { createConfig } from "wagmi";
import { avalanche, avalancheFuji } from "@/lib/blockchain/avalanche";

export const wagmiConfig = createConfig({
  chains: [avalanche, avalancheFuji],
  connectors: [injected(), walletConnect(), coinbaseWallet()],
  transports: {
    [avalanche.id]: http(),
    [avalancheFuji.id]: http(),
  },
});
```

## Components

### WalletButton

Main wallet connection component with authentication flow.

**Props:**
- `onAuthSuccess?: () => void` - Callback after successful authentication

**States:**
1. **Not Connected** - Shows "Connect Wallet" button
2. **Connected but Not Authenticated** - Shows "Sign Message" button
3. **Authenticated** - Shows wallet dropdown with address

**Example:**
```tsx
<WalletButton onAuthSuccess={() => router.push('/dashboard')} />
```

### NetworkSwitcher

Alerts users when they're on the wrong network and provides a button to switch.

**Example:**
```tsx
{isConnected && !isCorrectChain && <NetworkSwitcher />}
```

### ThemeToggle

Toggle between light, dark, and system themes.

**Example:**
```tsx
<ThemeToggle />
```

### Header

Complete header component with logo, theme toggle, and wallet button.

**Example:**
```tsx
<Header />
```

## Hooks

### useWallet

Custom hook that provides wallet state and authentication status.

**Returns:**
```typescript
{
  address: string | undefined;
  isConnected: boolean;
  isAuthenticated: boolean;
  isCorrectChain: boolean;
  chainId: number;
  disconnect: () => void;
  refetchAuth: () => Promise<void>;
}
```

**Example:**
```tsx
const { address, isAuthenticated, isCorrectChain } = useWallet();

if (!isAuthenticated) {
  return <p>Please sign in</p>;
}
```

## Authentication Flow

### Step 1: Connect Wallet

User clicks "Connect Wallet" and selects a provider (MetaMask, WalletConnect, or Coinbase Wallet).

```typescript
const { connect } = useConnect();
connect({ connector });
```

### Step 2: Request Nonce

Frontend requests a nonce from the backend:

```typescript
const response = await fetch("/api/auth/nonce", { method: "POST" });
const { nonce } = await response.json();
```

Backend generates a cryptographically secure nonce:

```typescript
// apps/web/app/api/auth/nonce/route.ts
export async function POST() {
  const nonce = generateNonce();
  // Store nonce temporarily
  return NextResponse.json({ nonce });
}
```

### Step 3: Sign SIWE Message

Frontend constructs and signs a SIWE message:

```typescript
const message = `${domain} wants you to sign in...
URI: ${origin}
Nonce: ${nonce}
Chain ID: ${chainId}`;

const signature = await signMessageAsync({ message });
```

### Step 4: Verify Signature

Frontend sends message and signature to backend:

```typescript
await fetch("/api/auth/verify", {
  method: "POST",
  body: JSON.stringify({ message, signature, nonce }),
});
```

Backend verifies the signature using SIWE:

```typescript
// apps/web/app/api/auth/verify/route.ts
const { success, address } = await verifySiweSignature({
  message,
  signature,
  nonce,
});

if (success) {
  // Create session
  const session = await getSession();
  session.address = address;
  await session.save();
}
```

### Step 5: Session Created

Backend creates an encrypted session using iron-session. The session is stored in an HTTP-only cookie that expires in 7 days.

## API Routes

### POST /api/auth/nonce

Generates a nonce for SIWE authentication.

**Response:**
```json
{
  "nonce": "base64_encoded_nonce"
}
```

### POST /api/auth/verify

Verifies SIWE signature and creates session.

**Request:**
```json
{
  "message": "SIWE message",
  "signature": "0x...",
  "nonce": "base64_encoded_nonce"
}
```

**Response:**
```json
{
  "success": true,
  "address": "0x..."
}
```

### GET /api/auth/session

Returns current session data.

**Response:**
```json
{
  "address": "0x...",
  "chainId": 43114,
  "issuedAt": 1234567890,
  "expiresAt": 1234567890
}
```

### POST /api/auth/logout

Destroys session and clears cookies.

**Response:**
```json
{
  "success": true
}
```

## Middleware

The middleware protects API routes that require authentication:

```typescript
// apps/web/middleware.ts
const protectedRoutes = ["/api/portfolio", "/api/insights"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  );

  if (isProtectedRoute) {
    const sessionCookie = request.cookies.get("avax_ledger_session");
    if (!sessionCookie) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  return NextResponse.next();
}
```

## Security Considerations

### SIWE Security

- **Nonce**: Each signature request uses a unique nonce to prevent replay attacks
- **Expiration**: Messages expire after 15 minutes
- **Domain Binding**: Messages are bound to the current domain
- **Chain ID**: Messages include the chain ID to prevent cross-chain attacks

### Session Security

- **Encryption**: Sessions are encrypted using iron-session with AES-256-GCM
- **HTTP-Only Cookies**: Prevents XSS attacks
- **Secure Flag**: Cookies are secure in production (HTTPS only)
- **SameSite**: Set to `lax` to prevent CSRF attacks
- **Expiration**: Sessions expire after 7 days

### Best Practices

1. **Never expose private keys**: Private keys never leave the user's wallet
2. **Verify on backend**: Always verify signatures on the backend
3. **Use HTTPS in production**: Required for secure cookies
4. **Rotate session secrets**: Change SESSION_SECRET periodically
5. **Rate limit auth endpoints**: Prevent brute force attacks

## Testing

### Local Testing

1. Start the development server:
```bash
npm run dev
```

2. Open http://localhost:3000

3. Click "Connect Wallet"

4. Select MetaMask (or another provider)

5. Approve the connection

6. Sign the SIWE message

7. You should now be authenticated!

### Testing with Different Wallets

**MetaMask:**
- Install MetaMask browser extension
- Create/import a wallet
- Connect and sign

**WalletConnect:**
- Click "WalletConnect" in the modal
- Scan QR code with your mobile wallet
- Sign the message

**Coinbase Wallet:**
- Install Coinbase Wallet extension
- Create/import a wallet
- Connect and sign

## Troubleshooting

### Issue: "WalletConnect will not work"

**Cause:** Missing `NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID`

**Solution:** 
1. Go to https://cloud.walletconnect.com
2. Create a project
3. Copy the Project ID
4. Add to `.env.local`:
```bash
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_project_id
```

### Issue: "Signature verification failed"

**Cause:** Incorrect nonce or expired message

**Solution:**
- Ensure nonce is properly stored and retrieved
- Check that message hasn't expired (15 min limit)
- Verify clock sync between client and server

### Issue: "Session not persisting"

**Cause:** Cookies not being set or SESSION_SECRET too short

**Solution:**
- Ensure SESSION_SECRET is at least 32 characters
- Check browser allows cookies
- Verify not in incognito mode
- Check cookie settings in production

### Issue: "Wrong network"

**Cause:** Wallet connected to different chain

**Solution:**
- Use the NetworkSwitcher component
- Or manually switch to Avalanche C-Chain (Chain ID: 43114) in wallet

## Development Tips

1. **Use the useWallet hook** for consistent wallet state management
2. **Show appropriate UI states** for not connected, connected, and authenticated
3. **Handle network switching** gracefully with NetworkSwitcher
4. **Test on both mainnet and testnet** (Fuji)
5. **Add loading states** for all async operations
6. **Handle errors gracefully** with toast notifications

## Next Steps

After completing wallet integration, you can:

1. **Build Dashboard Components** - Use authenticated state to show user data
2. **Implement Portfolio API** - Fetch user's DeFi positions
3. **Add AI Insights** - Generate personalized recommendations
4. **Create Transaction History** - Show past transactions

## Resources

- [wagmi Documentation](https://wagmi.sh)
- [viem Documentation](https://viem.sh)
- [SIWE Specification](https://docs.login.xyz)
- [iron-session Documentation](https://github.com/vvo/iron-session)
- [Avalanche Documentation](https://docs.avax.network)


# Wallet Integration Components

This directory contains all wallet-related UI components for the Avax Ledger application.

## Components

### WalletButton

The main wallet connection and management component.

**Features:**
- Connect with MetaMask, WalletConnect, or Coinbase Wallet
- Sign-In with Ethereum (SIWE) authentication
- Display connected wallet address
- Copy address to clipboard
- View address on SnowTrace explorer
- Disconnect wallet

**Usage:**
```tsx
import { WalletButton } from "@/components/wallet/wallet-button";

export function MyComponent() {
  return (
    <WalletButton 
      onAuthSuccess={() => {
        // Optional callback after successful authentication
        console.log("User authenticated!");
      }}
    />
  );
}
```

### NetworkSwitcher

Component to help users switch to Avalanche C-Chain if they're connected to the wrong network.

**Usage:**
```tsx
import { NetworkSwitcher } from "@/components/wallet/network-switcher";

export function MyPage() {
  return (
    <div>
      <NetworkSwitcher />
      {/* Your page content */}
    </div>
  );
}
```

## Hooks

### useWallet

A custom hook for managing wallet state throughout your application.

**Usage:**
```tsx
import { useWallet } from "@/hooks/use-wallet";

export function MyComponent() {
  const { 
    address, 
    isConnected, 
    isAuthenticated, 
    isCorrectChain,
    disconnect,
    refetchAuth 
  } = useWallet();

  if (!isConnected) {
    return <p>Please connect your wallet</p>;
  }

  if (!isAuthenticated) {
    return <p>Please sign in with your wallet</p>;
  }

  if (!isCorrectChain) {
    return <p>Please switch to Avalanche C-Chain</p>;
  }

  return <p>Connected: {address}</p>;
}
```

## Authentication Flow

1. **Connect Wallet**: User clicks "Connect Wallet" button
2. **Choose Provider**: User selects MetaMask, WalletConnect, or Coinbase Wallet
3. **Sign Message**: User signs a SIWE message to authenticate
4. **Session Created**: Backend creates a session using iron-session
5. **Access Granted**: User can now access protected resources

## Environment Variables

Make sure these are set in your `.env.local`:

```env
# Required for WalletConnect
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_project_id

# Required for SIWE session management
SESSION_SECRET=your_session_secret_here

# Optional: Custom RPC URL
AVALANCHE_RPC_URL=https://api.avax.network/ext/bc/C/rpc
```

## Security Notes

- SIWE provides secure authentication without passwords
- Sessions are encrypted using iron-session
- No private keys are ever exposed to the backend
- All signatures are verified on-chain
- Sessions expire after 7 days by default

## Styling

All components use the shadcn/ui component library and are fully styled with Tailwind CSS. They support dark mode out of the box and are responsive by default.

## Testing

To test wallet integration locally:

1. Start the development server: `npm run dev`
2. Navigate to the landing page
3. Click "Connect Wallet"
4. Select a wallet provider
5. Approve the connection in your wallet
6. Sign the SIWE message
7. You should now be authenticated!

## Troubleshooting

**Issue**: "WalletConnect will not work" warning in console
- **Solution**: Set `NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID` in your `.env.local`

**Issue**: Wrong network error
- **Solution**: Use the NetworkSwitcher component or manually switch to Avalanche C-Chain in your wallet

**Issue**: Signature verification fails
- **Solution**: Ensure your `SESSION_SECRET` is set correctly and is at least 32 characters long

**Issue**: Session not persisting
- **Solution**: Check that cookies are enabled and that you're not in incognito mode


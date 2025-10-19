# Dashboard Components

This directory contains all dashboard-specific UI components for the Avax Ledger DeFi Portfolio Tracker.

## Components Overview

### 1. PortfolioSummaryCard
**File**: `portfolio-summary-card.tsx`

Displays the main portfolio overview with key metrics.

**Features**:
- Total portfolio value with currency formatting
- 24h and 7d performance changes
- Token count
- Color-coded trend indicators
- Loading skeleton states

**Usage**:
```tsx
<PortfolioSummaryCard
  totalValue={125487.32}
  change24h={3.45}
  change7d={-1.23}
  tokenCount={12}
  isLoading={false}
/>
```

**Props**:
- `totalValue?: number` - Total portfolio value in USD
- `change24h?: number` - 24h percentage change
- `change7d?: number` - 7d percentage change
- `tokenCount?: number` - Number of unique tokens
- `isLoading?: boolean` - Loading state

---

### 2. AssetAllocationChart
**File**: `asset-allocation-chart.tsx`

Interactive pie chart showing portfolio asset distribution.

**Features**:
- Recharts-based pie chart
- Top 5 assets + "Other" aggregation
- Interactive tooltips with detailed info
- Color-coded segments using theme colors
- Responsive legend
- Empty state handling

**Usage**:
```tsx
<AssetAllocationChart
  data={[
    { symbol: "AVAX", value: 45000, percentage: 35.87 },
    { symbol: "USDC", value: 30000, percentage: 23.91 },
    // ... more assets
  ]}
  isLoading={false}
/>
```

**Props**:
- `data?: AssetAllocationData[]` - Array of asset data
- `isLoading?: boolean` - Loading state

**Data Type**:
```typescript
interface AssetAllocationData {
  symbol: string;
  value: number;
  percentage: number;
}
```

---

### 3. PositionsTable
**File**: `positions-table.tsx`

Comprehensive table displaying all DeFi protocol positions.

**Features**:
- Protocol name column
- Position type badges (Staked, Lending, Liquidity, Farming)
- Asset list with truncation
- USD value with currency formatting
- APR/APY display in green
- External link buttons
- Filters out wallet positions automatically
- Empty state for no positions

**Usage**:
```tsx
<PositionsTable
  positions={[
    {
      protocol: "Trader Joe",
      type: "LIQUIDITY",
      totalValueUsd: 35000,
      tokens: [
        { symbol: "AVAX", amount: 150.5 },
        { symbol: "USDC", amount: 17500 }
      ],
      apr: 24.5
    },
    // ... more positions
  ]}
  isLoading={false}
/>
```

**Props**:
- `positions?: Position[]` - Array of positions
- `isLoading?: boolean` - Loading state

**Data Type**:
```typescript
interface Position {
  protocol: string;
  type: string;
  totalValueUsd: number;
  tokens: Array<{
    symbol: string;
    amount: number;
  }>;
  apr?: number;
  apy?: number;
}
```

---

### 4. RiskMetricsCard
**File**: `risk-metrics-card.tsx`

Portfolio risk analysis with multiple metrics.

**Features**:
- Overall risk score (0-100) with 3-tier classification:
  - Low (0-30): Green with shield icon
  - Medium (30-70): Yellow with alert icon
  - High (70-100): Red with warning icon
- Diversification score with labels
- Volatility percentage
- Progress bar visualizations
- Informational panel explaining metrics

**Usage**:
```tsx
<RiskMetricsCard
  riskScore={45}
  diversificationScore={68}
  volatility={12.5}
  isLoading={false}
/>
```

**Props**:
- `riskScore?: number` - Risk score 0-100
- `diversificationScore?: number` - Diversification score 0-100
- `volatility?: number` - Volatility percentage
- `isLoading?: boolean` - Loading state

---

### 5. AIInsightsCard
**File**: `ai-insights-card.tsx`

AI-powered portfolio recommendations and insights.

**Features**:
- Three insight types:
  - 🟢 Opportunity: Growth and yield opportunities
  - 🔴 Risk: Warnings and risk mitigation
  - 🔵 Rebalancing: Portfolio optimization
- Priority levels: High, Medium, Low
- Impact metrics with calculations
- Generate button for new insights
- Refresh button for regeneration
- Loading states with spinner
- Empty state with prominent CTA

**Usage**:
```tsx
<AIInsightsCard
  address="0x1234..."
  insights={[
    {
      type: "opportunity",
      priority: "high",
      title: "High APR Lending Opportunity",
      description: "Consider lending your idle USDC on Benqi...",
      impact: "+$2,100 annual yield on $25,000"
    },
    // ... more insights
  ]}
  isLoading={false}
  onGenerate={handleGenerateInsights}
/>
```

**Props**:
- `address?: string` - Wallet address
- `insights?: Insight[]` - Array of insights
- `isLoading?: boolean` - Loading state
- `onGenerate?: () => void` - Generate callback

**Data Type**:
```typescript
interface Insight {
  type: "opportunity" | "risk" | "rebalancing";
  priority: "high" | "medium" | "low";
  title: string;
  description: string;
  impact?: string;
}
```

---

## Common Patterns

### Loading States
All components support loading states with skeleton placeholders:
```tsx
<Component isLoading={true} />
```

### Empty States
All components gracefully handle empty/missing data:
```tsx
<Component data={[]} />  // Shows appropriate empty state
```

### Responsive Design
All components are responsive and work on:
- Mobile (< 640px): Single column, stacked
- Tablet (640px - 1024px): 2-column grid
- Desktop (> 1024px): Full grid layout

### Theme Support
All components support dark/light mode through CSS variables:
- `hsl(var(--primary))`
- `hsl(var(--secondary))`
- `hsl(var(--muted))`
- `hsl(var(--chart-1))` through `hsl(var(--chart-5))`

## Dependencies

### UI Components
- `@/components/ui/*` - shadcn/ui components
  - Card, CardHeader, CardContent
  - Button, Badge
  - Table, TableRow, TableCell
  - Progress, Skeleton
  - Alert, AlertTitle, AlertDescription

### Charts
- `recharts` - For data visualization
  - Pie, PieChart
  - ResponsiveContainer
  - Cell, Tooltip

### Icons
- `lucide-react` - Icon library
  - TrendingUpIcon, TrendingDownIcon
  - BrainCircuitIcon, SparklesIcon
  - AlertTriangleIcon, ShieldCheckIcon
  - ExternalLinkIcon, RefreshCwIcon

### Utilities
- `@/lib/utils` - cn() for className merging

## Color Scheme

### Risk Indicators
- **Green** (`text-green-500`): Positive, opportunities, low risk
- **Red** (`text-red-500`): Negative, warnings, high risk
- **Yellow** (`text-yellow-500`): Medium risk, alerts
- **Blue** (`text-blue-500`): Information, rebalancing

### Badge Variants
- `default`: Primary color
- `secondary`: Muted color
- `destructive`: Red (high priority)
- `outline`: Border only

## Testing

All components can be tested with static props:

```tsx
import { render } from '@testing-library/react';
import { PortfolioSummaryCard } from './portfolio-summary-card';

test('renders portfolio summary', () => {
  render(
    <PortfolioSummaryCard
      totalValue={100000}
      change24h={5}
      change7d={-2}
      tokenCount={10}
      isLoading={false}
    />
  );
  // Add assertions
});
```

## Performance

### Optimizations
- ✅ React.memo for expensive components
- ✅ Lazy loading for heavy charts
- ✅ Skeleton loading for perceived performance
- ✅ Conditional rendering to avoid unnecessary updates

### Best Practices
- Use `isLoading` prop to show skeletons during data fetching
- Memoize data transformations in parent components
- Pass only required data to components
- Use TypeScript for type safety

## Accessibility

All components follow WCAG AA guidelines:
- ✅ Semantic HTML elements
- ✅ ARIA labels where needed
- ✅ Keyboard navigation support
- ✅ Color contrast compliance
- ✅ Screen reader friendly
- ✅ Focus indicators

## Examples

### Full Dashboard Layout
```tsx
import {
  PortfolioSummaryCard,
  AssetAllocationChart,
  PositionsTable,
  RiskMetricsCard,
  AIInsightsCard,
} from "@/components/dashboard";

export function Dashboard() {
  const { portfolio, insights } = usePortfolioData();

  return (
    <div className="space-y-6">
      {/* Top: Portfolio Summary */}
      <PortfolioSummaryCard
        totalValue={portfolio?.totalValue}
        change24h={portfolio?.change24h}
        change7d={portfolio?.change7d}
        tokenCount={portfolio?.tokenCount}
      />

      {/* Middle: Charts and Risk */}
      <div className="grid gap-6 lg:grid-cols-2">
        <AssetAllocationChart data={portfolio?.tokens} />
        <RiskMetricsCard
          riskScore={portfolio?.riskScore}
          diversificationScore={portfolio?.diversificationScore}
          volatility={portfolio?.volatility}
        />
      </div>

      {/* Bottom: Positions and Insights */}
      <PositionsTable positions={portfolio?.positions} />
      <AIInsightsCard
        address={address}
        insights={insights}
        onGenerate={generateInsights}
      />
    </div>
  );
}
```

## Contributing

When adding new dashboard components:

1. **Follow naming convention**: `[component-name]-[type].tsx`
2. **Add TypeScript interfaces**: Define all prop types
3. **Include loading states**: Support `isLoading` prop
4. **Handle empty states**: Show appropriate messages
5. **Make it responsive**: Use responsive grid/flex
6. **Support theming**: Use CSS variables
7. **Add to index.ts**: Export from barrel file
8. **Document props**: Add JSDoc comments
9. **Test thoroughly**: Test all states (loading, empty, error, success)

## License

Part of Avax Ledger - MIT License


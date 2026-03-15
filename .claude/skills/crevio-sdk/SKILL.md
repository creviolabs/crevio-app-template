---
name: crevio-sdk
description: Create data fetching services using the Crevio SDK. Use this skill when the user asks to fetch data from the Crevio API, create new integration services, or work with Crevio resources like products, orders, customers, or subscriptions.
---

This skill guides creation of data fetching services that leverage the Crevio SDK. Follow established patterns to create type-safe, consistent API integrations.

## Project Structure

```
src/
├── components/       # React components (UI + feature)
├── hooks/            # Custom React hooks
├── lib/
│   ├── crevio.ts     # Crevio SDK client (singleton)
│   └── utils.ts      # Utility functions
├── pages/            # Page components
├── App.tsx           # Root app component
└── main.tsx          # Client entry point
```

## SDK Configuration

The Crevio SDK client is configured as a singleton in `src/lib/crevio.ts`:

```typescript
import { Crevio } from "@crevio/sdk";

export const crevio = new Crevio({
	apiKey: process.env.CREVIO_API_KEY,
	...(process.env.CREVIO_API_BASE_URL && {
		serverURL: process.env.CREVIO_API_BASE_URL,
	}),
});
```

Environment variables:
- **API Key**: `process.env.CREVIO_API_KEY`
- **Server URL**: `process.env.CREVIO_API_BASE_URL`

## Service File Structure

Place data fetching logic in `src/lib/` files. Import the shared client from `src/lib/crevio.ts`:

1. **Import the shared client and types**:
   ```typescript
   import { crevio } from "@/lib/crevio";
   import type { ResourceType } from "@crevio/sdk/models";
   ```

2. **Export async functions** for each operation:
   - `getAll<Resource>()` - List all items
   - `get<Resource>(id: string)` - Get single item by ID

## Reference Implementation

```typescript
import { crevio } from "@/lib/crevio";
import type { Product } from "@crevio/sdk/models";

export async function getAllProducts(): Promise<Product[]> {
  const response = await crevio.products.list();
  return response.data ?? [];
}

export async function getProduct(id: string): Promise<Product> {
  return crevio.products.get({ id });
}
```

## Important: List responses

List endpoints return a paginated response object, not an array directly:

```typescript
// ✅ Correct — access .data from the list response
const response = await crevio.products.list();
return response.data ?? [];

// ❌ Wrong — list() returns { object, data, hasMore, url }, not an array
return await crevio.products.list();
```

## Available SDK methods

Check the SDK source for exact API, but common patterns:
- `crevio.<resource>.list()` - List all (returns `{ data, hasMore, url }`)
- `crevio.<resource>.get({ id })` - Get by ID
- `crevio.<resource>.create(data)` - Create new
- `crevio.<resource>.update({ id, ...data })` - Update
- `crevio.<resource>.delete({ id })` - Delete

## Type Safety

Always import types from `@crevio/sdk/models`:
- `Product`, `Account`, `Order`, `Customer`, `Subscription`, `PriceVariant`, etc.
- Use these types for function return values and parameters

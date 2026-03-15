---
name: crevio-sdk
description: Create data fetching services using the Crevio SDK. Use this skill when the user asks to fetch data from the Crevio API, create new integration services, or work with Crevio resources like products, orders, customers, or subscriptions.
---

This skill guides creation of data fetching services that leverage the Crevio SDK from the `lib/crevio-client.ts`. Follow established patterns to create type-safe, consistent API integrations.

## SDK Configuration

The Crevio SDK is configured with environment variables:
- **API Key**: `process.env.CREVIO_API_KEY`
- **Server URL**: `process.env.CREVIO_API_BASE_URL`

Always use this pattern for creating the client:

```typescript
import { Crevio } from "@crevio/sdk";

export const crevio = new Crevio({
	apiKey: process.env.CREVIO_API_KEY,
	...(process.env.CREVIO_API_BASE_URL && {
		serverURL: process.env.CREVIO_API_BASE_URL,
	}),
});
```

## Service File Structure

Place all integration services in `integrations/crevio/<resource>.ts`. Each service should:

1. **Import the SDK and types**:
   ```typescript
   import { Crevio } from "@crevio/sdk";
   import type { ResourceType } from "@crevio/sdk/models";
   ```

2. **Create a client factory function** (can be shared across services)

3. **Export async functions** for each operation:
   - `getAll<Resource>()` - List all items
   - `get<Resource>(id: string)` - Get single item by ID

## Reference Implementation

See `integrations/crevio/products.ts` for the canonical pattern:

```typescript
import { Crevio } from "@crevio/sdk";
import type { Product } from "@crevio/sdk/models";

function createCrevioClient(): Crevio {
  return new Crevio({
    apiKey: process.env.CREVIO_API_KEY,
    serverURL: process.env.CREVIO_API_BASE_URL,
  });
}

export async function getAllProducts(): Promise<Product[]> {
  const crevio = createCrevioClient();
  const response = await crevio.products.list();
  return response.data ?? [];
}

export async function getProduct(id: string): Promise<Product> {
  const crevio = createCrevioClient();
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

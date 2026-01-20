---
name: crevio-sdk
description: Create data fetching services using the Crevio SDK. Use this skill when the user asks to fetch data from the Crevio API, create new integration services, or work with Crevio resources like products, orders, customers, or subscriptions.
---

This skill guides creation of data fetching services that leverage the Crevio SDK from the `integrations/` folder. Follow established patterns to create type-safe, consistent API integrations.

## SDK Configuration

The Crevio SDK is configured with:
- **API Key**: `process.env.CREVIO_ACCOUNT_API_KEY`
- **Server URL**: `https://${window.location.host}/admin/api/v1`

Always use this pattern for creating the client:

```typescript
import { Crevio } from "@crevio/sdk";

function createCrevioClient(): Crevio {
  return new Crevio({
    apiKeyAuth: process.env.CREVIO_ACCOUNT_API_KEY,
    serverURL: `https://${window.location.host}/admin/api/v1`,
  });
}
```

## Service File Structure

Place all integration services in `integrations/<resource>/service.ts`. Each service should:

1. **Import the SDK and types**:
   ```typescript
   import { Crevio } from "@crevio/sdk";
   import type { ResourceType } from "@crevio/sdk/models";
   ```

2. **Create a client factory function** (can be shared across services)

3. **Export async functions** for each operation:
   - `getAll<Resource>()` - List all items
   - `get<Resource>(prefixId: string)` - Get single item by ID
   - `create<Resource>(data: CreateInput)` - Create new item
   - `update<Resource>(prefixId: string, data: UpdateInput)` - Update item
   - `delete<Resource>(prefixId: string)` - Delete item

## Reference Implementation

See `integrations/products/service.ts` for the canonical pattern:

```typescript
import { Crevio } from "@crevio/sdk";
import type { Product } from "@crevio/sdk/models";

function createCrevioClient(): Crevio {
  return new Crevio({
    apiKeyAuth: process.env.CREVIO_ACCOUNT_API_KEY,
    serverURL: `https://${window.location.host}/admin/api/v1`,
  });
}

export async function getAllProducts(): Promise<Product[]> {
  try {
    const crevio = createCrevioClient();
    const result = await crevio.products.list();
    return result || [];
  } catch (error) {
    console.error("Error fetching products:", error);
    throw new Error("Failed to load products");
  }
}

export async function getProduct(prefixId: string): Promise<Product> {
  try {
    const crevio = createCrevioClient();
    const result = await crevio.products.get({ prefixId: prefixId });
    return result;
  } catch (error) {
    console.error("Error fetching product:", error);
    throw new Error(`Failed to load product: ${prefixId}`);
  }
}
```

## Creating New Resource Services

When asked to create a new service for a Crevio resource:

1. **Create the service file**: `integrations/<resource>/service.ts`

2. **Follow the established patterns**:
   - Use try/catch with descriptive error messages
   - Return empty arrays for list operations when no results
   - Use `prefixId` parameter naming for resource identifiers
   - Add JSDoc comments describing each function

3. **Available SDK methods** (check SDK for exact API):
   - `crevio.<resource>.list()` - List all
   - `crevio.<resource>.get({ prefixId })` - Get by ID
   - `crevio.<resource>.create(data)` - Create new
   - `crevio.<resource>.update({ prefixId }, data)` - Update
   - `crevio.<resource>.delete({ prefixId })` - Delete

## Using Services in Next.js

Import and use services in your Next.js components or server actions:

```typescript
// In a Server Component
import { getAllProducts, getProduct } from "@/integrations/products/service";

export default async function ProductsPage() {
  const products = await getAllProducts();
  return <ProductList products={products} />;
}

// In a dynamic route
export default async function ProductPage({ params }: { params: { id: string } }) {
  const product = await getProduct(params.id);
  return <ProductDetail product={product} />;
}
```

## Error Handling

Always wrap SDK calls in try/catch:
- Log errors with `console.error` for debugging
- Throw user-friendly error messages
- Consider adding error boundaries in consuming components

## Type Safety

Always import types from `@crevio/sdk/models`:
- `Product`, `Order`, `Customer`, `Subscription`, etc.
- Use these types for function return values and parameters
- Let TypeScript infer types where possible

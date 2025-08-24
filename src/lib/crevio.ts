import { Crevio } from '@crevio/sdk'
import type { Product } from '@crevio/sdk/models'

/**
 * Create a configured Crevio SDK instance
 */
function createCrevioClient(): Crevio {
  return new Crevio({
    apiKeyAuth: process.env.CREVIO_ACCOUNT_API_KEY,
    serverURL: process.env.CREVIO_PROJECT_URL,
  })
}

/**
 * Fetch all products for the current account
 *
 * @returns Promise<Product[]> - Array of products
 */
export async function fetchProducts(): Promise<Product[]> {
  try {
    const crevio = createCrevioClient()
    const result = await crevio.products.list()
    return result || []
  } catch (error) {
    console.error('Error fetching products:', error)
    throw new Error('Failed to load products')
  }
}

/**
 * Fetch a specific product by its ID
 *
 * @param prefixId - The product's prefix ID (e.g., "prod_123")
 * @returns Promise<Product> - Single product
 */
export async function fetchProduct(prefixId: string): Promise<Product> {
  try {
    const crevio = createCrevioClient()
    const result = await crevio.products.get({ prefixId: prefixId })
    return result
  } catch (error) {
    console.error('Error fetching product:', error)
    throw new Error(`Failed to load product: ${prefixId}`)
  }
}

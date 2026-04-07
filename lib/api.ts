/**
 * API Service for SabanOS backend integration
 * Expected backend response format:
 * {
 *   reply: string,
 *   orderPlaced?: boolean,
 *   items?: Array<{ id, name, price, stock, imageUrl }>
 * }
 */

export interface BackendResponse {
  reply: string;
  orderPlaced?: boolean;
  items?: Array<{
    id: string;
    name: string;
    price: number;
    stock: number;
    imageUrl?: string;
  }>;
}

/**
 * Send message to backend AI service
 */
export async function sendMessageToAI(
  userMessage: string,
  language: 'he' | 'en'
): Promise<BackendResponse> {
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: userMessage,
        language: language,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.log('[v0] Error sending message to AI:', error);
    throw error;
  }
}

/**
 * Create order in backend
 */
export async function createOrder(
  items: Array<{ id: string; quantity: number }>,
  totalPrice: number,
  language: 'he' | 'en'
): Promise<{ orderId: string; success: boolean }> {
  try {
    const response = await fetch('/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        items,
        totalPrice,
        language,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.log('[v0] Error creating order:', error);
    throw error;
  }
}

/**
 * Get product recommendations based on user query
 */
export async function getProductRecommendations(
  query: string,
  language: 'he' | 'en'
): Promise<BackendResponse['items']> {
  try {
    const response = await fetch('/api/products/recommendations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        language,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.items || [];
  } catch (error) {
    console.log('[v0] Error fetching recommendations:', error);
    return [];
  }
}

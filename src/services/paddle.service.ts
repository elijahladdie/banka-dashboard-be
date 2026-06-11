import axios, { AxiosInstance } from 'axios';
import { ForbiddenError, ServerError, UnauthorizedError } from '../helpers';

interface PaddleProductQuery {
  id?: string[];
  after?: string;
  per_page?: number;
  include?: string[];
  order_by?: string;
  status?: string[];
  tax_category?: string[];
  type?: 'custom' | 'standard';
}

export class PaddleService {
  private readonly api: AxiosInstance;

  constructor() {
    const baseURL =
      process.env.PADDLE_ENV === 'sandbox'
        ? 'https://sandbox-api.paddle.com'
        : 'https://api.paddle.com';

    this.api = axios.create({
      baseURL,
      headers: {
        'Authorization': `Bearer ${process.env.PADDLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      timeout: 15000,
    });
  }

  /**
   * List products from Paddle.
   * GET /products
   * Requires `product.read` permission.
   */
  async listProducts(query: PaddleProductQuery = {}) {
    try {
      const params: Record<string, any> = {};

      if (query.id?.length) params.id = query.id.join(',');
      if (query.after) params.after = query.after;
      if (query.per_page) params.per_page = query.per_page;
      if (query.include?.length) params.include = query.include.join(',');
      if (query.order_by) params.order_by = query.order_by;
      if (query.status?.length) params.status = query.status.join(',');
      if (query.tax_category?.length) params.tax_category = query.tax_category.join(',');
      if (query.type) params.type = query.type;

      const { data } = await this.api.get('/products', { params });
      console.log('Paddle API /products response:', data);
      return data;
    } catch (error: any) {
      throw this.handlePaddleError(error, 'Failed to fetch products from Paddle');
    }
  }

  /**
   * List products with their associated prices in a single call.
   * GET /products?include=prices
   */
  async listProductsWithPrices(query: PaddleProductQuery = {}) {
    return this.listProducts({ ...query, include: ['prices'] });
  }

  /**
   * Normalize Paddle API errors into application-friendly errors.
   */
  private handlePaddleError(error: any, fallbackMessage: string): never {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const paddleError = error.response?.data;

      if (status === 401) {
        throw new UnauthorizedError('Paddle API authentication failed. Check your API key.');
      }
      if (status === 403) {
        throw new ForbiddenError('Paddle API permission denied. Check your API key permissions.');
      }
      if (status === 429) {
        throw new ServerError('Paddle API rate limit exceeded. Please try again later.');
      }

      const message =
        paddleError?.error?.detail ||
        paddleError?.error?.message ||
        paddleError?.message ||
        fallbackMessage;

      throw new ServerError(`Paddle API error: ${message}`);
    }

    throw new ServerError(fallbackMessage);
  }
}

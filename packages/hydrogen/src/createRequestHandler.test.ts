import {describe, it, expect, vi} from 'vitest';
import {createRequestHandler} from './createRequestHandler';
import {createRequestHandler as createReactRouterRequestHandler} from 'react-router';

// Mock react-router
vi.mock('react-router', () => ({
  createRequestHandler: vi.fn(),
  createContext: vi.fn(),
}));

describe('createRequestHandler', () => {
  it('should throw when storefront is missing and proxyStandardRoutes is true', async () => {
    // Mock createReactRouterRequestHandler to return a function
    const mockHandleRequest = vi.fn().mockResolvedValue(new Response('ok'));
    (createReactRouterRequestHandler as any).mockReturnValue(mockHandleRequest);

    const handler = createRequestHandler({
      build: {} as any,
      getLoadContext: () => ({}),
      proxyStandardRoutes: true,
    });

    const request = new Request('http://localhost:3000/');
    await expect(handler(request)).rejects.toThrow(
      '[h2:createRequestHandler] Storefront instance is required to proxy standard routes.',
    );
  });
});

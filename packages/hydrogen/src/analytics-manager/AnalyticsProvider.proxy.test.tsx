import {describe, it, expect, vi, afterEach, beforeEach} from 'vitest';
import {render, act} from '@testing-library/react';
import {Analytics} from './AnalyticsProvider';

// Mock dependencies
vi.mock('../utils/warning', () => ({
  warnOnce: vi.fn(),
  errorOnce: vi.fn(),
}));

import {errorOnce} from '../utils/warning';

// Mock react-router
vi.mock('react-router', async (importOriginal) => {
  const actual = (await importOriginal()) as typeof import('react-router');
  return {
    ...actual,
    useLocation: () => ({
      pathname: `/example/path`,
      search: '',
      state: '',
      key: '',
      hash: '',
    }),
    useRevalidator: () => ({
      revalidate: vi.fn(),
      state: 'idle',
    }),
  };
});

// Mock PerfKit
vi.mock('./PerfKit', () => ({
  PerfKit: () => null,
}));

// Mock server-timing
vi.mock('../utils/server-timing', () => ({
  isSfapiProxyEnabled: vi.fn(),
  hasServerReturnedTrackingValues: vi.fn(),
}));

import {isSfapiProxyEnabled} from '../utils/server-timing';

const SHOP_DATA = {
  shopId: 'gid://shopify/Shop/1',
  acceptedLanguage: 'EN',
  currency: 'USD',
  hydrogenSubchannelId: '0',
};

// Consent data WITHOUT checkoutDomain
const CONSENT_DATA_MISSING_DOMAIN = {
  storefrontAccessToken: '33ad0f277e864013b8e3c21d19432501',
};

describe('<Analytics.Provider /> Proxy Logic', () => {
  beforeEach(() => {
    vi.resetAllMocks();

    vi.stubGlobal(
      'fetch',
      function mockFetch(input: URL | RequestInfo): Promise<Response> {
        return Promise.resolve(new Response('{}', {status: 200}));
      },
    );
  });

  it('errors when checkoutDomain is missing and proxy is disabled', async () => {
    (isSfapiProxyEnabled as any).mockReturnValue(false);

    render(
      <Analytics.Provider cart={null} shop={SHOP_DATA as any} consent={CONSENT_DATA_MISSING_DOMAIN as any}>
        <div>child</div>
      </Analytics.Provider>,
    );

    await act(async () => {});

    expect(errorOnce).toHaveBeenCalledWith(
      expect.stringContaining('consent.checkoutDomain is required')
    );
  });

  it('does not error when checkoutDomain is missing but SFAPI proxy is enabled', async () => {
    (isSfapiProxyEnabled as any).mockReturnValue(true);

    render(
      <Analytics.Provider cart={null} shop={SHOP_DATA as any} consent={CONSENT_DATA_MISSING_DOMAIN as any}>
        <div>child</div>
      </Analytics.Provider>,
    );

    await act(async () => {});

    expect(errorOnce).not.toHaveBeenCalled();
  });

  it('does not error when checkoutDomain is missing but sameDomainForStorefrontApi is true', async () => {
    (isSfapiProxyEnabled as any).mockReturnValue(false);
    const consent = {...CONSENT_DATA_MISSING_DOMAIN, sameDomainForStorefrontApi: true};

    render(
      <Analytics.Provider cart={null} shop={SHOP_DATA as any} consent={consent as any}>
        <div>child</div>
      </Analytics.Provider>,
    );

    await act(async () => {});

    expect(errorOnce).not.toHaveBeenCalled();
  });
});

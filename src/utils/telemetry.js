import posthog from 'posthog-js';

const apiKey = import.meta.env.VITE_POSTHOG_KEY;
const apiHost = import.meta.env.VITE_POSTHOG_HOST || 'https://us.i.posthog.com';
const hasKey = Boolean(apiKey && apiKey.trim() && !apiKey.includes('your_posthog_project_api_key'));

let isInitAttempted = false;

/**
 * Initialize PostHog telemetry & error tracking
 * Reads VITE_POSTHOG_KEY and VITE_POSTHOG_HOST from environment variables.
 */
export function initTelemetry() {
  if (hasKey && !isInitAttempted) {
    isInitAttempted = true;

    // Check key prefix: PostHog client SDK requires 'phc_' (Project API key), not 'phs_' (Personal key)
    if (apiKey.trim().startsWith('phs_')) {
      console.warn(
        '[Telemetry Warning] You are using a PostHog Personal Secret Key (phs_...). ' +
        'Client-side event tracking requires your Project API Key starting with "phc_". ' +
        'Please copy the "Project API Key" from PostHog Settings.'
      );
    }

    try {
      posthog.init(apiKey.trim(), {
        api_host: apiHost.trim(),
        person_profiles: 'always',
        capture_pageview: true,
        capture_pageleave: true,
        autocapture: false, // Disabled to prevent capturing sensitive financial form inputs
        debug: import.meta.env.DEV, // Shows detailed PostHog telemetry logs in Browser Console during dev
        loaded: () => {
          console.log('[Telemetry] PostHog observability connected successfully.');
        },
      });

      // Global error listener for uncaught runtime exceptions
      window.addEventListener('error', (event) => {
        captureError(event.error || event.message, { source: 'window_onerror' });
      });

      window.addEventListener('unhandledrejection', (event) => {
        captureError(event.reason, { source: 'unhandled_promise_rejection' });
      });

    } catch (err) {
      console.error('[Telemetry] Failed to initialize PostHog:', err);
    }
  } else if (!hasKey) {
    console.info('[Telemetry] VITE_POSTHOG_KEY not configured. Telemetry running in local fallback mode.');
  }
}

/**
 * Identify signed-in user in PostHog (privacy-safe, uses user_id)
 */
export function identifyUser(userId, email = null) {
  if (!userId) return;
  if (hasKey) {
    posthog.identify(userId, email ? { email } : {});
  }
}

/**
 * Reset PostHog user context on sign-out
 */
export function resetUser() {
  if (hasKey) {
    posthog.reset();
  }
}

/**
 * Track product usage events safely (Never send sensitive rupee amounts or bank info!)
 */
export function trackEvent(eventName, properties = {}) {
  if (hasKey) {
    posthog.capture(eventName, {
      ...properties,
      timestamp: new Date().toISOString(),
    });
  } else {
    console.debug(`[Telemetry Track] ${eventName}`, properties);
  }
}

/**
 * Capture runtime errors safely
 */
export function captureError(error, context = {}) {
  const errorMessage = typeof error === 'string' ? error : error?.message || 'Unknown Error';
  const errorStack = error?.stack || null;

  if (hasKey) {
    posthog.capture('$exception', {
      $exception_message: errorMessage,
      $exception_stack_trace_raw: errorStack,
      ...context,
    });
  } else {
    console.error(`[Telemetry Error]`, errorMessage, context);
  }
}

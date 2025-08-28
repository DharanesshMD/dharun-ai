// app/providers.tsx
'use client';

import posthog from 'posthog-js';
import { PostHogProvider as PHProvider } from 'posthog-js/react';
import { useEffect } from 'react';

export function PostHogProvider({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
        if (!key) return; // Skip init when no key is provided
        posthog.init(key, {
            api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
            capture_pageview: false,
            autocapture: false, // Disable automatic pageview capture, as we capture manually
        });
    }, []);

    return <PHProvider client={posthog}>{children}</PHProvider>;
}

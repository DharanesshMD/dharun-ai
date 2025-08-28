import { PostHog } from 'posthog-node';
import { v4 as uuidv4 } from 'uuid';

// Initialize PostHog only when a key is provided. Otherwise, use a no-op client.
const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com';

const client: PostHog | null = POSTHOG_KEY
        ? new PostHog(POSTHOG_KEY, {
                    host: POSTHOG_HOST,
            })
        : null;

export enum EVENT_TYPES {
    WORKFLOW_SUMMARY = 'workflow_summary',
}

export type PostHogEvent = {
    event: EVENT_TYPES;
    userId: string;
    properties: Record<string, any>;
};

export const posthog = {
    capture: (event: PostHogEvent) => {
        if (!client) return; // No-op if PostHog is not configured
        client.capture({
            distinctId: event?.userId || uuidv4(),
            event: event.event,
            properties: event.properties,
        });
    },
    flush: () => {
        if (!client) return; // No-op if PostHog is not configured
        client.flush();
    },
};

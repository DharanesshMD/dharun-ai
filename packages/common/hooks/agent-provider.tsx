import { useWorkflowWorker } from '@repo/ai/worker';
import { ChatMode, ChatModeConfig } from '@repo/shared/config';
import { ThreadItem } from '@repo/shared/types';
import { buildCoreMessagesFromThreadItems, plausible } from '@repo/shared/utils';
import { nanoid } from 'nanoid';
import { useParams, useRouter } from 'next/navigation';
import React, { createContext, ReactNode, useCallback, useContext, useEffect, useMemo } from 'react';
import { useApiKeysStore, useAppStore, useChatStore, useMcpToolsStore } from '../store';

export type AgentContextType = {
    runAgent: (body: any) => Promise<void>;
    handleSubmit: (opts: {
        formData: FormData;
        newThreadId?: string;
        existingThreadItemId?: string;
        newChatMode?: string;
        messages?: ThreadItem[];
        showSuggestions?: boolean;
    }) => Promise<void>;
    updateContext: (threadId: string, data: any) => void;
};

const AgentContext = createContext<AgentContextType | undefined>(undefined);

export const AgentProvider = ({ children }: { children: ReactNode }) => {
    const { threadId: currentThreadId } = useParams();
    const isSignedIn = true; // Authentication removed
    const user = null; // Authentication removed

    const {
        updateThreadItem,
        setIsGenerating,
        setAbortController,
        createThreadItem,
        setCurrentThreadItem,
        setCurrentSources,
        updateThread,
        chatMode,
        fetchRemainingCredits,
        customInstructions,
    } = useChatStore(state => ({
        updateThreadItem: state.updateThreadItem,
        setIsGenerating: state.setIsGenerating,
        setAbortController: state.setAbortController,
        createThreadItem: state.createThreadItem,
        setCurrentThreadItem: state.setCurrentThreadItem,
        setCurrentSources: state.setCurrentSources,
        updateThread: state.updateThread,
        chatMode: state.chatMode,
        fetchRemainingCredits: state.fetchRemainingCredits,
        customInstructions: state.customInstructions,
    }));

    const router = useRouter();
    const getSelectedMCP = useMcpToolsStore(state => state.getSelectedMCP);
    const apiKeys = useApiKeysStore(state => state.getAllKeys);
    const hasApiKeyForChatMode = useApiKeysStore(state => state.hasApiKeyForChatMode);
    const setIsSettingsOpen = useAppStore(state => state.setIsSettingsOpen);

    useEffect(() => {
        fetchRemainingCredits();
    }, [fetchRemainingCredits]); // Removed user dependency

    const threadItemMap = useMemo(() => new Map<string, ThreadItem>(), []);

    const EVENT_TYPES = ['steps', 'sources', 'answer', 'error', 'status', 'suggestions', 'toolCalls', 'toolResults', 'object'];

    const handleThreadItemUpdate = useCallback(
        (threadId: string, threadItemId: string, eventType: string, eventData: any, parentThreadItemId?: string, shouldPersistToDB: boolean = true) => {
            const prevItem = threadItemMap.get(threadItemId) || ({} as ThreadItem);
            const updatedItem: ThreadItem = {
                ...prevItem,
                query: eventData?.query || prevItem.query || '',
                mode: eventData?.mode || prevItem.mode,
                threadId,
                parentId: parentThreadItemId || prevItem.parentId,
                id: threadItemId,
                object: eventData?.object || prevItem.object,
                createdAt: prevItem.createdAt || new Date(),
                updatedAt: new Date(),
                ...(eventType === 'answer'
                    ? { answer: { ...eventData.answer, text: (prevItem.answer?.text || '') + eventData.answer.text } }
                    : { [eventType]: eventData[eventType] }),
            };

            threadItemMap.set(threadItemId, updatedItem);
            updateThreadItem(threadId, { ...updatedItem, persistToDB: true });
        },
        [threadItemMap, updateThreadItem]
    );

    const { startWorkflow, abortWorkflow } = useWorkflowWorker(
        useCallback(
            (data: any) => {
                if (data?.threadId && data?.threadItemId && data.event && EVENT_TYPES.includes(data.event)) {
                    handleThreadItemUpdate(data.threadId, data.threadItemId, data.event, data, data.parentThreadItemId);
                }

                if (data?.type === 'done') {
                    setIsGenerating(false);
                    setTimeout(fetchRemainingCredits, 1000);
                    if (data?.threadItemId) threadItemMap.delete(data.threadItemId);
                }
            },
            [handleThreadItemUpdate, setIsGenerating, fetchRemainingCredits, threadItemMap]
        )
    );

    const runAgent = useCallback(
        async (body: any) => {
            const abortController = new AbortController();
            setAbortController(abortController);
            setIsGenerating(true);

            abortController.signal.addEventListener('abort', () => {
                setIsGenerating(false);
                updateThreadItem(body.threadId, { id: body.threadItemId, status: 'ABORTED', persistToDB: true });
            });

            try {
                const response = await fetch('/api/completion', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body),
                    credentials: 'include',
                    cache: 'no-store',
                    signal: abortController.signal,
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    setIsGenerating(false);
                    updateThreadItem(body.threadId, { id: body.threadItemId, status: 'ERROR', error: errorText, persistToDB: true });
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                if (!response.body) throw new Error('No response body received');

                const reader = response.body.getReader();
                const decoder = new TextDecoder();
                let buffer = '';

                while (true) {
                    const { value, done } = await reader.read();
                    if (done) break;
                    buffer += decoder.decode(value, { stream: true });
                    const messages = buffer.split('\n\n');
                    buffer = messages.pop() || '';

                    for (const message of messages) {
                        if (!message.trim()) continue;
                        const eventMatch = message.match(/^event: (.+)$/m);
                        const dataMatch = message.match(/^data: (.+)$/m);
                        if (eventMatch && dataMatch) {
                            const currentEvent = eventMatch[1];
                            try {
                                const data = JSON.parse(dataMatch[1]);
                                if (EVENT_TYPES.includes(currentEvent) && data?.threadId && data?.threadItemId) {
                                    handleThreadItemUpdate(data.threadId, data.threadItemId, currentEvent, data, data.parentThreadItemId, true);
                                } else if (currentEvent === 'done' && data.type === 'done') {
                                    setIsGenerating(false);
                                    if (data.threadItemId) threadItemMap.delete(data.threadItemId);
                                }
                            } catch (err) {
                                console.warn('JSON parse error for data:', dataMatch[1], err);
                            }
                        }
                    }
                }
            } catch (err: any) {
                setIsGenerating(false);
                console.error('Stream error', err);
                updateThreadItem(body.threadId, { id: body.threadItemId, status: 'ERROR', error: err?.message || String(err) });
            }
        },
        [setAbortController, setIsGenerating, updateThreadItem, handleThreadItemUpdate, threadItemMap]
    );

    const handleSubmit = useCallback(
        async ({ formData, newThreadId, existingThreadItemId, newChatMode, messages, showSuggestions }: { formData: FormData; newThreadId?: string; existingThreadItemId?: string; newChatMode?: string; messages?: ThreadItem[]; showSuggestions?: boolean; }) => {
            const mode = (newChatMode || chatMode) as ChatMode;
            if (!isSignedIn && !!ChatModeConfig[mode as keyof typeof ChatModeConfig]?.isAuthRequired) {
                // Open settings so the user can add API keys instead of redirecting to sign-in
                setIsSettingsOpen(true);
                return;
            }

            const threadId = currentThreadId?.toString() || newThreadId;
            if (!threadId) return;

            updateThread({ id: threadId, title: (formData.get('query') as string) || '' });

            const optimisticAiThreadItemId = existingThreadItemId || nanoid();
            const query = (formData.get('query') as string) || '';
            const imageAttachment = (formData.get('imageAttachment') as string) || '';

            const aiThreadItem: ThreadItem = { id: optimisticAiThreadItemId, createdAt: new Date(), updatedAt: new Date(), status: 'QUEUED', threadId, query, imageAttachment, mode };

            createThreadItem(aiThreadItem);
            setCurrentThreadItem(aiThreadItem);
            setIsGenerating(true);
            setCurrentSources([]);

            plausible.trackEvent('send_message', { props: { mode } });

            const coreMessages = buildCoreMessagesFromThreadItems({ messages: messages || [], query, imageAttachment });

            if (hasApiKeyForChatMode(mode)) {
                const abortController = new AbortController();
                setAbortController(abortController);
                setIsGenerating(true);

                abortController.signal.addEventListener('abort', () => {
                    setIsGenerating(false);
                    abortWorkflow();
                    updateThreadItem(threadId, { id: optimisticAiThreadItemId, status: 'ABORTED' });
                });

                startWorkflow({ mode, question: query, threadId, messages: coreMessages, mcpConfig: getSelectedMCP(), threadItemId: optimisticAiThreadItemId, parentThreadItemId: '', customInstructions, apiKeys: apiKeys() });
            } else {
                await runAgent({ mode: newChatMode || chatMode, prompt: query, threadId, messages: coreMessages, mcpConfig: getSelectedMCP(), threadItemId: optimisticAiThreadItemId, customInstructions, parentThreadItemId: '', showSuggestions: showSuggestions ?? true });
            }
        },
        [isSignedIn, currentThreadId, chatMode, setIsSettingsOpen, updateThread, createThreadItem, setCurrentThreadItem, setIsGenerating, setCurrentSources, abortWorkflow, startWorkflow, customInstructions, getSelectedMCP, apiKeys, hasApiKeyForChatMode, updateThreadItem, runAgent]
    );

    const updateContext = useCallback((threadId: string, data: any) => {
        updateThreadItem(threadId, { id: data.threadItemId, parentId: data.parentThreadItemId, threadId: data.threadId, metadata: data.context });
    }, [updateThreadItem]);

    const contextValue = useMemo(() => ({ runAgent, handleSubmit, updateContext }), [runAgent, handleSubmit, updateContext]);

    return <AgentContext.Provider value={contextValue}>{children}</AgentContext.Provider>;
};

export const useAgent = () => {
    const ctx = useContext(AgentContext);
    if (!ctx) throw new Error('useAgent must be used within AgentProvider');
    return ctx;
};

// Backwards-compatible alias used across the codebase. Previously some
// components imported `useAgentStream` from this file — provide a thin
// wrapper so those imports continue to work without changing call sites.
export function useAgentStream() {
    const { handleSubmit, runAgent, updateContext } = useAgent();
    return { handleSubmit, runAgent, updateContext };
}


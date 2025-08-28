'use client';
import { DotSpinner } from '@repo/common/components';
import { useApiKeysStore, useChatStore } from '@repo/common/store';
import { CHAT_MODE_CREDIT_COSTS, ChatMode, ChatModeConfig } from '@repo/shared/config';
import {
    Button,
    cn,
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
    Kbd,
} from '@repo/ui';
import {
    IconArrowUp,
    IconAtom,
    IconNorthStar,
    IconPaperclip,
    IconPlayerStopFilled,
} from '@tabler/icons-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { BYOKIcon, NewIcon } from '../icons';

export const chatOptions = [
    {
        label: 'Deep Research',
        description: 'In depth research on complex topic',
        value: ChatMode.Deep,
        icon: <IconAtom size={16} className="text-muted-foreground" strokeWidth={2} />,
        creditCost: CHAT_MODE_CREDIT_COSTS[ChatMode.Deep],
    },
    {
        label: 'Pro Search',
        description: 'Pro search with web search',
        value: ChatMode.Pro,
        icon: <IconNorthStar size={16} className="text-muted-foreground" strokeWidth={2} />,
        creditCost: CHAT_MODE_CREDIT_COSTS[ChatMode.Pro],
    },
];

export const modelOptions = [
    {
        label: 'Gemini Flash 2.0',
        value: ChatMode.GEMINI_2_FLASH,
        // webSearch: true,
        icon: undefined,
        creditCost: CHAT_MODE_CREDIT_COSTS[ChatMode.GEMINI_2_FLASH],
    },
];

export const AttachmentButton = () => {
    return (
        <Button
            size="icon"
            tooltip="Attachment (coming soon)"
            variant="ghost"
            className="gap-2"
            rounded="full"
            disabled
        >
            <IconPaperclip size={18} strokeWidth={2} className="text-muted-foreground" />
        </Button>
    );
};

export const ChatModeButton = () => {
    const setChatMode = useChatStore(state => state.setChatMode);
    return (
        <Button variant={'secondary'} size="xs" onClick={() => setChatMode(ChatMode.GEMINI_2_FLASH)}>
            Gemini Flash 2.0
        </Button>
    );
};

export const NewLineIndicator = () => {
    const editor = useChatStore(state => state.editor);
    const hasTextInput = !!editor?.getText();

    if (!hasTextInput) return null;

    return (
        <p className="flex flex-row items-center gap-1 text-xs text-gray-500">
            use <Kbd>Shift</Kbd> <Kbd>Enter</Kbd> for new line
        </p>
    );
};

export const GeneratingStatus = () => {
    return (
        <div className="text-muted-foreground flex flex-row items-center gap-1 px-2 text-xs">
            <DotSpinner /> Generating...
        </div>
    );
};

export const ChatModeOptions = ({
    chatMode,
    setChatMode,
    isRetry = false,
}: {
    chatMode: ChatMode;
    setChatMode: (chatMode: ChatMode) => void;
    isRetry?: boolean;
}) => {
    const isSignedIn = true; // Authentication removed
    const hasApiKeyForChatMode = useApiKeysStore(state => state.hasApiKeyForChatMode);
    const { push } = useRouter();
    return (
        <DropdownMenuContent
            align="start"
            side="bottom"
            className="no-scrollbar max-h-[300px] w-[300px] overflow-y-auto"
        >
            <DropdownMenuGroup>
                <DropdownMenuLabel>Models</DropdownMenuLabel>
                {modelOptions.map(option => (
                    <DropdownMenuItem
                        key={option.label}
                        onSelect={() => {
                            setChatMode(option.value);
                        }}
                        className="h-auto"
                    >
                        <div className="flex w-full flex-row items-center gap-2.5 px-1.5 py-1.5">
                            <div className="flex flex-col gap-0">
                                {<p className="text-sm font-medium">{option.label}</p>}
                            </div>
                            <div className="flex-1" />
                            {ChatModeConfig[option.value]?.isNew && <NewIcon />}

                            {hasApiKeyForChatMode(option.value) && <BYOKIcon />}
                        </div>
                    </DropdownMenuItem>
                ))}
            </DropdownMenuGroup>
        </DropdownMenuContent>
    );
};

export const SendStopButton = ({
    isGenerating,
    isChatPage,
    stopGeneration,
    hasTextInput,
    sendMessage,
}: {
    isGenerating: boolean;
    isChatPage: boolean;
    stopGeneration: () => void;
    hasTextInput: boolean;
    sendMessage: () => void;
}) => {
    return (
        <div className="flex flex-row items-center gap-2">
            <AnimatePresence mode="wait" initial={false}>
                {isGenerating && !isChatPage ? (
                    <motion.div
                        key="stop-button"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <Button
                            size="icon-sm"
                            variant="default"
                            onClick={stopGeneration}
                            tooltip="Stop Generation"
                        >
                            <IconPlayerStopFilled size={14} strokeWidth={2} />
                        </Button>
                    </motion.div>
                ) : (
                    <motion.div
                        key="send-button"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <Button
                            size="icon-sm"
                            tooltip="Send Message"
                            variant={hasTextInput ? 'default' : 'secondary'}
                            disabled={!hasTextInput || isGenerating}
                            onClick={() => {
                                sendMessage();
                            }}
                        >
                            <IconArrowUp size={16} strokeWidth={2} />
                        </Button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

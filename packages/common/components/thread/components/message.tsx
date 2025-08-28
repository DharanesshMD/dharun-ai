import { ChatEditor, markdownStyles } from '@repo/common/components';
import { useAgentStream, useChatEditor, useCopyText } from '@repo/common/hooks';
import { useChatStore } from '@repo/common/store';
import { ThreadItem } from '@repo/shared/types';
import { Button, cn } from '@repo/ui';
import { IconCheck, IconCopy, IconPencil } from '@tabler/icons-react';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { ImageMessage } from './image-message';
import { AgentThinking } from './agent-thinking';
type MessageProps = {
    message: string;
    imageAttachment?: string;
    threadItem: ThreadItem;
};

export const Message = memo(({ message, imageAttachment, threadItem }: MessageProps) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const messageRef = useRef<HTMLDivElement>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [showExpandButton, setShowExpandButton] = useState(false);
    // For assistant replies, hold back showing the final answer until thinking reaches target step
    const [showAssistantAnswer, setShowAssistantAnswer] = useState<boolean>(!threadItem.answer);
    const { copyToClipboard, status } = useCopyText();
    const maxHeight = 120;
    const isGenerating = useChatStore(state => state.isGenerating);
    useEffect(() => {
        if (messageRef.current) {
            setShowExpandButton(messageRef.current.scrollHeight > maxHeight);
        }
    }, [message]);

    const handleCopy = useCallback(() => {
        if (messageRef.current) {
            copyToClipboard(messageRef.current);
        }
    }, [copyToClipboard]);

    const toggleExpand = useCallback(() => setIsExpanded(prev => !prev), []);

    return (
    <div className="flex w-full flex-col items-end gap-2 pt-4">
            {imageAttachment && <ImageMessage imageAttachment={imageAttachment} />}

            {/* Collapsible Agent Thinking panel for assistant messages comes first */}
        {threadItem.answer && (
                <AgentThinking
                    stepsRecord={threadItem.steps}
                    defaultOpen={true}
                    mockedSteps={[
                        { id: '1', text: 'Understanding your query…', status: 'COMPLETED' },
                        { id: '2', text: 'Looking up relevant context…', status: 'COMPLETED' },
                        { id: '3', text: 'Planning the response…', status: 'COMPLETED' },
                        { id: '4', text: 'Drafting the answer…', status: 'COMPLETED' },
                    ]}
                    targetStepId="4"
            onReachedStepId={() => setTimeout(() => setShowAssistantAnswer(true), 4000)}
                    className="mt-1"
                />
            )}
            <div
                className={cn(
                    'text-foreground bg-tertiary group relative max-w-[80%] overflow-hidden rounded-lg',
                    isEditing && 'border-hard'
                )}
            >
                {!isEditing && (
                    <>
                        <div
                            ref={messageRef}
                            className={cn('prose-sm relative px-3 py-1.5 font-normal', {
                                'pb-12': isExpanded,
                                markdownStyles,
                            })}
                            style={{
                                maxHeight: isExpanded ? 'none' : maxHeight,
                                transition: 'max-height 0.3s ease-in-out',
                            }}
                        >
                            {threadItem.answer ? (showAssistantAnswer ? message : null) : message}
                        </div>
                        <div
                            className={cn(
                                'absolute bottom-0 left-0 right-0 hidden flex-col items-center  group-hover:flex',
                                showExpandButton && 'flex'
                            )}
                        >
                            <div className="via-tertiary/85 to-tertiary flex w-full items-center justify-end gap-1 bg-gradient-to-b from-transparent p-1.5">
                                {showExpandButton && (
                                    <Button
                                        variant="secondary"
                                        size="xs"
                                        rounded="full"
                                        className="pointer-events-auto relative z-10 px-4"
                                        onClick={toggleExpand}
                                    >
                                        {isExpanded ? 'Show less' : 'Show more'}
                                    </Button>
                                )}
                                <Button
                                    variant="bordered"
                                    size="icon-sm"
                                    onClick={handleCopy}
                                    tooltip={status === 'copied' ? 'Copied' : 'Copy'}
                                    disabled={threadItem.answer ? !showAssistantAnswer : false}
                                >
                                    {status === 'copied' ? (
                                        <IconCheck size={14} strokeWidth={2} />
                                    ) : (
                                        <IconCopy size={14} strokeWidth={2} />
                                    )}
                                </Button>
                                <Button
                                    disabled={
                                        isGenerating ||
                                        threadItem.status === 'QUEUED' ||
                                        threadItem.status === 'PENDING' ||
                                        (threadItem.answer ? !showAssistantAnswer : false)
                                    }
                                    variant="bordered"
                                    size="icon-sm"
                                    tooltip="Edit"
                                    onClick={() => setIsEditing(true)}
                                >
                                    <IconPencil size={14} strokeWidth={2} />
                                </Button>
                            </div>
                        </div>
                    </>
                )}

                {isEditing && (
                    <EditMessage
                        width={messageRef.current?.offsetWidth}
                        message={message}
                        threadItem={threadItem}
                        onCancel={() => {
                            setIsEditing(false);
                        }}
                    />
                )}
            </div>

        </div>
    );
});

export type TEditMessage = {
    message: string;
    onCancel: () => void;
    threadItem: ThreadItem;
    width?: number;
};

export const EditMessage = memo(({ message, onCancel, threadItem, width }: TEditMessage) => {
    const { handleSubmit } = useAgentStream();
    const removeFollowupThreadItems = useChatStore(state => state.removeFollowupThreadItems);
    const getThreadItems = useChatStore(state => state.getThreadItems);

    const { editor } = useChatEditor({
        defaultContent: message,
    });

    const handleSave = async (query: string) => {
        if (!query.trim()) {
            toast.error('Please enter a message');
            return;
        }
        removeFollowupThreadItems(threadItem.id);

        const formData = new FormData();
        formData.append('query', query);
        formData.append('imageAttachment', threadItem.imageAttachment || '');
        const threadItems = await getThreadItems(threadItem.threadId);

    handleSubmit({
            formData,
            existingThreadItemId: threadItem.id,
            messages: threadItems,
            newChatMode: threadItem.mode,
        });
    };

    return (
        <div className="relative flex max-w-full flex-col items-end gap-2">
            <div
                className={cn(' relative px-3 py-0 text-base font-normal', {})}
                style={{
                    minWidth: width,
                    transition: 'max-height 0.3s ease-in-out',
                }}
            >
                <ChatEditor
                    maxHeight="100px"
                    editor={editor}
                    sendMessage={() => {
                        handleSave(editor?.getText() || '');
                    }}
                    className={cn('prose-sm max-w-full overflow-y-scroll !p-0', markdownStyles)}
                />
            </div>
            <div className={cn('flex-col items-center  group-hover:flex')}>
                <div className=" flex w-full items-center justify-end gap-1 bg-gradient-to-b from-transparent p-1.5">
                    <Button
                        size="xs"
                        onClick={() => {
                            handleSave(editor?.getText() || '');
                        }}
                        tooltip={status === 'copied' ? 'Copied' : 'Copy'}
                    >
                        Save
                    </Button>
                    <Button variant="bordered" size="xs" tooltip="Edit" onClick={onCancel}>
                        Cancel
                    </Button>
                </div>
            </div>
        </div>
    );
});

Message.displayName = 'Message';

export enum ChatMode {
    Pro = 'pro',
    Deep = 'deep',
    O4_Mini = 'o4-mini',
    GPT_4_1 = 'gpt-4.1',
    GPT_4_1_Mini = 'gpt-4.1-mini',
    GPT_4_1_Nano = 'gpt-4.1-nano',
    GPT_4o_Mini = 'gpt-4o-mini',
    LLAMA_4_SCOUT = 'llama-4-scout',
    GEMINI_2_FLASH = 'gemini-flash-2.0',
    DEEPSEEK_R1 = 'deepseek-r1',
    CLAUDE_3_5_SONNET = 'claude-3-5-sonnet',
    CLAUDE_3_7_SONNET = 'claude-3-7-sonnet',
}

export const ChatModeConfig: Record<
    ChatMode,
    {
    webSearch: boolean;
        imageUpload: boolean;
        retry: boolean;
        isNew?: boolean;
        isAuthRequired?: boolean;
    }
> = {
    [ChatMode.Pro]: {
        webSearch: true,
        imageUpload: true,
        retry: true,
        isAuthRequired: false,
    },
    [ChatMode.Deep]: {
        webSearch: true,
        imageUpload: true,
        retry: true,
        isAuthRequired: false,
    },
    [ChatMode.O4_Mini]: {
        webSearch: false,
        imageUpload: true,
        retry: true,
        isAuthRequired: false,
    },
    [ChatMode.GPT_4_1]: {
        webSearch: false,
        imageUpload: true,
        retry: true,
        isAuthRequired: false,
    },
    [ChatMode.GPT_4_1_Mini]: {
        webSearch: false,
        imageUpload: true,
        retry: true,
        isAuthRequired: false,
    },
    [ChatMode.GPT_4_1_Nano]: {
        webSearch: false,
        imageUpload: true,
        retry: true,
        isAuthRequired: false,
    },
    [ChatMode.GPT_4o_Mini]: {
        webSearch: false,
        imageUpload: true,
        retry: true,
        isAuthRequired: false,
    },
    [ChatMode.LLAMA_4_SCOUT]: {
        webSearch: false,
        imageUpload: true,
        retry: true,
        isAuthRequired: false,
    },
    [ChatMode.GEMINI_2_FLASH]: {
        webSearch: false,
        imageUpload: true,
        retry: true,
        isAuthRequired: false,
    },
    [ChatMode.DEEPSEEK_R1]: {
        webSearch: false,
        imageUpload: true,
        retry: true,
        isAuthRequired: false,
    },
    [ChatMode.CLAUDE_3_5_SONNET]: {
        webSearch: false,
        imageUpload: true,
        retry: true,
        isAuthRequired: false,
    },
    [ChatMode.CLAUDE_3_7_SONNET]: {
        webSearch: false,
        imageUpload: true,
        retry: true,
        isAuthRequired: false,
    },
};

export const CHAT_MODE_CREDIT_COSTS = {
    [ChatMode.Deep]: 10,
    [ChatMode.Pro]: 5,
    [ChatMode.LLAMA_4_SCOUT]: 1,
    [ChatMode.GPT_4o_Mini]: 1,
    [ChatMode.GPT_4_1]: 5,
    [ChatMode.GPT_4_1_Mini]: 2,
    [ChatMode.GPT_4_1_Nano]: 1,
    [ChatMode.O4_Mini]: 5,
    [ChatMode.CLAUDE_3_5_SONNET]: 5,
    [ChatMode.CLAUDE_3_7_SONNET]: 5,
    [ChatMode.GEMINI_2_FLASH]: 1,
    [ChatMode.DEEPSEEK_R1]: 5,
};

export const getChatModeName = (mode: ChatMode) => {
    switch (mode) {
        case ChatMode.Deep:
            return 'Deep Research';
        case ChatMode.Pro:
            return 'Pro Search';
        case ChatMode.GPT_4_1:
            return 'GPT 4.1';
        case ChatMode.GPT_4_1_Mini:
            return 'GPT 4.1 Mini';
        case ChatMode.GPT_4_1_Nano:
            return 'GPT 4.1 Nano';
        case ChatMode.LLAMA_4_SCOUT:
            return 'Llama 4 Scout';
        case ChatMode.GPT_4o_Mini:
            return 'GPT 4o Mini';
        case ChatMode.CLAUDE_3_5_SONNET:
            return 'Claude 3.5 Sonnet';
        case ChatMode.CLAUDE_3_7_SONNET:
            return 'Claude 3.7 Sonnet';
        case ChatMode.O4_Mini:
            return 'O4 Mini';
        case ChatMode.DEEPSEEK_R1:
            return 'DeepSeek R1';
        case ChatMode.GEMINI_2_FLASH:
            return 'Gemini 2 Flash';
    }
};

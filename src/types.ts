export interface OllamaSettings {
    instanceUrl: string;
    model: string;
    systemPrompt: string;
    temperature: number;
    maxTokens: number;
    insertBelow: boolean;
    streamingSpeed: 'fast' | 'medium' | 'slow';
    showGeneratingText: boolean;
    generatingText: string;
    improvedTextPrefix: string;
    improveHotkey: string;
    replaceOriginal: boolean;
    enableStreaming: boolean;
}

export interface OllamaModel {
    name: string;
    modified_at: string;
    size: number;
}

export interface OllamaResponse {
    response: string;
    done: boolean;
}

// Add these helper types for better type safety
export interface HotkeyDefinition {
    modifiers: string[];
    key: string;
}

export interface StreamingDelays {
    min: number;
    max: number;
}

export interface StreamingSpeedConfig {
    fast: StreamingDelays;
    medium: StreamingDelays;
    slow: StreamingDelays;
}

export interface StreamingConfig {
    fast: { min: number; max: number };
    medium: { min: number; max: number };
    slow: { min: number; max: number };
} 
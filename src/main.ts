import { App, Plugin, MarkdownView, Notice, requestUrl, Menu, Editor, EditorPosition, Modifier } from 'obsidian';
import { OllamaSettings, OllamaModel, OllamaResponse, HotkeyDefinition } from './types';
import { OllamaSettingTab } from './settings';

const DEFAULT_SETTINGS: OllamaSettings = {
    instanceUrl: 'http://localhost:11434',
    model: 'llama3.2',
    systemPrompt: 'You are an expert writer helping to improve notes. Make the text more clear, concise and well-structured.',
    temperature: 0.7,
    maxTokens: 2000,
    insertBelow: true,
    streamingSpeed: 'medium',
    showGeneratingText: true,
    generatingText: 'Improving...',
    improvedTextPrefix: '✨ Improved version:\n',
    improveHotkey: 'Ctrl+Shift+B',
    replaceOriginal: false,
    enableStreaming: true
}

export default class OllamaPlugin extends Plugin {
    settings: OllamaSettings;

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }

    async onload() {
        await this.loadSettings();
        this.addSettingTab(new OllamaSettingTab(this.app, this));

        this.registerEvent(
            this.app.workspace.on('editor-menu', (menu: Menu, editor: Editor) => {
                if (editor.getSelection()) {
                    menu.addItem((item) => {
                        item
                            .setTitle('Improve with Ollama')
                            .setIcon('wand')
                            .onClick(async () => {
                                await this.improveSelectedText(editor);
                            });
                    });
                }
            })
        );

        const hotkey = this.parseHotkey();
        if (hotkey) {
            this.addCommand({
                id: 'improve-selected-note',
                name: 'Improve Selected Note',
                hotkeys: [hotkey],
                editorCallback: async (editor) => {
                    await this.improveSelectedText(editor);
                }
            });
        }
    }

    private parseHotkey(): { modifiers: Modifier[], key: string } | null {
        try {
            const parts = this.settings.improveHotkey.split('+');
            const key = parts.pop()?.toLowerCase().trim() || '';
            const modifierMap: Record<string, Modifier> = {
                'ctrl': 'Mod',
                'cmd': 'Mod',
                'command': 'Mod',
                'alt': 'Alt',
                'option': 'Alt',
                'shift': 'Shift',
                'meta': 'Meta'
            };

            const modifiers = parts
                .map(mod => modifierMap[mod.toLowerCase().trim()])
                .filter((mod): mod is Modifier => mod !== undefined);

            if (!key || modifiers.length === 0) return null;

            return {
                modifiers,
                key
            };
        } catch (e) {
            console.error('Failed to parse hotkey:', e);
            return null;
        }
    }

    async improveSelectedText(editor: Editor) {
        const selectedText = editor.getSelection();
        if (!selectedText) {
            new Notice('No text selected');
            return;
        }
        
        try {
            if (this.settings.showGeneratingText) {
                editor.replaceSelection(this.settings.generatingText);
            }

            const improvedText = await this.improveText(selectedText);

            if (this.settings.replaceOriginal) {
                // Simply replace the selection or generating text with improved text
                editor.replaceSelection(improvedText);
            } else {
                // Keep original and add improved version below
                editor.replaceSelection(selectedText); // Restore original text
                editor.setCursor(editor.getCursor().line + 1);
                editor.replaceRange(`\n\n${this.settings.improvedTextPrefix}${improvedText}`, editor.getCursor());
            }
        } catch (error) {
            // If error occurs, restore original text
            if (this.settings.showGeneratingText) {
                editor.replaceSelection(selectedText);
            }
            new Notice(`Error: ${error.message}`);
        }
    }

    private async streamText(editor: Editor, text: string, position: EditorPosition) {
        if (!this.settings.enableStreaming) {
            // If streaming is disabled, insert text immediately
            editor.replaceRange(text, position);
            return;
        }

        const delays = {
            fast: { min: 5, max: 15 },
            medium: { min: 10, max: 30 },
            slow: { min: 20, max: 50 }
        };
        
        const { min, max } = delays[this.settings.streamingSpeed];
        let currentPosition = { ...position };
        let currentIndex = 0;
        const chunkSize = 2;

        // Clear generating text if it exists
        if (this.settings.showGeneratingText) {
            editor.replaceRange('', 
                position,
                { line: position.line, ch: position.ch + this.settings.generatingText.length }
            );
        }

        while (currentIndex < text.length) {
            const chunk = text.slice(currentIndex, currentIndex + chunkSize);
            editor.replaceRange(chunk, currentPosition);
            currentPosition.ch += chunk.length;
            currentIndex += chunkSize;
            
            await new Promise(resolve => 
                setTimeout(resolve, Math.random() * (max - min) + min)
            );
        }
    }

    async streamImprovedText(text: string, onChunk: (text: string) => void): Promise<void> {
        try {
            const response = await requestUrl({
                url: `${this.settings.instanceUrl}/api/generate`,
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: this.settings.model,
                    prompt: text,
                    system: this.settings.systemPrompt,
                    stream: true,
                    options: {
                        temperature: this.settings.temperature,
                        num_predict: this.settings.maxTokens
                    }
                })
            });

            const lines = response.text.split('\n').filter(line => line.trim());
            
            for (const line of lines) {
                try {
                    const jsonResponse = JSON.parse(line) as OllamaResponse;
                    if (jsonResponse.response) {
                        onChunk(jsonResponse.response);
                    }
                } catch (e) {
                    console.error('Failed to parse line:', line);
                }
            }
        } catch (error) {
            console.error('Ollama API error:', error);
            throw new Error(`Failed to improve text: ${error.message}`);
        }
    }

    async getAvailableModels(): Promise<OllamaModel[]> {
        try {
            const response = await requestUrl({
                url: `${this.settings.instanceUrl}/api/tags`,
                method: 'GET'
            });
            
            return response.json.models;
        } catch (error) {
            throw new Error('Failed to fetch models');
        }
    }

    async improveText(text: string): Promise<string> {
        try {
            const response = await requestUrl({
                url: `${this.settings.instanceUrl}/api/generate`,
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: this.settings.model,
                    prompt: `Please improve this text:\n\n${text}`,
                    system: this.settings.systemPrompt,
                    options: {
                        temperature: this.settings.temperature,
                        num_predict: this.settings.maxTokens
                    }
                })
            });

            const lines = response.text.split('\n').filter(line => line.trim());
            let fullResponse = '';
            
            for (const line of lines) {
                try {
                    const jsonResponse = JSON.parse(line) as OllamaResponse;
                    if (jsonResponse.response) {
                        fullResponse += jsonResponse.response;
                    }
                } catch (e) {
                    console.error('Failed to parse line:', line);
                }
            }

            if (!fullResponse) {
                throw new Error('No response received from Ollama');
            }

            return fullResponse;
        } catch (error) {
            console.error('Ollama API error:', error);
            throw new Error(`Failed to improve text: ${error.message}`);
        }
    }
}
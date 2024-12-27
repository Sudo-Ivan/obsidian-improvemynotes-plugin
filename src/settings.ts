import { App, PluginSettingTab, Setting } from 'obsidian';
import type OllamaPlugin from './main';

export class OllamaSettingTab extends PluginSettingTab {
    plugin: OllamaPlugin;

    constructor(app: App, plugin: OllamaPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    async display() {
        const {containerEl} = this;
        containerEl.empty();

        containerEl.createEl('h2', {text: 'Ollama Settings'});

        new Setting(containerEl)
            .setName('Ollama Instance URL')
            .setDesc('URL of your Ollama instance')
            .addText(text => text
                .setPlaceholder('http://localhost:11434')
                .setValue(this.plugin.settings.instanceUrl)
                .onChange(async (value) => {
                    this.plugin.settings.instanceUrl = value;
                    await this.plugin.saveSettings();
                }));

        const models = await this.plugin.getAvailableModels();
        
        new Setting(containerEl)
            .setName('Model')
            .setDesc('Select Ollama model')
            .addDropdown(dropdown => {
                models.forEach(model => {
                    dropdown.addOption(model.name, model.name);
                });
                dropdown
                    .setValue(this.plugin.settings.model)
                    .onChange(async (value) => {
                        this.plugin.settings.model = value;
                        await this.plugin.saveSettings();
                    });
            });

        new Setting(containerEl)
            .setName('Insert Mode')
            .setDesc('Keep original text and insert improved version below')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.insertBelow)
                .onChange(async (value) => {
                    this.plugin.settings.insertBelow = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('System Prompt')
            .setDesc('Default system prompt for improvement')
            .addTextArea(text => text
                .setPlaceholder('Enter system prompt')
                .setValue(this.plugin.settings.systemPrompt)
                .onChange(async (value) => {
                    this.plugin.settings.systemPrompt = value;
                    await this.plugin.saveSettings();
                }));

        containerEl.createEl('h3', {text: 'Model Parameters'});

        new Setting(containerEl)
            .setName('Temperature')
            .setDesc('Model temperature (0-1). Higher values make output more creative but less focused.')
            .addSlider(slider => slider
                .setLimits(0, 1, 0.1)
                .setValue(this.plugin.settings.temperature)
                .onChange(async (value) => {
                    this.plugin.settings.temperature = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Max Tokens')
            .setDesc('Maximum tokens for response. Increase for longer texts.')
            .addText(text => text
                .setPlaceholder('2000')
                .setValue(String(this.plugin.settings.maxTokens))
                .onChange(async (value) => {
                    this.plugin.settings.maxTokens = Number(value);
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Enable Streaming Effect')
            .setDesc('Show text appearing gradually with a streaming effect')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.enableStreaming)
                .onChange(async (value) => {
                    this.plugin.settings.enableStreaming = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Streaming Speed')
            .setDesc('Control the speed of the streaming effect')
            .addDropdown(dropdown => dropdown
                .addOption('fast', 'Fast')
                .addOption('medium', 'Medium')
                .addOption('slow', 'Slow')
                .setValue(this.plugin.settings.streamingSpeed)
                .onChange(async (value) => {
                    this.plugin.settings.streamingSpeed = value as 'fast' | 'medium' | 'slow';
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Show Generating Text')
            .setDesc('Show "Improving..." while generating')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.showGeneratingText)
                .onChange(async (value) => {
                    this.plugin.settings.showGeneratingText = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Generating Text')
            .setDesc('Text to show while generating')
            .addText(text => text
                .setValue(this.plugin.settings.generatingText)
                .onChange(async (value) => {
                    this.plugin.settings.generatingText = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Improved Text Prefix')
            .setDesc('Text to prefix the improved version')
            .addText(text => text
                .setValue(this.plugin.settings.improvedTextPrefix)
                .onChange(async (value) => {
                    this.plugin.settings.improvedTextPrefix = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Replace Original Text')
            .setDesc('Replace the selected text instead of inserting improved version below')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.replaceOriginal)
                .onChange(async (value) => {
                    this.plugin.settings.replaceOriginal = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Improve Hotkey')
            .setDesc('Keyboard shortcut for improving text (e.g., Ctrl+Shift+B)')
            .addText(text => text
                .setValue(this.plugin.settings.improveHotkey)
                .onChange(async (value) => {
                    this.plugin.settings.improveHotkey = value;
                    await this.plugin.saveSettings();
                    // Reload plugin to update hotkey
                    this.plugin.unload();
                    this.plugin.load();
                }));
    }
} 
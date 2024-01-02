import { App, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';
import { normalize } from 'path';
const { spawn } = require("child_process");

interface LatexocrSettings {
    statusBarVisible: boolean;
}

const DEFAULT_SETTINGS: LatexocrSettings = {
    statusBarVisible: true
};

export default class Latexocr extends Plugin {
    settings: LatexocrSettings;
    isLatexocrRunning: boolean;
    statusBarTextElement: HTMLElement;

    async onload() {
        await this.loadSettings();

        // add status bar text
        this.statusBarTextElement = this.addStatusBarItem();
        this.statusBarTextElement.setText('latexocr not running');
        this.isLatexocrRunning = false;

        // Add command
        this.addCommand({
            id: 'run_latexocr',
            name: 'Run latexocr',
            callback: () => {
                this.run_latexocr();
            }
        });

        // Add button in left ribbon
        this.addRibbonIcon('braces', 'latexocr', () => {
            this.run_latexocr();
        });

        // This adds a settings tab so the user can configure various aspects of the plugin
        this.addSettingTab(new SettingsTab(this.app, this));

    }

    onunload() {

    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }

    async run_latexocr() {
        // Runs latexocr
        // Updates status bar text and sends notices for openening and closing
        const latexocr_process = spawn("latexocr");

        new Notice("latexocr running");
        this.isLatexocrRunning = true;
        this.setStatusBarText();

        latexocr_process.on("close", () => {
            new Notice(`latexocr closed`);
            this.isLatexocrRunning = false;
            this.setStatusBarText();
        });
    }

    async setStatusBarText() {

        // If we are showing status bar text, update it as appropriate
        let statusBarText = '';
        if (this.settings.statusBarVisible) {
            if (this.isLatexocrRunning) {
                statusBarText = 'latexocr running';
            }
            else {
                statusBarText = 'latexocr not running';
            }
            this.statusBarTextElement.setText(statusBarText);
        }
        else {
            this.statusBarTextElement.setText('');
        }

    }
}

class SettingsTab extends PluginSettingTab {
    plugin: Latexocr;

    constructor(app: App, plugin: Latexocr) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;

        containerEl.empty();

        new Setting(containerEl)
            .setName('Show status in status bar')
            .setDesc('Controls whether latexocr running status is shown in the Obsidian status bar')
            .addToggle((toggle) =>
                toggle
                    .setValue(this.plugin.settings.statusBarVisible)
                    .onChange(async (value) => {
                        this.plugin.settings.statusBarVisible = value;
                        this.plugin.setStatusBarText();
                        await this.plugin.saveSettings();
                    })
            );
    }
}

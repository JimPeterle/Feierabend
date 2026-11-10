const { Plugin, Notice, PluginSettingTab, Setting, TFile, moment } = require("obsidian");

const DEFAULTS = {
  todoPath: "Todo.md",
  archivePath: "Archive/Done.md",
  autoEnabled: false,
  autoTime: "17:00",
  lastAutoRun: "",
};

module.exports = class FeierabendPlugin extends Plugin {
  async onload() {
    const data = (await this.loadData()) || {};
    // Migrate old setting key from earlier version
    if (data.archivPath && !data.archivePath) {
      data.archivePath = data.archivPath;
      delete data.archivPath;
    }
    this.settings = Object.assign({}, DEFAULTS, data);

    this.addRibbonIcon("check", "Feierabend: Archive completed tasks", () => this.archive());
    this.addCommand({
      id: "archive-done",
      name: "Archive completed tasks",
      callback: () => this.archive(),
    });
    this.addSettingTab(new FeierabendSettings(this.app, this));

    // Auto mode: check every minute and once on startup (catch-up)
    this.app.workspace.onLayoutReady(() => this.checkAuto());
    this.registerInterval(window.setInterval(() => this.checkAuto(), 60 * 1000));
  }

  async checkAuto() {
    const s = this.settings;
    if (!s.autoEnabled || !/^\d{1,2}:\d{2}$/.test(s.autoTime)) return;

    const now = moment();
    const today = now.format("YYYY-MM-DD");
    const [h, m] = s.autoTime.split(":").map(Number);
    const due = moment().hours(h).minutes(m).seconds(0);

    if (s.lastAutoRun === today || now.isBefore(due)) return;

    s.lastAutoRun = today;
    await this.saveSettings();
    await this.archive();
  }

  async archive() {
    const { vault } = this.app;
    const file = vault.getAbstractFileByPath(this.settings.todoPath);
    if (!(file instanceof TFile)) {
      new Notice(`Todo file not found: ${this.settings.todoPath}`);
      return;
    }

    // Extract completed tasks (including indented sub-items)
    const done = [];
    const today = moment().format("YYYY-MM-DD");
    const stamp = (line) =>
      /^\s*- \[[xX]\]/.test(line) && !line.includes("feierabend-date")
        ? `${line} <span class="feierabend-date">✅ ${today}</span>`
        : line;

    await vault.process(file, (data) => {
      const lines = data.split("\n");
      const keep = [];
      for (let i = 0; i < lines.length; i++) {
        const m = lines[i].match(/^(\s*)- \[[xX]\]/);
        if (!m) {
          keep.push(lines[i]);
          continue;
        }
        const indent = m[1].length;
        done.push(stamp(lines[i]));
        while (
          i + 1 < lines.length &&
          lines[i + 1].trim() !== "" &&
          lines[i + 1].match(/^\s*/)[0].length > indent
        ) {
          done.push(stamp(lines[++i]));
        }
      }
      return keep.join("\n");
    });

    if (!done.length) {
      new Notice("No completed tasks to archive.");
      return;
    }

    // Write to archive (create folder/file if needed)
    const path = this.settings.archivePath;
    const block = `${done.join("\n")}\n`;
    const dir = path.includes("/") ? path.substring(0, path.lastIndexOf("/")) : "";
    if (dir && !vault.getAbstractFileByPath(dir)) await vault.createFolder(dir);

    const archive = vault.getAbstractFileByPath(path);
    if (archive instanceof TFile) {
      await vault.process(archive, (data) =>
        (data && !data.endsWith("\n") ? data + "\n" : data) + block
      );
    } else {
      await vault.create(path, block);
    }

    new Notice(`Archived ${done.length} line(s). Enjoy your Feierabend!`);
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
};

class FeierabendSettings extends PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display() {
    const { containerEl } = this;
    containerEl.empty();

    new Setting(containerEl)
      .setName("Todo file")
      .setDesc("Path inside the vault, e.g. Todo.md")
      .addText((t) =>
        t.setValue(this.plugin.settings.todoPath).onChange(async (v) => {
          this.plugin.settings.todoPath = v.trim();
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName("Archive file")
      .setDesc("Path inside the vault, e.g. Archive/Done.md")
      .addText((t) =>
        t.setValue(this.plugin.settings.archivePath).onChange(async (v) => {
          this.plugin.settings.archivePath = v.trim();
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName("Archive automatically")
      .setDesc("Runs daily at a fixed time. If Obsidian is closed at that time, it catches up on next start.")
      .addToggle((t) =>
        t.setValue(this.plugin.settings.autoEnabled).onChange(async (v) => {
          this.plugin.settings.autoEnabled = v;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName("Time")
      .setDesc("Format HH:MM, e.g. 17:00")
      .addText((t) =>
        t.setPlaceholder("17:00").setValue(this.plugin.settings.autoTime).onChange(async (v) => {
          this.plugin.settings.autoTime = v.trim();
          await this.plugin.saveSettings();
        })
      );
  }
}
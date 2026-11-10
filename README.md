# Feierabend

Clean up your todo list at the end of the day. Feierabend moves all completed tasks from your todo note into an archive note — with one click, or automatically at a fixed time. The next morning you only see what's still open.

## Features

- **One-click archiving** via ribbon button or command palette
- **Automatic archiving** daily at a configurable time (catches up on next start if Obsidian was closed)
- **Completion date** appended to each archived task (`✅ YYYY-MM-DD`), kept readable even when the task is struck through
- **Sub-items move with their parent**: indented lines below a completed task are archived along with it

## Example

**Todo.md** before:

```markdown
- [x] Back up switch config
    - check VLAN 20
- [ ] Update Proxmox
- [x] Reply to ticket #123
```

**Todo.md** after:

```markdown
- [ ] Update Proxmox
```

**Archive/Done.md**:

```markdown
- [x] Back up switch config <span class="feierabend-date">✅ 2026-11-10</span>
    - check VLAN 20
- [x] Reply to ticket #123 <span class="feierabend-date">✅ 2026-11-10</span>
```

## Usage

1. Set your **Todo file** and **Archive file** paths in the plugin settings.
2. Click the checkmark icon in the ribbon, or run **Feierabend: Archive completed tasks** from the command palette (you can assign a hotkey).
3. Optional: enable **Archive automatically** and set a **Time** (`HH:MM`).

## Settings

| Setting | Default | Description |
|---|---|---|
| Todo file | `Todo.md` | Note containing your tasks |
| Archive file | `Archive/Done.md` | Note completed tasks are moved to (created if missing) |
| Archive automatically | off | Run once per day at the set time |
| Time | `17:00` | Time for automatic archiving |

## Notes

- If you use Obsidian Sync on multiple devices, enable automatic archiving on **one device only** to avoid conflicting edits.
- Only tasks in the form `- [x]` are archived.

## Manual installation

Copy `main.js`, `manifest.json` and `styles.css` from the latest release into:

```
<vault>/.obsidian/plugins/feierabend/
```

Then reload Obsidian and enable the plugin under **Settings → Community plugins**.

## License

[MIT](LICENSE)
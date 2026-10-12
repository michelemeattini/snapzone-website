# SnapZone — Release notes

Notes shown by Sparkle in the update dialog. One `## <version>` section per release,
bullet lines starting with `- `. Keep it in sync with `ChangelogView.swift`.

## 1.6

- Trackpad gestures are reliable again: no more accidental snaps while scrolling or with a resting thumb, the direction is decided once, and swipes work in apps like Notion and other Electron apps.
- The zone preview now looks like macOS tiling: a white outline with rounded corners beneath the window you are moving, and the haptic tick fires only once you are inside a zone.
- Fixed: Google Chrome and some other apps could end up in the wrong place or snap in two steps.
- Workspaces: save where the windows of all your apps are and put them back in one click, from the menu bar, Settings or Shortcuts.
- 19 window actions (halves, thirds, quarters, center, next or previous display, restore) with keyboard shortcuts you can record, clear or reset to the defaults.
- Pressing ⌃⌥⌘← or → repeatedly cycles the window through ½, ⅔ and ⅓ of the screen.
- The new Restore action puts a snapped window back to its original size; dragging it away can do the same (off by default, in Settings).
- Custom layouts can now be edited after saving, and exported or imported as a file.
- Centered zones keep their aspect ratio on every screen, and layouts bound to a monitor tell apart two monitors of the same model.
- Shortcuts app, Siri and Spotlight support, plus snapzone:// links for Raycast, Alfred or a Stream Deck.
- New Excluded Apps list, and SnapZone now leaves dialogs, full-screen windows and fixed-size windows alone.
- The menu bar menu can snap the frontmost window and apply workspaces, and always offers Check for Updates.
- Notifications before the trial ends; Unlock Pro opens the License tab and Buy links go to the SnapZone store.
- A new app icon, the system accent color in the snap panel, Reduce Motion support and better VoiceOver labels.
- Warning when macOS window tiling is on, since dragging to the menu bar then competes with SnapZone's panel.
- Fixed: a trial that expired while SnapZone was running kept working until the next launch.
- Fixed: windows with a minimum size could end up partly off screen after a snap.

## 1.5

- Rewritten trackpad gesture engine: the target zone is previewed on screen with a haptic tick while you swipe, direction detection is more accurate, and slow drifts or three-finger system gestures are ignored.
- Each of the four corner gestures can now be enabled or disabled individually.
- New "Window Spacing" setting to leave a gap between snapped windows and the screen edges.
- Reorganised Settings: snapping options under General, a new License tab for licence, updates and beta, and every tab now fits the window.
- Fixed: top/bottom splits created in the custom layout editor were saved upside down.
- Fixed: keyboard shortcuts could silently stop working, and snapped to the wrong screen with multiple monitors.
- Fixed: the "update available" badge in the menu bar never appeared.
- Pausing SnapZone no longer changes your gesture and shortcut preferences; Accessibility permission granted after launch is picked up without restarting.
- License validation no longer revokes a valid licence on temporary server errors.
- SnapZone now follows your system language on first launch (English, Italian, Spanish).

## 1.4

- Integrated the Sparkle auto-updater for seamless background updates.
- Added Spanish language support across the app.
- Redesigned Settings: merged licence management into the General tab.

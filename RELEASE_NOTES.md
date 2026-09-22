# SnapZone — Release notes

Notes shown by Sparkle in the update dialog. One `## <version>` section per release,
bullet lines starting with `- `. Keep it in sync with `ChangelogView.swift`.

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

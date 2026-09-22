#!/usr/bin/env bash
# ============================================================
# SnapZone — Archive, sign with Developer ID, notarize, staple
# ============================================================
# Produces a zip that Gatekeeper accepts, then hands it to release.sh.
#
# PREREQUISITI (una volta sola, da fare a mano):
#   1. Certificato "Developer ID Application" nel Keychain.
#      Xcode › Settings › Accounts › Manage Certificates › + › Developer ID Application
#      (richiede l'iscrizione a pagamento all'Apple Developer Program)
#   2. Profilo notarytool salvato nel Keychain:
#      xcrun notarytool store-credentials SnapZone \
#        --apple-id <tuo-apple-id> --team-id X8L4HHHY74 \
#        --password <app-specific-password da appleid.apple.com>
#
# USO:
#   ./archive-and-notarize.sh <versione> <build>
#   ./archive-and-notarize.sh 1.5 6
#
# Al termine stampa il comando release.sh da lanciare.
# ============================================================

set -euo pipefail

VERSION="${1:-}"
BUILD="${2:-}"
TEAM_ID="X8L4HHHY74"
NOTARY_PROFILE="${NOTARY_PROFILE:-SnapZone}"
PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
WORK_DIR="${TMPDIR:-/tmp}/snapzone-release-$VERSION"
XCODE_APP="${XCODE_APP:-/Volumes/ssd/Applications/Xcode.app}"

if [ -z "$VERSION" ] || [ -z "$BUILD" ]; then
  echo "❌  Uso: $0 <versione> <build>    (es. $0 1.5 6)"
  exit 1
fi

# ── Controlli preliminari ────────────────────────────────────
if [ ! -d "$XCODE_APP" ]; then
  echo "❌  Xcode non trovato in $XCODE_APP (SSD esterno collegato?)."
  echo "    Override: XCODE_APP=/percorso/Xcode.app $0 ..."
  exit 1
fi

IDENTITY=$(security find-identity -v -p codesigning \
  | grep "Developer ID Application" | head -1 | sed -E 's/.*"(.*)"/\1/')
if [ -z "$IDENTITY" ]; then
  echo "❌  Nessun certificato 'Developer ID Application' nel Keychain."
  echo "    Xcode › Settings › Accounts › Manage Certificates › + › Developer ID Application"
  echo "    Senza questo certificato Gatekeeper rifiuta l'app sui Mac degli utenti."
  exit 1
fi
echo "🔑  Firma con: $IDENTITY"

if ! xcrun notarytool history --keychain-profile "$NOTARY_PROFILE" >/dev/null 2>&1; then
  echo "❌  Profilo notarytool '$NOTARY_PROFILE' assente. Crealo con:"
  echo "    xcrun notarytool store-credentials $NOTARY_PROFILE \\"
  echo "      --apple-id <apple-id> --team-id $TEAM_ID --password <app-specific-password>"
  exit 1
fi

# ── Verifica che le versioni coincidano col progetto ─────────
PBX="$PROJECT_DIR/SnapZone.xcodeproj/project.pbxproj"
PROJ_VERSION=$(grep -m1 "MARKETING_VERSION" "$PBX" | sed -E 's/.*= (.*);/\1/')
PROJ_BUILD=$(grep -m1 "CURRENT_PROJECT_VERSION" "$PBX" | sed -E 's/.*= (.*);/\1/')
if [ "$PROJ_VERSION" != "$VERSION" ] || [ "$PROJ_BUILD" != "$BUILD" ]; then
  echo "❌  Il progetto è alla versione $PROJ_VERSION ($PROJ_BUILD), non $VERSION ($BUILD)."
  echo "    Allinea MARKETING_VERSION / CURRENT_PROJECT_VERSION in project.pbxproj."
  exit 1
fi

rm -rf "$WORK_DIR"; mkdir -p "$WORK_DIR"
ARCHIVE="$WORK_DIR/SnapZone.xcarchive"
EXPORT_DIR="$WORK_DIR/export"
ZIP_PATH="$WORK_DIR/SnapZone-$VERSION.zip"

# ── 1. Archive ───────────────────────────────────────────────
echo "📦  Archive in corso..."
DEVELOPER_DIR="$XCODE_APP/Contents/Developer" xcodebuild \
  -project "$PROJECT_DIR/SnapZone.xcodeproj" \
  -scheme SnapZone -configuration Release \
  -derivedDataPath "$WORK_DIR/dd" \
  -archivePath "$ARCHIVE" \
  archive | tail -3

# ── 2. Export firmato Developer ID ───────────────────────────
cat > "$WORK_DIR/ExportOptions.plist" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>method</key><string>developer-id</string>
  <key>teamID</key><string>$TEAM_ID</string>
  <key>signingStyle</key><string>automatic</string>
</dict>
</plist>
PLIST

echo "✍️   Export con Developer ID..."
DEVELOPER_DIR="$XCODE_APP/Contents/Developer" xcodebuild \
  -exportArchive -archivePath "$ARCHIVE" \
  -exportOptionsPlist "$WORK_DIR/ExportOptions.plist" \
  -exportPath "$EXPORT_DIR" | tail -3

APP="$EXPORT_DIR/SnapZone.app"
[ -d "$APP" ] || { echo "❌  Export fallito: $APP non trovato."; exit 1; }

# ── 3. Zip per la notarizzazione (ditto preserva la firma) ───
echo "🗜   Creazione zip..."
/usr/bin/ditto -c -k --keepParent "$APP" "$ZIP_PATH"

# ── 4. Notarizzazione ────────────────────────────────────────
echo "☁️   Invio ad Apple per la notarizzazione (può richiedere alcuni minuti)..."
xcrun notarytool submit "$ZIP_PATH" \
  --keychain-profile "$NOTARY_PROFILE" --wait --timeout 30m

# ── 5. Staple + verifica ─────────────────────────────────────
echo "📎  Staple del ticket..."
xcrun stapler staple "$APP"
xcrun stapler validate "$APP"

echo "🔍  Verifica Gatekeeper..."
if spctl -a -vvv -t exec "$APP" 2>&1 | grep -q "accepted"; then
  echo "✅  Gatekeeper: accepted"
else
  echo "❌  Gatekeeper rifiuta ancora l'app:"
  spctl -a -vvv -t exec "$APP" 2>&1 | head -5
  exit 1
fi

# Rifà lo zip DOPO lo staple, altrimenti il ticket non viaggia con l'app
rm -f "$ZIP_PATH"
/usr/bin/ditto -c -k --keepParent "$APP" "$ZIP_PATH"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ✅  Build notarizzata pronta:"
echo "      $ZIP_PATH"
echo ""
echo "  Ora pubblica con:"
echo "      $(dirname "$0")/release.sh \"$ZIP_PATH\" $VERSION $BUILD"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

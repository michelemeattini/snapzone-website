#!/usr/bin/env bash
# ============================================================
# SnapZone — Release Helper
# ============================================================
# Firma il file (zip o dmg) con la chiave privata Sparkle salvata
# nel Keychain e aggiorna l'appcast.xml per il deploy su Vercel.
#
# UTILIZZO:
#   ./release.sh <percorso_file> <versione> <build_number> <url_download>
#
# ESEMPI:
#   # File su GitHub Releases (consigliato):
#   ./release.sh ~/Downloads/SnapZone.zip 1.4 5 \
#     "https://github.com/michelemeattini/snapzone-website/releases/download/v1.4/SnapZone.zip"
#
#   # File hostato su Vercel:
#   ./release.sh ~/Downloads/SnapZone.zip 1.4 5 ""
#   # (URL vuoto = usa https://snapzone-seven.vercel.app/releases/SnapZone-1.4.zip)
# ============================================================

set -e

FILE_PATH="$1"
VERSION="$2"
BUILD_NUMBER="$3"
DOWNLOAD_URL="$4"
RELEASE_DATE="${5:-$(date -R)}"

SPARKLE_BIN=~/Library/Developer/Xcode/DerivedData/SnapZone-fcooqtkxzbarbqbfdejdmtjbsvof/SourcePackages/artifacts/sparkle/Sparkle/bin
SIGN_UPDATE="$SPARKLE_BIN/sign_update"
APPCAST="$(dirname "$0")/appcast.xml"

# ── Validazioni ──────────────────────────────────────────────
if [ -z "$FILE_PATH" ] || [ -z "$VERSION" ] || [ -z "$BUILD_NUMBER" ]; then
  echo "❌  Uso: $0 <percorso_file> <versione> <build_number> [url_download] [data_rilascio]"
  echo "    Esempio: $0 ~/Downloads/SnapZone.zip 1.4 5 https://github.com/.../SnapZone.zip"
  exit 1
fi

if [ ! -f "$FILE_PATH" ]; then
  echo "❌  File non trovato: $FILE_PATH"
  exit 1
fi

if [ ! -f "$SIGN_UPDATE" ]; then
  echo "❌  sign_update non trovato in: $SIGN_UPDATE"
  echo "    Apri il progetto in Xcode almeno una volta per scaricare le dipendenze SPM."
  exit 1
fi

# ── Determina URL e tipo ─────────────────────────────────────
FILENAME=$(basename "$FILE_PATH")
EXT="${FILENAME##*.}"

if [ -z "$DOWNLOAD_URL" ]; then
  # Copia nella cartella releases/ del sito e usa URL Vercel
  RELEASES_DIR="$(dirname "$0")/releases"
  mkdir -p "$RELEASES_DIR"
  DEST_FILENAME="SnapZone-${VERSION}.${EXT}"
  cp "$FILE_PATH" "$RELEASES_DIR/$DEST_FILENAME"
  DOWNLOAD_URL="https://snapzone-seven.vercel.app/releases/$DEST_FILENAME"
  echo "✅  File copiato in releases/$DEST_FILENAME"
fi

if [ "$EXT" = "zip" ]; then
  CONTENT_TYPE="application/zip"
else
  CONTENT_TYPE="application/octet-stream"
fi

# ── Firma il file con Sparkle ─────────────────────────────────
echo "🔏  Firma del file in corso..."
chmod +x "$SIGN_UPDATE"
SIGN_OUTPUT=$("$SIGN_UPDATE" "$FILE_PATH" 2>&1)
SIGNATURE=$(echo "$SIGN_OUTPUT" | grep -o 'sparkle:edSignature="[^"]*"' | sed 's/sparkle:edSignature="//;s/"//')
FILE_SIZE=$(echo "$SIGN_OUTPUT" | grep -o 'length="[^"]*"' | sed 's/length="//;s/"//')

if [ -z "$SIGNATURE" ]; then
  echo "❌  Firma fallita. Output:"
  echo "$SIGN_OUTPUT"
  exit 1
fi

echo "✅  Firma: $SIGNATURE"
echo "📦  Dimensione: $FILE_SIZE bytes"

# ── Inserisce nuovo item in appcast.xml ──────────────────────
echo "📝  Aggiornamento appcast.xml..."

python3 - "$APPCAST" "$VERSION" "$BUILD_NUMBER" "$RELEASE_DATE" "$DOWNLOAD_URL" "$FILE_SIZE" "$CONTENT_TYPE" "$SIGNATURE" <<'PYEOF'
import sys, re

appcast_path, version, build, date, url, size, ctype, sig = sys.argv[1:]

with open(appcast_path, "r") as f:
    content = f.read()

new_item = f"""
    <!-- ==================== VERSION {version} ==================== -->
    <item>
      <title>SnapZone {version}</title>
      <pubDate>{date}</pubDate>
      <sparkle:version>{build}</sparkle:version>
      <sparkle:shortVersionString>{version}</sparkle:shortVersionString>
      <sparkle:minimumSystemVersion>14.0</sparkle:minimumSystemVersion>
      <enclosure
        url="{url}"
        length="{size}"
        type="{ctype}"
        sparkle:edSignature="{sig}"
      />
      <description><![CDATA[
        <h2>SnapZone {version}</h2>
        <ul>
          <li>See <a href="https://snapzone-seven.vercel.app">snapzone.app</a> for release notes.</li>
        </ul>
      ]]></description>
    </item>

"""

# Inserisce prima del primo <item> esistente
content = re.sub(r"(\s+<!-- =+)", new_item + r"\1", content, count=1)

with open(appcast_path, "w") as f:
    f.write(content)

print("✅  appcast.xml aggiornato con versione", version)
PYEOF

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ✅  Release v${VERSION} (build ${BUILD_NUMBER}) pronta!"
echo ""
echo "  Passi successivi:"
echo "  1. git add appcast.xml && git commit -m 'release: v${VERSION}' && git push"
echo "     → Vercel fa il deploy automatico"
echo "     → appcast.xml aggiornato su https://snapzone-seven.vercel.app/appcast.xml"
echo ""
echo "  2. Gli utenti riceveranno la notifica entro 24h"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

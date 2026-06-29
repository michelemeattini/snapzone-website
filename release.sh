#!/usr/bin/env bash
# ============================================================
# SnapZone — Release Helper
# ============================================================
# Firma il DMG con la chiave privata Sparkle salvata nel Keychain,
# aggiorna l'appcast.xml e prepara tutto per il push su Vercel.
#
# UTILIZZO:
#   ./release.sh <percorso_al_DMG> <versione> <data_rilascio>
#
# ESEMPIO:
#   ./release.sh ~/Desktop/SnapZone-1.3.dmg 1.3 "Mon, 30 Jun 2026 12:00:00 +0000"
# ============================================================

set -e

# ── Parametri ────────────────────────────────────────────────
DMG_PATH="$1"
VERSION="$2"
RELEASE_DATE="${3:-$(date -R)}"

SPARKLE_BIN=~/Library/Developer/Xcode/DerivedData/SnapZone-fcooqtkxzbarbqbfdejdmtjbsvof/SourcePackages/artifacts/sparkle/Sparkle/bin
SIGN_UPDATE="$SPARKLE_BIN/sign_update"
APPCAST="$(dirname "$0")/appcast.xml"
RELEASES_DIR="$(dirname "$0")/releases"

# ── Validazioni ──────────────────────────────────────────────
if [ -z "$DMG_PATH" ] || [ -z "$VERSION" ]; then
  echo "❌  Uso: $0 <percorso_dmg> <versione> [data_rilascio]"
  echo "    Esempio: $0 ~/Desktop/SnapZone-1.4.dmg 1.4"
  exit 1
fi

if [ ! -f "$DMG_PATH" ]; then
  echo "❌  File DMG non trovato: $DMG_PATH"
  exit 1
fi

if [ ! -f "$SIGN_UPDATE" ]; then
  echo "❌  sign_update non trovato in: $SIGN_UPDATE"
  echo "    Assicurati di aver compilato il progetto almeno una volta con Xcode."
  exit 1
fi

# ── Copia DMG nella cartella releases/ ──────────────────────
mkdir -p "$RELEASES_DIR"
DMG_FILENAME="SnapZone-${VERSION}.dmg"
cp "$DMG_PATH" "$RELEASES_DIR/$DMG_FILENAME"
echo "✅  DMG copiato in releases/$DMG_FILENAME"

# ── Firma il DMG con Sparkle ─────────────────────────────────
echo "🔏  Firma del DMG in corso..."
SIGNATURE=$("$SIGN_UPDATE" "$RELEASES_DIR/$DMG_FILENAME" 2>&1 | grep -o 'sparkle:edSignature="[^"]*"' | sed 's/sparkle:edSignature="//;s/"//')
DMG_SIZE=$(stat -f%z "$RELEASES_DIR/$DMG_FILENAME")
echo "✅  Firma generata: $SIGNATURE"
echo "📦  Dimensione DMG: $DMG_SIZE bytes"

# ── Aggiorna appcast.xml ─────────────────────────────────────
echo "📝  Aggiornamento appcast.xml..."

# Legge il changelog dall'ultima versione nel changelog Swift (testo semplice)
CHANGELOG_HTML="<ul><li>See <a href=\"https://snapzone-seven.vercel.app/#changelog\">Changelog</a> for details.</li></ul>"

python3 - <<PYEOF
import re

appcast_path = "$APPCAST"
with open(appcast_path, "r") as f:
    content = f.read()

new_item = """
    <!-- ==================== VERSION $VERSION ==================== -->
    <item>
      <title>SnapZone $VERSION</title>
      <pubDate>$RELEASE_DATE</pubDate>
      <sparkle:version>$VERSION</sparkle:version>
      <sparkle:shortVersionString>$VERSION</sparkle:shortVersionString>
      <sparkle:minimumSystemVersion>14.0</sparkle:minimumSystemVersion>
      <enclosure
        url="https://snapzone-seven.vercel.app/releases/$DMG_FILENAME"
        length="$DMG_SIZE"
        type="application/octet-stream"
        sparkle:edSignature="$SIGNATURE"
      />
      <description><![CDATA[$CHANGELOG_HTML]]></description>
    </item>

"""

# Inserisce il nuovo item subito dopo il tag <channel> + intestazione
content = content.replace(
    "    <!-- ==================== VERSION $VERSION ====================",
    ""  # Rimuove eventuale placeholder duplicato
)
# Inserisce prima del primo <item>
content = re.sub(r"(<item>)", new_item + r"\1", content, count=1)

with open(appcast_path, "w") as f:
    f.write(content)

print("✅  appcast.xml aggiornato")
PYEOF

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ✅  Release v$VERSION pronta!"
echo ""
echo "  Passi successivi:"
echo "  1. Fai commit e push della repo SnapZoneWeb"
echo "     → Vercel farà il deploy automatico"
echo "     → appcast.xml sarà su https://snapzone-seven.vercel.app/appcast.xml"
echo "     → Il DMG sarà su https://snapzone-seven.vercel.app/releases/$DMG_FILENAME"
echo ""
echo "  2. Gli utenti con la v precedente riceveranno la notifica di aggiornamento"
echo "     la prossima volta che aprono l'app (entro 24h automaticamente)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

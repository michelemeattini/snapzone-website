#!/usr/bin/env bash
# ============================================================
# SnapZone — Automated Release Deployer
# ============================================================
# 1. Crea e pubblica una release su GitHub caricando lo ZIP.
# 2. Firma lo ZIP locale con la chiave privata Sparkle nel Keychain.
# 3. Aggiorna l'appcast.xml.
# 4. Effettua il push su GitHub per attivare il deploy Vercel dell'appcast.
#
# UTILIZZO:
#   ./release.sh <percorso_zip_locale> <versione> <build_number>
#
# ESEMPIO:
#   ./release.sh ~/Desktop/SnapZone.zip 1.4 5
# ============================================================

set -e

ZIP_PATH="$1"
VERSION="$2"
BUILD_NUMBER="$3"
RELEASE_DATE=$(date -R)

SPARKLE_BIN=~/Library/Developer/Xcode/DerivedData/SnapZone-fcooqtkxzbarbqbfdejdmtjbsvof/SourcePackages/artifacts/sparkle/Sparkle/bin
SIGN_UPDATE="$SPARKLE_BIN/sign_update"
APPCAST="$(dirname "$0")/appcast.xml"
TAG="v${VERSION}"

# ── Validazioni ──────────────────────────────────────────────
if [ -z "$ZIP_PATH" ] || [ -z "$VERSION" ] || [ -z "$BUILD_NUMBER" ]; then
  echo "❌  Uso: $0 <percorso_zip> <versione> <build_number>"
  echo "    Esempio: $0 ~/Desktop/SnapZone.zip 1.4 5"
  exit 1
fi

if [ ! -f "$ZIP_PATH" ]; then
  echo "❌  File ZIP non trovato in: $ZIP_PATH"
  exit 1
fi

if [ ! -f "$SIGN_UPDATE" ]; then
  echo "❌  sign_update non trovato in: $SIGN_UPDATE"
  exit 1
fi

# Verifica autenticazione GitHub CLI
if ! gh auth status &>/dev/null; then
  echo "❌  GitHub CLI (gh) non autenticato. Esegui prima: gh auth login"
  exit 1
fi

echo "🚀 Inizio processo di rilascio SnapZone v$VERSION (Build $BUILD_NUMBER)..."

# ── 1. Crea Release su GitHub e Carica ZIP ───────────────────
echo "📦 Creazione release $TAG su GitHub..."
# Se la release esiste già, aggiungiamo solo l'asset, altrimenti la creiamo
if gh release view "$TAG" &>/dev/null; then
  echo "⚠️  La release $TAG esiste già su GitHub. Carico/sovrascrivo l'asset..."
  gh release upload "$TAG" "$ZIP_PATH" --clobber
else
  gh release create "$TAG" "$ZIP_PATH" \
    --title "Release v$VERSION" \
    --notes "SnapZone v$VERSION update."
  echo "✅ Release creata e pubblicato l'asset su GitHub."
fi

DOWNLOAD_URL="https://github.com/michelemeattini/snapzone-website/releases/download/$TAG/$(basename "$ZIP_PATH")"
echo "🔗 URL Download: $DOWNLOAD_URL"

# ── 2. Firma lo ZIP locale ───────────────────────────────────
echo "🔏 Firma del file in corso..."
chmod +x "$SIGN_UPDATE"
SIGN_OUTPUT=$("$SIGN_UPDATE" "$ZIP_PATH" 2>&1)
SIGNATURE=$(echo "$SIGN_OUTPUT" | grep -o 'sparkle:edSignature="[^"]*"' | sed 's/sparkle:edSignature="//;s/"//')
FILE_SIZE=$(echo "$SIGN_OUTPUT" | grep -o 'length="[^"]*"' | sed 's/length="//;s/"//')

if [ -z "$SIGNATURE" ]; then
  echo "❌  Firma fallita. Output:"
  echo "$SIGN_OUTPUT"
  exit 1
fi

echo "✅  Firma generata: $SIGNATURE"
echo "📦  Dimensione: $FILE_SIZE bytes"

# ── 3. Aggiorna appcast.xml ──────────────────────────────────
echo "📝 Aggiornamento appcast.xml..."

python3 - "$APPCAST" "$VERSION" "$BUILD_NUMBER" "$RELEASE_DATE" "$DOWNLOAD_URL" "$FILE_SIZE" "$SIGNATURE" <<'PYEOF'
import sys, re

appcast_path, version, build, date, url, size, sig = sys.argv[1:]

with open(appcast_path, "r") as f:
    content = f.read()

# Rimuove versioni duplicate se già presenti nel file per evitare ridondanze
content = re.sub(rf"\s+<!-- =+ VERSION {version} =+ -->[\s\S]*?</item>", "", content)

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
        type="application/zip"
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

# ── 4. Git Commit & Push automatico su Vercel ───────────────
echo "⚙️  Invio modifiche a GitHub (Deploy automatico su Vercel)..."
cd "$(dirname "$0")"
git add appcast.xml
# Facciamo commit solo se ci sono modifiche effettive
if ! git diff --cached --quiet; then
  git commit -m "release: update appcast.xml for v$VERSION"
  git push origin main
  echo "✅ Push completato con successo!"
else
  echo "ℹ️  Nessuna modifica rilevata in appcast.xml."
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  🎉  COMPLETATO! SnapZone v$VERSION è live!"
echo "  URL Appcast: https://snapzone-seven.vercel.app/appcast.xml"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

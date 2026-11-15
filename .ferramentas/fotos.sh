#!/bin/bash
# Gera as fotos do site a partir dos originais do ensaio (HEIC do iPhone).
#
#   Uso: bash .ferramentas/fotos.sh <pasta-com-os-HEIC>
#
# Saída (na raiz do repositório):
#   assets/fotos/<nome>-<largura>.webp e .jpg  (larguras 480, 800 e 1200; proporção 3:4)
#   assets/og-brunelli.jpg                      (1200x630, prévia ao compartilhar o link)
#   assets/icone-180.jpg                        (180x180, ícone da tela inicial)
#
# Os originais vêm em Display P3 e com EXIF (inclusive GPS). Tudo é convertido
# para sRGB e regravado sem metadados: nenhuma foto publicada carrega localização.
# Requer: sips (macOS), cwebp e ffmpeg.
set -euo pipefail

ORIGEM="${1:?informe a pasta com os HEIC}"
RAIZ="$(cd "$(dirname "$0")/.." && pwd)"
SAIDA="$RAIZ/assets/fotos"
SRGB="/System/Library/ColorSync/Profiles/sRGB Profile.icc"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

for cmd in sips cwebp ffmpeg; do
  command -v "$cmd" >/dev/null || { echo "falta o comando: $cmd"; exit 1; }
done

mkdir -p "$SAIDA"

# original:nome-publicado (ver spec, seção 8)
FOTOS=(
  "IMG_3965:brunelli-consulta-online"
  "IMG_3884:brunelli-nutricionista"
  "IMG_3849:brunelli-plano-alimentar"
  "IMG_3923:brunelli-atendimento-online"
  "IMG_3855:brunelli-podcast"
  "IMG_4049:brunelli-conversa"
)

# Converte HEIC para JPEG sRGB de trabalho (ainda com metadados; fica só no TMP).
base() {
  local entrada="$ORIGEM/$1.HEIC" saida="$TMP/$1.jpg"
  [ -f "$saida" ] || sips -s format jpeg -s formatOptions 95 -m "$SRGB" "$entrada" --out "$saida" >/dev/null
  echo "$saida"
}

# Regrava um JPEG sem nenhum metadado.
jpeg_limpo() { ffmpeg -loglevel error -y -i "$1" -map_metadata -1 -q:v 3 "$2"; }

for par in "${FOTOS[@]}"; do
  original="${par%%:*}"; nome="${par##*:}"
  fonte="$(base "$original")"
  for largura in 480 800 1200; do
    redim="$TMP/$nome-$largura.jpg"
    sips --resampleWidth "$largura" "$fonte" --out "$redim" >/dev/null
    jpeg_limpo "$redim" "$SAIDA/$nome-$largura.jpg"
    cwebp -quiet -q 78 -metadata none "$redim" -o "$SAIDA/$nome-$largura.webp"
  done
  echo "ok: $nome"
done

# Prévia de compartilhamento: faixa horizontal da IMG_3965 (rosto, mão e notebook).
ffmpeg -loglevel error -y -i "$(base IMG_3965)" -map_metadata -1 \
  -vf "crop=4284:2249:0:380,scale=1200:630" -q:v 3 "$RAIZ/assets/og-brunelli.jpg"
echo "ok: og-brunelli.jpg"

# Ícone: recorte quadrado do rosto na IMG_3884.
ffmpeg -loglevel error -y -i "$(base IMG_3884)" -map_metadata -1 \
  -vf "crop=1700:1700:1290:470,scale=180:180" -q:v 3 "$RAIZ/assets/icone-180.jpg"
echo "ok: icone-180.jpg"

#!/bin/bash
# Gera o favicon a partir do símbolo do logo (o "S" com folha de assets/logo-original.png).
#
#   Uso: bash .ferramentas/favicon.sh
#
# O símbolo é recortado, tem o traço engrossado (o original some abaixo de 48px)
# e vira creme sobre um quadrado arredondado no verde-azulado profundo do site.
# Saída: favicon.ico (16, 32 e 48) na raiz, assets/favicon-32.png e assets/favicon-192.png.
# Requer: ffmpeg.
set -euo pipefail

RAIZ="$(cd "$(dirname "$0")/.." && pwd)"
LOGO="$RAIZ/assets/logo-original.png"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

FUNDO_RGB="r=30:g=59:b=62"   # #1E3B3E (--profundo)
TRACO="0xF6F1EA"             # #F6F1EA (--creme)
ENGROSSAR="${ENGROSSAR:-7}"  # passadas de dilatação no tamanho 512 (cada uma soma 1px por lado)

# Máscara do símbolo: recorte 860x860 em volta do "S" (x 1215-1785, y 0-840 no original),
# alfa reduzido para 410px, engrossado e centralizado em 512x512.
# Alterna vizinhança quadrada e em cruz (coordinates=90): o traço cresce em octógono,
# com pontas arredondadas em vez de quadradas.
DILATAR=""
for i in $(seq 1 "$ENGROSSAR"); do
  if [ $((i % 2)) -eq 1 ]; then DILATAR+="dilation,"; else DILATAR+="dilation=coordinates=90,"; fi
done
ffmpeg -loglevel error -y -i "$LOGO" -filter_complex "
  [0:v]crop=860:860:1070:0,format=rgba,alphaextract,scale=410:410:flags=lanczos,${DILATAR}pad=512:512:51:51:color=black[mascara];
  color=c=${TRACO}:s=512x512,format=rgba[cor];
  [cor][mascara]alphamerge[simbolo];
  color=c=black:s=512x512,format=rgba,geq=${FUNDO_RGB}:a='if(lte(hypot(max(0,abs(X-255.5)-143.5),max(0,abs(Y-255.5)-143.5)),112),255,0)'[fundo];
  [fundo][simbolo]overlay=0:0:format=auto
" -frames:v 1 -map_metadata -1 "$TMP/favicon-512.png"

for t in 16 32 48 192; do
  ffmpeg -loglevel error -y -i "$TMP/favicon-512.png" -vf "scale=${t}:${t}:flags=lanczos" -map_metadata -1 "$TMP/favicon-$t.png"
done

cp "$TMP/favicon-32.png" "$RAIZ/assets/favicon-32.png"
cp "$TMP/favicon-192.png" "$RAIZ/assets/favicon-192.png"

# favicon.ico com três tamanhos (o navegador escolhe o melhor).
ffmpeg -loglevel error -y -i "$TMP/favicon-16.png" -i "$TMP/favicon-32.png" -i "$TMP/favicon-48.png" \
  -map 0 -map 1 -map 2 -c png "$RAIZ/favicon.ico"

cp "$TMP/favicon-512.png" "${PREVIA:-/dev/null}" 2>/dev/null || true
echo "ok: favicon.ico, assets/favicon-32.png, assets/favicon-192.png"

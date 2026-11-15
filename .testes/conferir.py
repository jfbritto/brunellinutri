"""Conferências estáticas do site. Rodar na raiz do repositório:

    python3 -I .testes/conferir.py

1. JSON-LD válido e FAQPage idêntico às perguntas visíveis.
2. Nenhum travessão ou meia-risca no texto visível.
3. Nenhuma imagem publicada com metadados EXIF ou XMP (localização do celular).
4. Peso até a primeira rolagem no celular abaixo de 300 KB (sem fontes).
"""
import html
import json
import re
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
LIMITE_PRIMEIRA_TELA = 300 * 1024
falhas = []


def falha(msg):
    falhas.append(msg)
    print("✖", msg)


def ok(msg):
    print("✔", msg)


pagina = (RAIZ / "index.html").read_text(encoding="utf-8")

# 1. JSON-LD e FAQ
blocos = re.findall(r'<script type="application/ld\+json">(.*?)</script>', pagina, re.S)
if len(blocos) != 1:
    falha(f"esperado 1 bloco JSON-LD, achei {len(blocos)}")
else:
    try:
        grafo = json.loads(blocos[0])["@graph"]
        faq = next(n for n in grafo if n["@type"] == "FAQPage")
        do_json = [(q["name"], q["acceptedAnswer"]["text"]) for q in faq["mainEntity"]]
        bloco_faq = re.search(r'<div class="faq[^"]*">(.*?)</div>', pagina, re.S)
        pares = re.findall(r"<summary>(.*?)</summary>\s*<p>(.*?)</p>", bloco_faq.group(1), re.S) if bloco_faq else []
        limpar = lambda s: html.unescape(re.sub(r"\s+", " ", s).strip())
        visiveis = [(limpar(p), limpar(r)) for p, r in pares]
        if do_json == visiveis and do_json:
            ok(f"JSON-LD válido; FAQPage igual às {len(do_json)} perguntas visíveis")
        else:
            falha("FAQPage diferente das perguntas visíveis")
            for a, b in zip(do_json, visiveis):
                if a != b:
                    print("   JSON-LD:", a, "\n   visível:", b)
    except (ValueError, KeyError, StopIteration, AttributeError) as e:
        falha(f"JSON-LD inválido: {e}")

# 2. Travessões no texto visível
corpo = pagina.split("<body>", 1)[1]
corpo = re.sub(r"<(script|style|svg)\b.*?</\1>", " ", corpo, flags=re.S)
texto = html.unescape(re.sub(r"<[^>]+>", " ", corpo))
achados = [c for c in ("—", "–") if c in texto]
if achados:
    falha(f"travessão ou meia-risca no texto visível: {achados}")
else:
    ok("nenhum travessão no texto visível")

# 3. Metadados nas imagens publicadas (EXIF pode trazer GPS e modelo do celular)
def tem_metadados(arq):
    dados = arq.read_bytes()
    ext = arq.suffix.lower()
    if ext in {".jpg", ".jpeg"}:
        cabeca = dados[:65536]
        return b"Exif\x00\x00" in cabeca or b"http://ns.adobe.com/xap" in cabeca
    if ext == ".webp":
        return b"EXIF" in dados[12:400] or b"XMP " in dados[12:400]
    if ext == ".png":
        return any(t in dados for t in (b"eXIf", b"XML:com.adobe.xmp"))
    return False

imagens = [a for a in sorted((RAIZ / "assets").rglob("*")) if a.suffix.lower() in {".jpg", ".jpeg", ".webp", ".png"}]
com_metadados = [a.name for a in imagens if tem_metadados(a)]
if com_metadados:
    falha(f"imagens com metadados: {com_metadados}")
else:
    ok(f"nenhuma imagem com metadados ({len(imagens)} conferidas)")

# 4. Peso até a primeira rolagem (celular de tela 2x: foto de 800px)
primeira_tela = ["index.html", "style.css", "logica.js", "app.js", "assets/logo.png",
                 "assets/fotos/brunelli-consulta-online-800.webp"]
total = sum((RAIZ / f).stat().st_size for f in primeira_tela)
if total <= LIMITE_PRIMEIRA_TELA:
    ok(f"primeira tela: {total / 1024:.0f} KB (limite {LIMITE_PRIMEIRA_TELA // 1024} KB, sem fontes)")
else:
    falha(f"primeira tela: {total / 1024:.0f} KB passa do limite de {LIMITE_PRIMEIRA_TELA // 1024} KB")

print(f"\n{'tudo certo' if not falhas else str(len(falhas)) + ' falha(s)'}")
sys.exit(1 if falhas else 0)

# Assembles the HTML template's handbook from the design core (core/) and this template's pages and scripts (src/).
# Output: templates/html/ui-handbook.html, one self-contained file.
import base64
import html
import json
import re
import sys
from pathlib import Path

SRC = Path(__file__).parent
CORE = SRC.parents[2] / "core"
sys.path.insert(0, str(CORE))
import build as core  # noqa: E402

CONTENT = {p.stem: json.loads(p.read_text(encoding="utf-8")) for p in sorted((CORE / "content").glob("*.json"))}

def shared_style(value):
    if isinstance(value, str):
        return value
    return ";".join(re.sub(r"[A-Z]", lambda m: "-" + m[0].lower(), k) + ":" + str(v) for k, v in value.items())

def read(name):
    text = (SRC / name).read_text(encoding="utf-8")
    def style(match):
        value = CONTENT
        for key in match[1].split("."):
            value = value[int(key)] if isinstance(value, list) else value[key]
        return shared_style(value)
    def content(match):
        value = CONTENT
        for key in match[1].split("."):
            value = value[int(key)] if isinstance(value, list) else value[key]
        return html.escape(str(value), quote=True)
    text = re.sub(r"\{\{style:([\w.-]+)\}\}", style, text)
    return re.sub(r"\{\{content:([\w.-]+)\}\}", content, text)
# Core modules end with an ES export line; an inlined classic script drops it.
core_js = lambda rel: re.sub(r"^export \{.*\};\s*$", "", (CORE / rel).read_text(encoding="utf-8"), flags=re.M)
core_css = lambda name: (CORE / "styles" / name).read_text(encoding="utf-8")

themes = core.themes()
theme_css = core.theme_css(themes)
theme_data = json.dumps(themes, ensure_ascii=False)
i18n_data = json.dumps(core.dictionary(themes), ensure_ascii=False)
ASSETS = CORE / "content" / "assets"
data_uri = lambda p: "url(data:image/webp;base64,%s)" % base64.b64encode(p.read_bytes()).decode()
web = core.gallery()
image_css = ":root{%s}" % "".join(
    ["--sf-%s:%s;" % (p.stem, data_uri(p)) for p in sorted((ASSETS / "sf").glob("*.webp"))]
    + ["--w%d:%s;" % (i, data_uri(ASSETS / "gallery" / m["f"])) for i, m in enumerate(web)])
web_data = json.dumps([{k: m[k] for k in ("t", "c", "r")} for m in web], ensure_ascii=False)

page = f"""<!doctype html>
<html lang="zh" data-scheme="neon">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>UI/UX Handbook</title>
<link rel="icon" href="data:,">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
<style>
{theme_css}
{image_css}
{core_css("base.css")}
{core_css("scenes.css")}
{core_css("more.css")}
{core_css("sf.css")}
{core_css("data.css")}
</style>
</head>
<body>
<script>if(new URLSearchParams(location.hash.slice(1)).get("embed"))document.body.classList.add("embed")</script>
<div class="bar"><div class="bar-in" id="barIn" role="group" aria-label="配色方案" data-scope="bar" data-dim="none" data-cmp data-nofocus><div class="seg" id="barT"></div></div></div>
<nav class="rail" id="rail" aria-label="目录" data-scope="chrome" data-dim="none" data-cmp data-nofocus></nav>
<div class="pnav" id="pnav"><div class="pnav-list" id="pnavL"></div><button class="pnav-b" id="pnavB"><i></i><span id="pnavT">目录</span></button></div>
<main id="page">
{read("01-found.html")}
{read("02-work.html")}
{read("03a-agents.html")}
{read("04-more.html")}
{read("03-apps.html")}
</main>
<div class="scrim" id="scrim"><div id="scrimIn"></div></div>
<div class="toast-host" id="toasts"></div>
<div class="device" id="device"><nav class="device-nav" id="devNav" aria-label="目录"></nav><div class="device-shell" id="devShell"><iframe id="devFrame" title="Phone view"></iframe></div></div>
<script>
const CONTENT={json.dumps(CONTENT, ensure_ascii=False)};
const THEMES={theme_data};
const I18N={i18n_data};
const WEB={web_data};
{core_js("i18n/i18n.js")}
useDictionary(I18N);
{core_js("behavior/ux.js")}
{read("app1.js")}
{read("sf.js")}
{read("app2.js")}
{read("app3.js")}
{read("data.js")}
{read("app4.js")}
</script>
</body>
</html>
"""
(SRC.parent / "ui-handbook.html").write_text(page, encoding="utf-8")
print(len(page))

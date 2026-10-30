# Assembles src/ into the single-page handbook at the repository root.
import json
from pathlib import Path

SRC = Path(__file__).parent
read = lambda name: (SRC / name).read_text(encoding="utf-8")

themes = json.loads(read("themes.json"))
i18n = json.loads(read("i18n.json"))
for t in themes["themes"]:
    for field in ("name", "note"):
        i18n["text"][t[field]["zh"]] = t[field]["en"]
theme_css = "\n".join("[data-scheme=%s]{color-scheme:%s;%s}" % (t["id"], t["mode"], ";".join("--%s:%s" % kv for kv in t["tokens"].items())) for t in themes["themes"])
theme_data = json.dumps(themes, ensure_ascii=False)
i18n_data = json.dumps(i18n, ensure_ascii=False)

page = f"""<!doctype html>
<html lang="zh" data-scheme="neon">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>UI/UX Handbook</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
<style>
{theme_css}
{read("base.css")}
{read("scenes.css")}
{read("more.css")}
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
const THEMES={theme_data};
const I18N={i18n_data};
{read("i18n.js")}
{read("ux.js")}
{read("app1.js")}
{read("app2.js")}
{read("app3.js")}
{read("app4.js")}
</script>
</body>
</html>
"""
(SRC.parent / "ui-handbook.html").write_text(page, encoding="utf-8")
print(len(page))

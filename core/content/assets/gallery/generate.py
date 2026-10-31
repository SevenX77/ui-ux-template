# Generates every image in prompts.json that is missing from the folder named by the first argument.
import json, re, shutil, subprocess, sys, time
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor

OUT = Path(sys.argv[1]).resolve()
OUT.mkdir(exist_ok=True)
M = json.loads((Path(__file__).parent / "prompts.json").read_text(encoding="utf-8"))
CODEX = shutil.which("codex")
SHAPE = {"portrait": "Tall portrait composition.", "landscape": "Wide landscape composition.", "square": "Square composition."}


def slug(job):
    return re.sub(r"[^a-z0-9]+", "-", job["title"].lower()).strip("-")


def run(job):
    target = OUT / (slug(job) + ".png")
    if target.exists():
        return job["title"], "kept", 0
    lines = [
        "Purpose: produce one image file for a UI sample.",
        "Use the built-in image_gen tool (imagegen skill, default built-in mode). Do not use the CLI fallback and do not ask for an API key. Do not ask questions.",
        "",
        job["prompt"],
        SHAPE[job["shape"]],
        M["style"],
        "",
        f"Copy the final image to {target.as_posix()}. Create nothing else.",
        "Report only the saved path.",
    ]
    args = [CODEX, "exec", "--skip-git-repo-check", "-m", M["model"], "-c", "model_reasoning_effort=low", "-C", str(OUT), "-"]
    t = time.time()
    for attempt in range(2):
        p = subprocess.run(args, input="\n".join(lines), text=True, encoding="utf-8", errors="replace", capture_output=True, timeout=420)
        if target.exists():
            return job["title"], "ok", round(time.time() - t)
    return job["title"], f"FAILED rc={p.returncode} {p.stderr[-200:]}", round(time.time() - t)


with ThreadPoolExecutor(4) as ex:
    for r in ex.map(run, M["images"][:int(sys.argv[2]) if len(sys.argv) > 2 else None]):
        print(r, flush=True)
print("done", len(list(OUT.glob("*.png"))))

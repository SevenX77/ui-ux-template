import json, subprocess, sys, shutil, time
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor

# Generates every image in prompts.json that is missing from the folder named by the first argument.
OUT = Path(sys.argv[1]).resolve()
OUT.mkdir(exist_ok=True)
M = json.loads((Path(__file__).parent / "prompts.json").read_text(encoding="utf-8"))
CODEX = shutil.which("codex")
REF = OUT / (Path(M["reference"]).stem + ".png")


def run(job):
    target = OUT / (Path(job["name"]).stem + ".png")
    if target.exists():
        return job["name"], "kept", 0
    style = {"board": M["boardStyle"], "panel": M["panelStyle"], "portrait": M["portraitStyle"]}.get(job["kind"], M["style"])
    lines = [
        "Purpose: produce one image file for a UI sample.",
        "Use the built-in image_gen tool (imagegen skill, default built-in mode). Do not use the CLI fallback and do not ask for an API key. Do not ask questions.",
        "",
        job["prompt"],
        style,
    ]
    args = [CODEX, "exec", "--skip-git-repo-check", "-m", M["model"], "-c", "model_reasoning_effort=low", "-C", str(OUT)]
    if job.get("refs"):
        lines.append(M["referenceRole"])
        args.append(f"--image={REF}")
    lines += ["", f"Copy the final image to {target.as_posix()}. Create nothing else.", "Report only the saved path."]
    args.append("-")
    t = time.time()
    for attempt in range(2):
        p = subprocess.run(args, input="\n".join(lines), text=True, encoding="utf-8", errors="replace", capture_output=True, timeout=420)
        (OUT / (target.stem + ".log")).write_text(p.stdout[-1500:] + "\n" + p.stderr[-1500:], encoding="utf-8")
        if target.exists():
            return job["name"], "ok", round(time.time() - t)
    return job["name"], f"FAILED rc={p.returncode}", round(time.time() - t)


jobs = M["images"]
first = [j for j in jobs if j["name"] == M["reference"]]
rest = [j for j in jobs if j["name"] != M["reference"]]
print(run(first[0]), flush=True)
if not REF.exists():
    sys.exit("no reference")
with ThreadPoolExecutor(4) as ex:
    for r in ex.map(run, rest):
        print(r, flush=True)
print("done", len(list(OUT.glob("*.png"))))

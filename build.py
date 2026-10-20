"""Build index.html from src/.

  src/head.html   <head> up to the opening <style>
  src/styles.css  all CSS
  src/body.html   </style> ... page markup ... opening <script>
  src/js/*.js     game code, concatenated in file-name order (one shared closure)
  src/tail.html   closing </script> ...

Usage: python3 build.py [out.html]   (default: index.html next to this file)
"""
import pathlib, sys
ROOT = pathlib.Path(__file__).parent
S = ROOT / "src"
parts = [(S / "head.html").read_text(), (S / "styles.css").read_text(), (S / "body.html").read_text()]
parts += [p.read_text() for p in sorted((S / "js").glob("*.js"))]
parts.append((S / "tail.html").read_text())
# v5.7.4: VERSION-NOTES.txt (one line per version: "5.7.4   Short note") is embedded for the title screen's version
# notes pop-up (51g-version-notes.js). Add a line there with every release.
import json, re
notes = [list(m.groups()) for m in (re.match(r"^(\d+\.\d+\.\d+\S*)\s+(.+?)\s*$", l) for l in (ROOT / "VERSION-NOTES.txt").read_text().splitlines()) if m]
parts = [p.replace("/*@VERSION_NOTES@*/[]", json.dumps(notes, ensure_ascii=False)) for p in parts]
ver = re.search(r'APP_VER="v?([^"]+)"', (S / "js" / "00-diagnostics-log.js").read_text())
if ver and not any(n[0] == ver.group(1) for n in notes):
    print(f"WARNING: VERSION-NOTES.txt has no line for {ver.group(1)} (APP_VER); add one so the version notes pop-up is current")
out = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "index.html"
out.write_text("".join(parts))
print(f"built {out} ({out.stat().st_size:,} bytes)")
# v4.4.0-t3: syntax check of the game script when Node.js is available (a stray "//" comment mid-line can swallow code
# and break the whole page; this catches it at build time). Warns only: the built file is still written.
import shutil, subprocess, tempfile
if shutil.which("node"):
    h = out.read_text(); i = h.rindex("<script"); js = h[h.index(">", i) + 1:h.rindex("</script>")]
    with tempfile.NamedTemporaryFile("w", suffix=".mjs", delete=False) as f: f.write(js)
    r = subprocess.run(["node", "--check", f.name], capture_output=True, text=True); pathlib.Path(f.name).unlink()
    print("syntax check: ok" if r.returncode == 0 else "SYNTAX ERROR in the game script:\n" + (r.stderr or r.stdout)[:600])
# v6.9.2: code glued onto the end of a "//" comment is still valid JS, so the syntax check can't see it (four such bugs
# shipped: S.q.made, G3.closeKnobUI, the bird cut-scene's sheet check, the outage notice). Warn on a comment that runs
# straight into an assignment, call or declaration.
_glued = re.compile(r"//[^\n]*?(?:[a-z\)](?:S|G3|C|P|W|K)\.[A-Za-z_][\w.]*\s*(?:\+?=[^=]|\()|[\);](?:const|let|if|for)\s*[\(\w])")
for f in sorted((S / "js").glob("*.js")):
    for n, l in enumerate(f.read_text().split("\n"), 1):
        m = _glued.search(l)
        if m: print(f"WARNING: {f.name}:{n}: code after a // comment never runs: …{m.group(0)[-70:]}")

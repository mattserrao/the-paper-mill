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

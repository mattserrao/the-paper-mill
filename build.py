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

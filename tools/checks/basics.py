"""Basic page integrity.
  ids:     static (no browser): every element id the script looks up ($('x'), getElementById, querySelector('#x'))
           exists in the markup or is created by the script. Ids in the markup that nothing references are only
           listed (a note, not a failure).
  nothree: three.js unreachable (every request but the page aborted): the page shows the no-3D screen (#no3d),
           not the menu, and raises no errors.
Replaces tools/idcheck.py and tools/nothree.py (both only printed).
Usage: python3 basics.py [index.html]"""
# tier: quick
import sys, re, os, pathlib; sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1]))
from lib import *
C = Checks(); ok, errs, log = C.ok, C.errs, C.log

def page_path():
    return sys.argv[1] if len(sys.argv) > 1 and not sys.argv[1].startswith("-") else os.environ.get("PM_HTML") or str(HERE.parent / "index.html")

def ids():
    C.sec("ids")
    h = pathlib.Path(page_path()).read_text()   # the page as built (no test hook)
    js = h[h.index('>', h.rindex('<script')) + 1:h.rindex('</script>')]; markup = h[:h.rindex('<script')]
    have = set(re.findall(r'\bid="([^"]+)"', markup)) | set(re.findall(r'\bid=([A-Za-z][\w-]*)[ >]', markup))
    made = set(re.findall(r'id="([\w-]+)"', js)) | set(re.findall(r'\.id\s*=\s*["\']([\w-]+)', js))
    # ids made by helpers: a function whose first parameter becomes an element id (el.id=id, or id="${id}" in a
    # template), e.g. shell("prepOv") or tog("tsTut",...); every literal first argument to such a helper is made too
    helpers = set()
    for m in re.finditer(r'(?:function\s+(\w+)\s*\(\s*(\w+)\s*[,)]|(?:const|let|var|[,;])\s*(\w+)\s*=\s*\(\s*(\w+)\s*[,)][^{;]*?=>)', js):
        name, arg = (m.group(1), m.group(2)) if m.group(1) else (m.group(3), m.group(4))
        body = js[m.end():m.end() + 400]
        if re.search(r'\.id\s*=\s*' + arg + r'\b', body) or ('id="${' + arg + '}"') in body: helpers.add(name)
    for name in helpers: made |= set(re.findall(r'(?<![\w.])' + name + r'\(\s*["\']([\w-]+)["\']', js))
    refs = set(re.findall(r'(?:\$|getElementById)\(\s*["\']([\w-]+)["\']\s*\)', js)) | set(re.findall(r'querySelector(?:All)?\(\s*["\']#([\w-]+)', js))
    missing = sorted(refs - have - made)
    ok("every id the script references exists", not missing, f"referenced but missing: {missing}" if missing else f"{len(refs)} ids")
    unused = sorted(i for i in have if i not in js and '#' + i not in h[:h.index('</style>')])
    if unused: C.note("in markup but never referenced in JS/CSS:", unused)

def nothree(pw):
    C.sec("nothree")
    html = pathlib.Path(page_path()).read_text()
    b = launch(pw)
    pg = b.new_page(viewport={"width": 800, "height": 450})
    pg.on("pageerror", lambda e: errs.append("PAGEERROR " + str(e)[:200]))
    def route(r):
        if r.request.url.startswith("http://bench.local/"): return r.fulfill(body=html, content_type="text/html")
        return r.abort()   # three.js (and everything else) unreachable
    pg.route("**/*", route); pg.goto("http://bench.local/"); pg.wait_for_timeout(5000)
    ok("no-3D screen shown", pg.evaluate("()=>{const e=document.getElementById('no3d');return !!e&&!e.hidden}"))
    ok("menu not shown", not pg.evaluate("()=>{const e=document.getElementById('v2menu');return !!e&&!e.hidden}"))
    b.close()

try: ids()
except Exception as e: ok("ids: ran to the end", False, repr(e)[:300])
with sync_playwright() as pw:
    for f in (nothree,):
        try: f(pw)
        except Exception as e: ok(f"{f.__name__}: ran to the end", False, repr(e)[:300])
C.done()      # page errors fail the check

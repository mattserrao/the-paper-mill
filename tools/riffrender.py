"""Render the gator riff offline from a build and write a WAV. Usage: python3 riffrender.py <index.html> <out.wav>"""
import pathlib,sys,struct,wave
from playwright.sync_api import sync_playwright
src=open(pathlib.Path(__file__).parent/'bench.py').read()
exec(src.split('def stats')[0].split('from playwright.sync_api import sync_playwright')[1])
html=pathlib.Path(sys.argv[1]).read_text()
with sync_playwright() as pw:
    b=pw.chromium.launch(args=["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"])
    pg=b.new_page();pg.route("**/*",route_for(html));pg.add_init_script(INIT);pg.goto("http://bench.local/")
    pg.wait_for_function("window.__PM&&__PM.AUDIO&&__PM.AUDIO.riffRender",timeout=240000)
    a=pg.evaluate("()=>__PM.AUDIO.riffRender()")
pk=max(1e-6,max(abs(x) for x in a));g=0.89/pk
with wave.open(sys.argv[2],"wb") as w:
    w.setnchannels(1);w.setsampwidth(2);w.setframerate(44100);w.writeframes(b"".join(struct.pack("<h",int(max(-1,min(1,x*g))*32767)) for x in a))
print("samples",len(a),"peak",round(pk,3))

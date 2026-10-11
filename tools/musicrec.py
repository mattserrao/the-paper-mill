"""Record the game's music to audio files for listening: each named piece (or upset piece) plays for N seconds in a headless
page, the master output is captured sample by sample and written as a WAV (and an MP3 when ffmpeg is installed).
Usage: python3 musicrec.py ../test/vN/index.html <outdir> [--secs=40] [--only=neon,gallop]
Pieces: rural Wet End Morning / Felt Moss / Night Shift Stars / Canopy Light / Lofi Break Room; urban Neon Rain / Rooftop Static /
Tears in the Mist; desert Dry Wash / High Noon Haze / Mesa Wind; swamp Cypress Roll / Slow Water / Porch Swing;
upsets strings / pulse / gallop / stomp / drive."""
import pathlib, sys, subprocess, struct, shutil
from playwright.sync_api import sync_playwright
src = open(pathlib.Path(__file__).parent / "bench.py").read()
exec(src.split("def stats")[0].split("from playwright.sync_api import sync_playwright")[1])
args = [a for a in sys.argv[1:] if not a.startswith("--")]; flags = {a.split("=")[0]: a.split("=", 1)[1] if "=" in a else True for a in sys.argv[1:] if a.startswith("--")}
html = pathlib.Path(args[0]).read_text(); out = pathlib.Path(args[1]); out.mkdir(parents=True, exist_ok=True)
secs = float(flags.get("--secs", 40)); only = [x.strip().lower() for x in flags.get("--only", "").split(",") if x.strip()]
if "window.__PM=" not in html:
    i = html.rindex("})();", 0, html.rindex("</script>")); html = html[:i] + HOOK + html[i:]
PIECES = [("rural", "wet"), ("rural", "felt"), ("rural", "night"), ("rural", "canopy"), ("rural", "lofi"), ("urban", "neon"), ("urban", "rooftop"), ("urban", "tears"),
          ("desert", "dry"), ("desert", "high"), ("desert", "mesa"), ("swamp", "cypress"), ("swamp", "slow"), ("swamp", "porch")]
UPSETS = [("rural", "strings"), ("urban", "pulse"), ("desert", "gallop"), ("swamp", "stomp"), ("rural", "drive")]
REC = """(secs)=>new Promise(res=>{const A=__PM.AUDIO,c=A.ctx,sp=c.createScriptProcessor(4096,2,2),L=[],R=[];let n=0;
  sp.onaudioprocess=e=>{if(n>=secs*c.sampleRate)return;L.push(Float32Array.from(e.inputBuffer.getChannelData(0)));R.push(Float32Array.from(e.inputBuffer.getChannelData(1)));n+=4096;
    if(n>=secs*c.sampleRate){A.master.disconnect(sp);sp.disconnect();const l=new Float32Array(n),r=new Float32Array(n);let o=0;for(let i=0;i<L.length;i++){l.set(L[i],o);r.set(R[i],o);o+=4096;}
      const i16=new Int16Array(n*2);for(let i=0;i<n;i++){i16[i*2]=Math.max(-32768,Math.min(32767,l[i]*32767));i16[i*2+1]=Math.max(-32768,Math.min(32767,r[i]*32767));}
      window.__pcm=i16;res({rate:c.sampleRate,chunks:Math.ceil(i16.byteLength/(1<<20)),bytes:i16.byteLength,now:A.now});}};
  A.master.connect(sp);const z=c.createGain();z.gain.value=0;sp.connect(z);z.connect(c.destination);})"""
def wav(path, rate, pcm):
    with open(path, "wb") as f:
        f.write(b"RIFF" + struct.pack("<I", 36 + len(pcm)) + b"WAVE" + b"fmt " + struct.pack("<IHHIIHH", 16, 1, 2, rate, rate * 4, 4, 16) + b"data" + struct.pack("<I", len(pcm)) + pcm)
import base64
with sync_playwright() as pw:
    b = pw.chromium.launch(args=["--autoplay-policy=no-user-gesture-required", "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"])
    for env, name in PIECES + UPSETS:
        if only and name not in only: continue
        up = (env, name) in UPSETS
        pg = b.new_page(viewport={"width": 800, "height": 450}); errs = []; pg.on("pageerror", lambda e: errs.append(str(e)[:200]))
        pg.route("**/*", route_for(html)); pg.add_init_script(INIT)
        pg.goto(f"http://bench.local/?env={env}&mill=1&" + (f"upset={name}" if up else f"song={name}"))
        pg.wait_for_function("window.__PM&&__B.first!==null", timeout=120000, polling=300)
        pg.evaluate("()=>{__PM.AUDIO.setOn(true);__PM.AUDIO.setVol(0.9);}")
        if up: pg.wait_for_timeout(800); pg.evaluate("()=>{setInterval(()=>__PM.AUDIO.update(true),100);}")
        r = pg.evaluate(REC, secs)
        pcm = bytearray()
        for k in range(r["chunks"]):
            pcm += base64.b64decode(pg.evaluate("k=>{const u=new Uint8Array(window.__pcm.buffer.slice(k<<20,(k+1)<<20));let s='';for(let i=0;i<u.length;i+=0x8000)s+=String.fromCharCode.apply(null,u.subarray(i,i+0x8000));return btoa(s);}", k))
        fn = out / f"{env}-{name}.wav"; wav(fn, r["rate"], bytes(pcm))
        if shutil.which("ffmpeg"):
            subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(fn), "-codec:a", "libmp3lame", "-q:a", "4", str(fn.with_suffix(".mp3"))]); fn.unlink()
        print(f"{env}-{name}: {r['now']}  {secs:.0f} s  errors={errs or 'none'}")
        pg.close()
    b.close()

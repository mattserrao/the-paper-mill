"""Full scorecard for one build. Usage: python3 suite.py <index.html> <label>  (about 10 minutes)
Writes scorecard-<label>.json and prints a one-line summary. Structural numbers compare across sessions directly;
timing numbers are also reported divided by this machine's calibration (see calib.py)."""
import subprocess, sys, json, re, pathlib, statistics as st
H, label = sys.argv[1], sys.argv[2]; here = pathlib.Path(__file__).parent
def run(*a, t=600):
    return subprocess.run([sys.executable, *a], cwd=here, capture_output=True, text=True, timeout=t).stdout
def lastjson(out):
    i = out.find("{"); return json.loads(out[i:])
cal = [json.loads(run("calib.py")) for _ in range(3)]
calib = {"js_ms": st.median(c["js_ms"] for c in cal), "gl_ms": st.median(c["gl_ms"] for c in cal)}
ad = lastjson(run("audit.py", H)); ap = lastjson(run("audit.py", H, "phone"))
hj = json.loads(run("hitches.py", H, "phone").split("JSON", 1)[1])
ph = json.loads(run("phone.py", H).split(" ", 1)[1])
sd = json.loads(run("steady_high.py", H).split(" ", 1)[1])
S = {"label": label, "calibration": calib,
  "structure": {
    "phone_draws_per_frame": ap["passes"]["mainDrawsPerFrame"], "desktop_draws_per_frame": ad["passes"]["mainDrawsPerFrame"],
    "shadow_pass_draws": ad["passes"]["shadowDrawsWhenOn"], "triangles_per_frame": ad["passes"]["trianglesPerFrameReported"],
    "scene_nodes": ad["scene"]["nodes"], "auto_matrices": ad["scene"]["matrixAutoUpdate"], "shader_programs": ad["passes"]["programs"],
    "texture_MB": ad["textures"]["estMB"], "transparent_overdraw_layers": ad["overdraw"]["transparentOnly"]["avgLayers"],
    "blurred_elements_over_3d": ap["dom"]["elementsWithBackdropBlur"], "dom_mutations_per_s": ap["dom"]["domMutationsPerSec"],
    "phone_alloc_MB_per_s": ap["alloc"]["MBperSec"], "phone_long_frames_first_90s": hj["long_frames_90s"], "phone_worst_frame_ms": hj["worst_ms"]},
  "timing": {
    "phone_cpu_ms": ph["cpu_med_ms"], "desktop_cpu_ms_normal": sd["normal"]["cpu_med"], "desktop_cpu_ms_high": sd["high"]["cpu_med"],
    "phone_cpu_norm": round(ph["cpu_med_ms"] / calib["gl_ms"], 3), "desktop_cpu_norm_normal": round(sd["normal"]["cpu_med"] / calib["gl_ms"], 3)},
  "raw": {"audit_desktop": ad, "audit_phone": ap, "phone": ph, "steady": sd}}
(here / f"scorecard-{label}.json").write_text(json.dumps(S, indent=1))
print(json.dumps({k: S[k] for k in ("label", "calibration", "structure", "timing")}, indent=1))

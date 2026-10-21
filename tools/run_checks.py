"""Run the regression checks in tools/checks/ against a build and print one table.

Usage: python3 run_checks.py [index.html] [--tier=quick|default|full] [-j 2] [--only=smoke,dcs] [--build]

  quick    smoke, determinism, save, basics: run after any change (~3 min)
  default  every check except the slow ones (the normal pre-merge run)
  full     everything, including music and the in-game autotest

Each check is its own process (one Chromium each), so -j sets how many run at once. On a 2-CPU machine keep -j 2:
more slows every check and pushes the real-time waits past their limits. Logs go to tools/check-logs/<check>.log.
Exit code 0 only if every check passed. A check passes when it exits 0 and prints "RESULT: PASS" (lib.Checks.done)."""
import concurrent.futures as cf, pathlib, re, subprocess, sys, time

HERE = pathlib.Path(__file__).resolve().parent
CHECKS, LOGS = HERE / "checks", HERE / "check-logs"
ORDER = {"quick": 0, "default": 1, "slow": 2}

def tier_of(p):
    m = re.search(r"^# tier: (\w+)", p.read_text(), re.M)
    return m.group(1) if m else "default"

def main():
    args = sys.argv[1:]
    opt = {a.split("=")[0]: (a.split("=", 1)[1] if "=" in a else True) for a in args if a.startswith("--")}
    pos = [a for a in args if not a.startswith("-")]
    jobs = 2
    if "-j" in args: jobs = int(args[args.index("-j") + 1]); pos = [a for a in pos if a != str(jobs)]
    html = pathlib.Path(pos[0]).resolve() if pos else HERE.parent / "index.html"
    if opt.get("--build"):
        r = subprocess.run([sys.executable, str(HERE.parent / "build.py")], capture_output=True, text=True)
        print(r.stdout.strip().splitlines()[-1] if r.stdout.strip() else r.stderr)
        if r.returncode: sys.exit("build failed")
    tier = opt.get("--tier", "default"); cap = {"quick": 0, "default": 1, "full": 2}[tier]
    only = set(opt["--only"].split(",")) if "--only" in opt else None
    todo = sorted((p for p in CHECKS.glob("*.py") if not p.name.startswith("_")),
                  key=lambda p: (-len(p.read_text()), p.name))   # longest first: better packing across workers
    todo = [p for p in todo if (p.stem in only if only else ORDER.get(tier_of(p), 1) <= cap)]
    if not todo: sys.exit("no checks matched")
    LOGS.mkdir(exist_ok=True)
    print(f"{len(todo)} checks on {html.name} ({html.stat().st_size:,} bytes), {jobs} at a time, tier {tier}")

    def run(p):
        t0 = time.time()
        try:
            r = subprocess.run([sys.executable, str(p), str(html)], cwd=CHECKS, capture_output=True, text=True, timeout=1800)
            out, rc = r.stdout + ("\n" + r.stderr if r.stderr.strip() else ""), r.returncode
        except subprocess.TimeoutExpired as e:
            out, rc = (e.stdout or b"").decode() if isinstance(e.stdout, bytes) else (e.stdout or ""), "timeout"
        (LOGS / f"{p.stem}.log").write_text(out)
        m = re.findall(r"^RESULT: (PASS|FAIL) (\d+)/(\d+)", out, re.M)
        ok = rc == 0 and bool(m) and m[-1][0] == "PASS"
        fails = [l[5:] for l in out.splitlines() if l.startswith("FAIL ")]
        why = "" if ok else (fails[0] if fails else f"exit {rc}" + ("" if m else ", no RESULT line"))
        print(f"  {'pass' if ok else 'FAIL'}  {p.stem:<14} {time.time() - t0:6.0f} s" + (f"  {why[:110]}" if why else ""), flush=True)
        return p.stem, ok, time.time() - t0, (f"{m[-1][1]}/{m[-1][2]}" if m else "-"), len(fails)

    t0 = time.time()
    with cf.ThreadPoolExecutor(jobs) as ex: res = list(ex.map(run, todo))
    bad = [r for r in res if not r[1]]
    print(f"\n{len(res) - len(bad)}/{len(res)} checks passed, {sum(int(r[3].split('/')[1]) for r in res if r[3] != '-')} assertions, "
          f"{(time.time() - t0) / 60:.1f} min wall ({sum(r[2] for r in res) / 60:.1f} min of check time)")
    if bad: print("failed:", ", ".join(r[0] for r in bad), f"(logs in {LOGS.relative_to(HERE.parent)}/)")
    sys.exit(1 if bad else 0)

if __name__ == "__main__":
    main()

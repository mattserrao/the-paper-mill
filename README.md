# the-paper-mill
# a fun project for fun

Run a recycled paperboard mill from truck to warehouse, in your browser.

Two scored modes: a 30-day **season** (most profit) and **survival** (last as long as you can while every planned outage starts a rougher, dearer wave).

- **Play:** open `index.html`.
- **Edit:** change the files in `src/`, then run `python3 build.py` to rebuild `index.html` (see `src/README.md`).
- **Fiddly knobs:** red knobs around the mill and the SPOT / WET / DET DCS screens at the operator consoles. Leave them alone and nothing happens; move one and see what turns up later. Settings → View → Fiddly knobs view shows where they all are.
- **Test:** `python3 tools/run_checks.py --build` runs every regression check (see `tools/README.md`); performance and balance tools are in `tools/perf/` and `tools/balance/`.
- **What's new:** see `CHANGELOG.md`.

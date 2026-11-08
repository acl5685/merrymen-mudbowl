# Merrymen Mudbowl (2026–27)

Live stats, playoff forecast and a 3D monster-truck arena for the Sleeper league **Lord Grigass & the Merrymen**.
Static site, no backend: it reads the public Sleeper API in the browser.

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # outputs dist/
npm run check    # pulls live data and prints the forecast table to compare with the spec
```

## Share it with a link (GitHub Pages)

1. Create a GitHub repository and push this folder to its `main` branch.
2. In the repo go to **Settings → Pages** and set **Source** to **GitHub Actions**.
3. The workflow in `.github/workflows/deploy.yml` builds and publishes on every push to `main`.
   The link is `https://<your-username>.github.io/<repo-name>/`.

## Layout

- `src/api/sleeper.js` fetches weeks 1-17 once, then re-fetches the current week every 60s on Sundays and Mondays.
- `src/model/` turns API rows into `WEEKS` / `SCHEDULE`, plus stats, awards, the Monte Carlo forecast and driver bios.
- `src/config/drivers.js` maps Sleeper `owner_id` to persona, color and truck theme.
- `src/config/profiles.js` holds each driver's made-up backstory and the stat-triggered one-liners.
- `src/scene/` is the Three.js arena and trucks, pinned to three r128 so it looks like the prototype.
- `scripts/prototype.html` is the original single-file prototype, kept for reference only.

## Credits

Floor texture `brown_mud` and sky `dikhololo_night` come from [Poly Haven](https://polyhaven.com) (CC0).

Arena props (`public/models/simready/`) are [NVIDIA SimReady assets](https://huggingface.co/datasets/nvidia/simready-assets), licensed CC BY 4.0, in the GLB conversion from [codepawl/simready-glb](https://huggingface.co/datasets/codepawl/simready-glb) (`mobile/` set). They are scaled and repositioned, not otherwise changed. Add `?props=off` to the URL to hide them. Add `?fx=off` to the URL to turn the glow effect off.

## What comes from Sleeper

League, users, rosters, weekly matchups (team and player points), the playoff bracket, last season's league for head-to-head
history, Sleeper's own record and streak strings, and player names (fetched once, cached in the browser).

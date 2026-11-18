# Demo video tools

How `demo/hauntedserver-1987-demo-v2.mp4` was made. Not part of the game.

1. `record.mjs` drives the live site with Playwright on a fixed timeline
   (the same commands a player types) and saves CDP screencast frames at
   2560x1440, plus the times when popups, cards and the ending appear.
2. `render.py` turns the frames into 1080p/30 fps video: eased camera
   zooms and pans, short freezes on four clues, small shakes when Jack
   strikes, captions, and fades. Encoding uses ffmpeg (libx264).

Paths to Chromium, Playwright and ffmpeg are specific to the Kiro sandbox
the video was made in. Narration timing: `docs/DEMO-SCRIPT.md` on `main`.

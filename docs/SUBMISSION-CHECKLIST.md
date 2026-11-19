# Submission checklist (Kiroween 2026)

Status as of Nov 19, 2026. "Production" is the live site, built from `main`.
"Local branch" is `chore/submission-polish`, which is not merged or deployed
yet. Each check below covers only what was observed; it is evidence, not a
general proof.

## Rules summary

From the official rules (<https://kiroween.devpost.com/rules>), read on
Nov 19, 2026. Submit between Oct 30, 2026 09:00 PT and **Dec 4, 2026
14:00 PST** (Dec 5, 06:00 China time); no extensions. The project needs a
write-up of how Kiro was used, the `.kiro/` directory at the repo root (not
ignored), a public GitHub repo with an open-source license, a working app that
judges can use for free until **Jan 29, 2027 13:00 PT**, English materials, a
**public** YouTube demo under 3 minutes showing the actual app, permission for
any third-party assets, and a chosen category. We chose **Resurrection** (an
obsolete 4.3BSD system used for modern security education).

## Verified

| Item | Evidence |
|---|---|
| Built in the window | GitHub repo created 2026-11-17T02:22:13Z; earliest commit Nov 17, 2026. |
| Public repo, open-source license | GitHub API: `Hello-Lv-tu/hauntedserver-1987` is public, license MIT, `LICENSE` at the root. |
| `.kiro/` in the repo | Public `main` has `.kiro/hooks`, `.kiro/specs` (5 specs) and `.kiro/steering`; no `.kiro/` file is git-ignored. |
| Kiro write-up | `docs/KIRO.md`, summarized in `docs/DEVPOST.md`. |
| English materials | README, Kiro write-up, Devpost text, YouTube copy and the demo narration are in English. The game has an English UI; it picks Chinese only for a Chinese-language browser, and the player can switch. |
| Production app | Site returns HTTP 200; `/api/ghost` is deployed. Browser test with checkpoints seeded at Levels 1 and 4 and the AI mocked to fall back: FIX NOW and "Run it for me" each reset the current level, kept learned spells (`rm` can still be learned), survived a reload, and could then be solved into Levels 2 and 5. At 390x844: no horizontal overflow, no page errors. Not a full play-through and not a live-AI test. |
| Local branch: endings | Both Move and Stay, in English and Chinese, reached through the real choice: the ending-screen bubbles match Nell's farewell in the terminal, and the ending can be reopened and reread after a page reload. At 390x844: no overflow, no page errors. |
| Local branch: checks | `npm run check` passed (lint, 284 tests in 31 files, build, API smoke test). |
| Final video file | `C:/Users/lvtu/Downloads/hauntedserver-1987-ownvoice-light.mp4`: 159.4 s (2:39), 1920x1080, H.264 with AAC 24 kHz audio, -18.36 LUFS integrated, -1.94 dBTP true peak, no silence of 3 s or more at -40 dB. A contact sheet across the video and the frame at 2:30 show the picture and captions intact. The English narration is text-to-speech generated from the owner's own reference voice recording. The video shows the complete main game but not the later postgame chat; that is fine, but do not describe the video as showing the chat. |
| YouTube copy | Title and description are ready in `docs/DEVPOST.md`, with no video link yet. |

## Pending

- [ ] **Merge approval (owner):** say yes to merging this branch. After that
      the deploy and final checks on `main` are handled for you.
- [ ] **YouTube (owner):** upload the final video as **Public**, paste the
      title and description from `docs/DEVPOST.md`, and check it plays when
      logged out.
- [ ] **Devpost (owner):** fill in the form (Resurrection, play link, code
      link, YouTube link, Kiro text) and submit before Dec 4, 14:00 PST.
- [ ] **Keep the app up** and free until Jan 29, 2027 13:00 PT. Without the
      DeepSeek key, Nell uses pre-written lines and the game still works.
- [ ] **Confirm yourself** (the repo cannot certify these): that you meet the
      rules' eligibility requirements, and that you have the rights to use
      the third-party assets and services: the ChatGPT-generated machine-room
      artwork, the VT323 and Fusion Pixel fonts (SIL OFL 1.1), and the
      DeepSeek API.

## Optional: student bonus

The bonus asks for a LinkedIn profile, a student email, the school, and the
year and degree. Known: sophomore at Guangdong University of Technology. Not
known: degree, student email, LinkedIn. Enter these only in the Devpost form,
never in this public repo. No other bonus (blog, social post, startup, Kiro
Crew, 2025 entry) is claimed.

# Demo video narration

For the video `demo/hauntedserver-1987-demo-v2.mp4` on the `demo-video`
branch: 2:26, 1920x1080, 30 fps, camera moves and captions, no audio. Times
are when each line should start; each matches the moment its caption
appears. About 290 words, which fits 2:26 at a calm pace (about 2 words a
second). The picture freezes briefly on four key clues (mail headers, the
`ls -l` sizes, the `diff`, the crontab), which gives you time to speak.

An optional 27-second Kiro segment at the end brings the video to about
2:54, still under the 3-minute limit.

| Time | On screen | Narration |
|---|---|---|
| 0:00 | Machine room, then the terminal boots | People learning the command line get a list of commands to memorize. Online scams keep getting smarter. This game teaches both, in one ghost story. |
| 0:11 | Nell's SOS, `write nell` | In 2026, you find a 1987 Unix server still running. A ghost, Nell, is trapped inside. You talk to her with the real `write` command. |
| 0:21 | Nell replies | Her replies are written by AI, in character. The story is scripted. |
| 0:24 | `ls -a`, `cat .from_nell` | `ls -a` finds her hidden note. |
| 0:28 | Jack's virus popup | Then Jack-o'-Daemon, a "modern" AI agent, shows a fake virus popup. |
| 0:33 | `ps aux`, `kill` | Nell is from 1987. She can't tell it's a scam, but I can. `ps aux` finds the program, and `kill` ends it. |
| 0:41 | Lesson card | Every level ends with a real-world lesson. |
| 0:45 | `finger nell`, `mail` | Level two. A mail signed "Nell" asks for my password. Her plan file says she never sent it. |
| 0:52 | Full headers (picture freezes) | The full headers show it came from a dot-cloud server. Sent from an iPhone. In 1987. |
| 1:03 | Ransom note, `ls -l` | Level three: ransomware. Nine ninety-nine a month to unlock my files. |
| 1:09 | `ls -l` sizes (picture freezes), `chmod 644` | But `ls -l` shows the sizes never changed. Nothing was encrypted, just locked. `chmod` opens them. |
| 1:19 | Smart Assistant | Level four. An AI assistant says `rm -rf` will free Nell. |
| 1:22 | `man rm` | The manual says it deletes everything. No thanks. |
| 1:28 | `diff` (picture freezes) | Level five. Jack rewrote the system log. `diff` against yesterday's copy shows what really happened. |
| 1:37 | Boss: `su` | The boss runs as root. I become root with `su`. |
| 1:43 | `kill 6666`, Jack comes back, `cat /usr/lib/crontab` | Kill him, and he comes right back. The real cause is cron, restarting him every minute. |
| 1:51 | Crontab (picture freezes), `rm`, then `kill 6666` | Delete the program, kill him again, and he is gone for good. |
| 2:02 | Nell asks: come with me, or stay? | Nell is free. Now she asks: come with you, or stay? You answer her yourself. |
| 2:09 | `tar cvf /dev/rmt0 ~nell` | She travels the 1987 way: on tape. |
| 2:14 | Ending screen | She wakes up in 2026, and thinks our buttons are too round. |
| 2:19 | Six tricks summary | Real commands. Six real scams. |
| 2:23 | Last caption | Play free at hauntedserver-1987 dot vercel dot app. |

## Optional Kiro segment (about 2:27 to 2:54)

Record your screen showing the GitHub repository: the `.kiro` folder, then
one steering file, one spec, the hooks folder.

| Time | On screen | Narration |
|---|---|---|
| 2:27 | `.kiro/steering` | I don't write code. Kiro wrote all of it. Steering files hold the story, Nell's personality, and what a 1987 machine really had. |
| 2:36 | `.kiro/specs` | Every big feature started as a spec: requirements, design and tasks. |
| 2:42 | `.kiro/hooks` | Hooks run 227 tests on every change, and property tests prove every level can always be finished. |
| 2:49 | Back to the game | Built with Kiro, for Kiroween 2026. |

## Pronunciation notes

- **hauntedserver-1987**: "haunted server nineteen eighty-seven"
- **Jack-o'-Daemon**: "Jack-oh-DEE-mon" (like "Jack-o'-lantern")
- **vax3**: "vax three"
- **ls -a**: "L S dash A"; **ls -l**: "L S dash L"
- **ps aux**: "P S aux" (rhymes with "socks")
- **chmod**: "C H mod"
- **man rm**: "man R M"; **rm -rf**: "R M dash R F"
- **diff**: "diff"; **su**: "S U"; **cron**: "cron"; **tar**: "tar"
- **6667 / 6666**: you can skip the numbers and just say "kill"

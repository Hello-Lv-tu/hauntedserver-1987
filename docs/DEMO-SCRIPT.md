# Demo video narration

For the draft video `demo/hauntedserver-1987-demo.mp4` on the `demo-video`
branch (2:18, 1280x720, burned-in captions, no audio). Times are when each
line should start; they match the on-screen captions to within about one
second. About 290 words, which fits 2:18 at a calm pace (about 2.2 words a
second).

An optional 25-second Kiro segment at the end brings the video to about
2:45, still under the 3-minute limit.

| Time | On screen | Narration |
|---|---|---|
| 0:00 | Machine room, then the terminal boots | People learning the command line get a list of commands to memorize. Online scams keep getting smarter. This game teaches both, in one ghost story. |
| 0:11 | Nell's SOS, `write nell` | In 2026, you find a 1987 Unix server still running. A ghost, Nell, is trapped inside. You talk to her with the real `write` command. |
| 0:21 | Nell replies | Her replies are written by AI, in character. The story is scripted. |
| 0:25 | `ls -a`, `cat .from_nell` | `ls -a` finds her hidden note. |
| 0:29 | Jack's virus popup | Then Jack-o'-Daemon, a "modern" AI agent, shows a fake virus popup. |
| 0:33 | Nell asks what to do, `ps aux`, `kill` | Nell is from 1987. She can't tell it's a scam, but I can. `ps aux` finds the program, and `kill` ends it. |
| 0:42 | Lesson card | Every level ends with a real-world lesson. |
| 0:45 | `finger nell`, `mail` | Level two. A mail signed "Nell" asks for my password. Her plan file says she never sent it. |
| 0:53 | Full headers | The full headers show it came from a dot-cloud server. Sent from an iPhone. In 1987. |
| 1:00 | Ransom note, `ls -l` | Level three: ransomware. Nine ninety-nine a month to unlock my files. |
| 1:05 | `chmod 644` | But `ls -l` shows the sizes never changed. Nothing was encrypted, just locked. `chmod` opens them. |
| 1:13 | Smart Assistant, `man rm` | Level four. An AI assistant says `rm -rf` will free Nell. The manual says it deletes everything. No thanks. |
| 1:22 | `diff` | Level five. Jack rewrote the system log. `diff` against yesterday's copy shows what really happened. |
| 1:31 | Boss: `su` | The boss runs as root. I become root with `su`, |
| 1:36 | `kill 6666`, Jack comes back | kill him, and he comes right back. |
| 1:40 | `cat /usr/lib/crontab` | The real cause is cron, restarting him every minute. |
| 1:45 | `rm`, then `kill 6666` | Delete the program, kill him again, and he is gone for good. |
| 1:52 | Nell asks: come with me, or stay? | Nell is free. Now she asks: come with you, or stay? You answer her yourself. |
| 2:01 | `tar cvf /dev/rmt0 ~nell` | She travels the 1987 way: on tape. |
| 2:07 | Ending screen | She wakes up in 2026, and thinks our buttons are too round. |
| 2:12 | Summary | Real commands, six real scams. Play free at hauntedserver-1987 dot vercel dot app. |

If the last line feels rushed, freeze the final frame for 3 to 5 seconds in
your video editor and finish speaking over it.

## Optional Kiro segment (about 2:18 to 2:45)

Record your screen showing the GitHub repository: the `.kiro` folder, then
one steering file, one spec, the hooks folder.

| Time | On screen | Narration |
|---|---|---|
| 2:18 | `.kiro/steering` | I don't write code. Kiro wrote all of it. Steering files hold the story, Nell's personality, and what a 1987 machine really had. |
| 2:27 | `.kiro/specs` | Every big feature started as a spec: requirements, design and tasks. |
| 2:33 | `.kiro/hooks` | Hooks run 227 tests on every change, and property tests prove every level can always be finished. |
| 2:40 | Back to the game | Built with Kiro, for Kiroween 2026. |

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

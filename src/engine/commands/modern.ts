/**
 * Commands players bring from 2026 (or from DOS) that did not exist on a
 * 1987 BSD system. The shell still says "Command not found." and the UI
 * shows the hint as a separate learning aid.
 */
export const MODERN_HINTS: Readonly<Record<string, string>> = {
  sudo: 'sudo is not installed here. In 1987, admins used `su` to become root.',
  less: '`less` is too new for this machine. Try `more` (or `cat`).',
  vim: '`vim` came out in 1991. This machine has `vi`.',
  nano: '`nano` came out in 1999. This machine has `vi`.',
  top: '`top` is not installed. Try `ps aux` to see running programs.',
  htop: '`htop` is from 2004. Try `ps aux` to see running programs.',
  apt: 'No package managers in 1987. Software came on tape.',
  'apt-get': 'No package managers in 1987. Software came on tape.',
  curl: 'No web in 1987 (it was invented in 1989). Try `mail` instead.',
  wget: 'No web in 1987 (it was invented in 1989). Try `mail` instead.',
  ssh: '`ssh` came out in 1995. People used `rlogin` or `telnet` back then.',
  git: '`git` is from 2005. In 1987, programmers used RCS or SCCS.',
  python: 'Python came out in 1991. This machine has `sh`, `csh` and `cc`.',
  python3: 'Python came out in 1991. This machine has `sh`, `csh` and `cc`.',
  bash: '`bash` came out in 1989. You are already in `csh`.',
  zsh: '`zsh` came out in 1990. You are already in `csh`.',
  cls: '`cls` is a DOS command. On Unix, use `clear`.',
  dir: '`dir` is a DOS command. On Unix, use `ls`.',
  ll: '`ll` is a modern alias. Type `ls -l`.',
}

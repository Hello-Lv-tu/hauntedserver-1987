// Placeholder screen. The real terminal (virtual filesystem + command parser)
// is specified in .kiro/specs/vfs-and-shell/ and will replace this component.

const BOOT_LINES = [
  '4.3 BSD UNIX #12: Tue Oct 27 03:14:07 EST 1987',
  '    root@vax3.cs.ravenmoor.edu:/usr/src/sys/GENERIC',
  'real mem  = 16777216',
  'avail mem = 14680064',
  '',
  'vax3.cs.ravenmoor.edu login: intern',
  'Last login: Sat Oct 31 23:59:59 1987 on ttyh3',
  '',
  'You have mail.',
]

function App() {
  return (
    <main className="crt" aria-label="Terminal">
      <pre className="screen">
        {BOOT_LINES.join('\n')}
        {'\n% '}
        <span className="cursor" aria-hidden="true">
          _
        </span>
      </pre>
    </main>
  )
}

export default App

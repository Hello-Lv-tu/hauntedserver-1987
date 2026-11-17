import { useState } from 'react'
import { createWorld } from './story/world'
import { Terminal } from './ui/Terminal'

const BOOT_LINES = [
  '4.3 BSD UNIX #12: Tue Oct 27 03:14:07 EST 1987',
  '    root@vax3.cs.ravenmoor.edu:/usr/src/sys/GENERIC',
  'real mem  = 16777216',
  'avail mem = 14680064',
  '',
  'vax3.cs.ravenmoor.edu login: guest',
  'Last login: Sat Oct 31 23:59:59 1987 on ttyh3',
  '',
  'Message from nell@vax3 on ttyp0 at 23:59 ...',
  'is someone there?? please. the pumpkin thing locked me in.',
  "type: write nell   (it can't hear us that way)",
  'EOF',
  '',
  '[dev build: `write` arrives in a later update. For now try `ls -a`, `cat README`, `help`.]',
  '',
]

function App() {
  const [world] = useState(createWorld)
  return (
    <main className="crt">
      <Terminal vfs={world.vfs} session={world.session} intro={BOOT_LINES} />
    </main>
  )
}

export default App

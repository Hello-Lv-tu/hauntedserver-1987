/**
 * Render a terminal line, showing `backtick` spans as commands: highlighted
 * and never broken across two lines. A play-test showed why: the hint
 * `chmod 644 README .login` wrapped right at the space, so the player read
 * "README.login" as one word.
 */
export function LineText({ text, commands }: { text: string; commands: boolean }) {
  if (!commands || !text.includes('`')) return <>{text || '\u00a0'}</>
  const parts = text.split(/(`[^`]+`)/g)
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith('`') && part.endsWith('`') && part.length > 2 ? (
          <code key={i} className="cmd">
            {part.slice(1, -1)}
          </code>
        ) : (
          part
        ),
      )}
    </>
  )
}

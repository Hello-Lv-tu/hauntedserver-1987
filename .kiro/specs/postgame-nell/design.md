# Design: talking to Nell after the ending

## Flow

```
Stay: write nell -> story end beat -> nellVoice effect
      game: request { level 8, beat 'end', ending 'stay', keepsake?, history from chat }
      PendingVoice (terminal) -> /api/ghost -> printed as a write message,
      recorded in the chat

Move: chat window -> step({ type: 'chat', text })
      game: request { ..., ending 'move', ... }, PendingVoice { target: 'chat' }
      /api/ghost -> step({ type: 'voice', id, lines }) -> appended to the chat
      (write nell in the terminal: pre-written note, no AI)
```

The existing `useNellVoice` hook resolves both kinds, one request at a time.

## Pure modules

- `src/game/postgame.ts`: `PostgameChat { ending, messages, nextId }`,
  `addMessage` (keeps 30), `cleanChatText` (one printable line, 200 chars),
  `chatHistory` (last 8, 300 chars), `parsePostgame` / `serializePostgame`
  (storage key `hauntedserver:postgame`, `version: 1`, whole-or-nothing
  validation), `joinLines` (sanitized reply lines to one bubble).
- `src/ai/postgame.ts`: the server-owned Stay and Move contexts.
- `src/ai/request.ts`: optional `ending` and `keepsake` fields;
  `fitVoiceRequest` drops the oldest history until the body fits 4 KB.
- `src/ai/prompt.ts`: requests with `ending` get the postgame persona and
  context; campaign prompts are unchanged.
- `src/story/levels/end.ts`: `postgameEffects(kind)` writes Nell's
  ending-specific `.plan` (applied at the ending and on every revisit).

## Game changes

```ts
GameState.postgame: PostgameChat | null
PendingVoice.target?: 'chat'          // default: the terminal
GameInput |= { type: 'chat'; text: string }
NewGameOptions.postgame?: PostgameChat | null
```

- `ending` effect: a fresh chat for that ending (Move: Nell's opening
  bubbles, plus the keepsake line).
- Revisit (`newGame` with an ending save): stored chat if it matches the
  save's ending, else fresh. Move adds a "welcome back" bubble when the stored
  chat has player messages. Stay's reunion adds the keepsake line.
- `chat` input: ignored unless the chat is Move, the text is non-empty, and
  no chat reply is pending.
- `voice` input: chat targets append to the chat (dropped if the chat's
  ending changed); terminal targets print as before, and Stay replies are
  also recorded in the chat.

## UI

- `NellChat.tsx` + `chat.css`: a dialog styled like the Move ending (soft
  gradient, round bubbles, round send button). Full-screen on phones, height
  follows `visualViewport` so the on-screen keyboard never covers the input.
  Portaled to `document.body`, outside `.crt` and its scanline overlay; the
  game behind it is `inert`, Tab is trapped, focus returns to the opener.
  IME-safe Enter: composition flag, `isComposing`, and keyCode 229 (Safari
  sends compositionend before the committing keydown).
- Revisit: a stored chat ending with a player message gets that ending's
  fallback reply (no request).
- `Game.tsx`: "Chat" toolbar button with an unread dot (Move only), persists
  the chat, clears it when there is none (new game).
- `EndScreen.tsx`: "Reply to Nell" button in the Move ending.
- `chatView.ts`: pure helpers for send state, character counter and unread.

## Testing

- AI: request validation (`ending`, `keepsake`), contexts per ending, server
  rejects `ending` outside the epilogue, `fitVoiceRequest`.
- Game: both endings' postgame, old saves, malformed storage (property test),
  bounded history, fallback, failed/stale/duplicate replies, rapid sends,
  Chinese.
- UI helpers: send state, counter, unread.

# Requirements: talking to Nell after the ending

## Introduction

After an ending the player could already `write nell`, but Nell answered with
one generic epilogue context ("more adventures are coming"), the Move ending
had no place where 2026 Nell actually lives, and nothing was remembered
between visits. This spec adds ending-specific postgame conversations on top
of the existing story engine and `/api/ghost` endpoint. See the "Postgame"
sections of `.kiro/steering/story.md` and `ghost-persona.md`.

## Glossary

- **Postgame**: the epilogue level after an ending, in the same session or on
  a later visit.
- **Chat**: the short postgame conversation stored in the browser.
- **Keepsake**: the hidden ending's line for the next visitor.

## Requirement 1: Channels follow the ending

1. WHEN the ending is Stay, THE player SHALL talk to Nell through the
   terminal (`write nell`), and `finger nell` SHALL show her guardian `.plan`.
2. WHEN the ending is Move, THE game SHALL offer a messenger-style chat window
   (toolbar button and a "Reply to Nell" button on the ending screen) with
   original styling and no third-party brand or integration.
3. WHEN the ending is Move and the player writes to Nell in the terminal,
   Nell SHALL answer with a pre-written note pointing to the chat, and
   `finger nell` SHALL show her "gone traveling" `.plan`.
4. THE keepsake SHALL be acknowledged in both channels without quoting it.
5. THE campaign, both endings, the hidden ending, the post-credits tease,
   saves, ending screens and the Spellbook SHALL keep working as before.

## Requirement 2: What Nell knows

1. THE server SHALL choose the postgame context itself from the validated
   enum `ending` (`move` | `stay`) and the boolean `keepsake`; it SHALL NOT
   accept prompt text or facts from the browser.
2. Both contexts SHALL state that Jack-o'-Daemon is defeated and which
   ending happened. Stay Nell knows only 1987. Move Nell is a newcomer who
   learns about 2026 only from the player and never claims modern knowledge.
3. THE AI SHALL NOT invent tasks, clues, files, passwords or secrets, and
   SHALL NOT change story state.
4. WHEN a request carries `ending` but is not for the epilogue beat, THE
   server SHALL reject it (400).

## Requirement 3: Limits and failures

1. Postgame requests SHALL use the existing validation, size limit, rate
   limit, timeout and reply sanitizing. The player's message SHALL be at most
   200 characters; history at most 8 entries of 300 characters.
2. THE browser SHALL trim history so the request body fits the server's
   4 KB limit.
3. WHEN the AI is unavailable, slow, rate-limited or rejected, Nell SHALL
   answer with a pre-written line (at least two per channel).
4. THE chat window SHALL accept one message at a time: while Nell's reply is
   pending, further sends SHALL be ignored (the draft is kept), so replies
   are never duplicated or mixed.
5. A reply that arrives for a chat that no longer exists (new game, other
   ending) SHALL be dropped.

## Requirement 4: Persistence

1. THE chat (last 30 messages, each at most 300 characters) SHALL be stored
   only in `localStorage`, separate from the version-1 save, and SHALL be
   restored on later visits for the same ending.
2. WHEN stored chat is missing, malformed, or belongs to another ending, THE
   game SHALL start a fresh chat without errors. Old version-1 saves with an
   ending SHALL get a fresh chat.
3. WHEN a new game starts, THE stored chat SHALL be cleared.
4. WHEN a restored chat ends with an unanswered player message (the page
   closed while Nell was answering), THE game SHALL answer it once with that
   ending's pre-written fallback, in the current language, without sending a
   new AI request.

## Requirement 5: Accessibility and languages

1. THE chat window SHALL have a labelled dialog, a polite live log, a
   labelled input with a length limit, a send button, a visible and
   announced "typing" status, Escape to close, and focus return. While it is
   open, Tab SHALL stay inside it and the game behind it SHALL be inert.
   An Enter that commits an input method composition SHALL NOT send.
5. THE chat window SHALL render outside the CRT layer (no scanlines).
2. THE chat window SHALL work on phones: full-screen, follows the on-screen
   keyboard, 16px+ input text, bounded scrolling.
3. Motion SHALL respect `prefers-reduced-motion`.
4. Every new player-facing string SHALL have a Simplified Chinese version.

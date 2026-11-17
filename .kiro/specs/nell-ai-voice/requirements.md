# Requirements: Nell's AI voice

## Introduction

Nell answers free-form messages with pre-written lines today. In play-testing a
player asked "what should i do next?" and got "it's right there, silly :-P",
which did not help. This spec lets an AI model write Nell's replies to the
player's own words, while the story stays deterministic.

Provider: DeepSeek (`deepseek-flash`, OpenAI-compatible API), called from one
Vercel function so the key never reaches the browser.

## Glossary

- **Voice request**: a request for Nell to reply to something the player wrote.
- **Fallback**: the pre-written line the story already chose for that moment.

## Requirement 1: What the AI may and may not do

1. THE AI SHALL only write the wording of Nell's replies to free-form messages
   (beat chatter and generic chatter). Story-moving lines (greetings,
   reactions, lessons, "to be continued") and the "you're still writing"
   nudge SHALL stay pre-written.
2. THE AI SHALL NOT change story state, unlock clues, or decide whether a
   level is complete.
3. THE prompt SHALL contain only the current level's goal and hints, recent
   conversation, and Nell's persona; the AI SHALL be told not to invent files,
   commands, passwords or story facts beyond those.
4. THE AI SHALL nudge (direction or command) and SHALL only give the full
   answer after the player has asked at least three times in the same beat.

## Requirement 2: Safety and persona

1. THE server SHALL build the prompt from story data it imports itself. The
   browser sends only the level number, beat id, a chat count, the player's
   text and recent conversation; the server SHALL NOT accept prompt text,
   hints or facts from the browser.
2. THE server SHALL reject requests whose player text exceeds 200 characters,
   whose history exceeds 8 entries or 300 characters per entry, or whose
   level/beat do not exist.
3. THE server SHALL cap model output (max tokens) and SHALL post-process every
   reply: at most 3 lines, under 200 characters, no emoji, no "Nell:" prefix.
4. WHEN a reply mentions being an AI, a model, a prompt or a company, or
   contains a URL, THE server SHALL discard it and return no reply (the
   browser shows the fallback).
5. Off-topic or jailbreak messages SHALL get a short in-character dodge.

## Requirement 3: Cost and abuse limits

1. THE server SHALL rate-limit per client IP (in memory, per instance):
   at most 12 requests per minute and 200 per day.
2. THE browser SHALL send at most one voice request at a time.
3. THE model call SHALL time out after 6 seconds.

## Requirement 4: Never break the game

1. WHEN the key is missing, the provider fails, times out, is rate-limited or
   returns an unusable reply, THE player SHALL see the fallback line.
2. THE game SHALL stay fully playable and testable with no network: the pure
   game step records a pending voice request; the UI resolves it.
3. WHILE a reply is pending, THE UI SHALL show that Nell is writing.

## Requirement 5: Configuration

1. THE key SHALL be read from the `DEEPSEEK_API_KEY` environment variable on
   Vercel and SHALL never be committed or sent to the browser.
2. THE model SHALL default to `deepseek-flash` and be overridable with
   `DEEPSEEK_MODEL`.
3. THE README SHALL explain how to configure the key and that the game works
   without it.

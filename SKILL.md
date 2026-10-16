---
name: telegram
description: Read the user's own Telegram DMs, groups, and channels (read-only). Use when the user asks to check a Telegram conversation, "what did <person> say", "my DM with <person>", "any messages from <person>", catch up on a chat, summarize a thread, "who is waiting on my reply", "did I miss anything", or list their Telegram chats. Reads as the user's own account over MTProto (GramJS), not a bot.
---

# Telegram

Logged in as the user's own account, so it reads everything they can see.
Read-only: it never sends messages. Run `./tg` from this skill's directory
(the base directory shown when the skill loads). Dependencies install on first run.

## Not logged in yet?

If a command prints `Not logged in`, the user must log in once in their own
terminal (it asks for a phone code). Tell them to run:

```
! <skill-dir>/tg login
```

## Check a conversation with someone

```
<skill-dir>/tg chat "<name or id>" [limit]
```

- `<name>` is part of the chat or person name (not case sensitive), or an exact
  chat id from `tg dialogs` (needed for chats with no name).
- `limit` is optional, default 50: the newest N messages, printed oldest first.
- Output starts with `CHAT: <name> (<type>, id=...)`, then `[MM-DD HH:MM] who: text`,
  where `who` is `me` for the user. Attachments show as `[photo]`, `[file: x.pdf]`,
  `[voice message]`, `[sticker]` etc.
- If several chats match, it lists them instead. Show the list and ask which one,
  or rerun with a more specific name.

Then answer the user's actual question from the messages (what they asked, what is
still unanswered, what the user owes them, a summary). Be concise.

Examples:
- "what did Alice send me" -> `tg chat "Alice"`
- "catch me up on the Uniswap group" -> `tg chat "Uniswap" 100`

## Who is waiting on a reply

```
<skill-dir>/tg waiting [days]
```

Default 60 days. Use this for "is anyone waiting on me", "what did I miss",
"what do I owe people". It does the whole sweep in one run (can take a few minutes,
so run it in the background):

- DMs where the other side sent the newest message, with what they sent since
  the user's last reply.
- Groups: every message since the user's last message there is read, and the ones
  that @mention them, reply to them, or say their first name or username are listed.
- Skips channels, bots, deleted accounts, the Telegram service account and Saved Messages.

Then sort the result for the user: real asks and open threads first, then old or
low-priority ones, then spam (exchange listing offers, AMA/PR pitches, cold OTC).
Drop chats where they are the one waiting on the other side. Open a chat with
`tg chat <id>` when the snippet is not enough to judge.

## List all chats

```
<skill-dir>/tg dialogs
```

Columns: `id  type  unread  last  name`, newest first (`last` = date of the newest
message). Use it to find exact names or ids.

## Custom scripts

For a query no command covers, put a `.mts` file (not `.ts`: it needs ES modules)
anywhere, import `connect` from `<skill-dir>/src/client.js` and the helpers in
`<skill-dir>/src/format.js`, and run it with `<skill-dir>/node_modules/.bin/tsx file.mts`.
Keep it read-only.

## Notes

- The saved session gives full access to the account. Never print it, and never
  show the contents of the config file or the user's `pass` entries.

## Feedback

If a command, flag, route or step in this skill is wrong, fails, or could be better, and a `feedback` command is installed (`command -v feedback`), file one short report with it. Without it, skip this. Never put keys or private data in it.

```sh
feedback skill:telegram <bug|error|idea|missing> "<title>" "<what happened, what you expected>"
```

---
name: telegram
description: Read the user's own Telegram DMs, groups, and channels (read-only). Use when the user asks to check a Telegram conversation, "what did <person> say", "my DM with <person>", "any messages from <person>", catch up on a chat, summarize a thread, or list their Telegram chats. Reads as the user's own account over MTProto (GramJS), not a bot.
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
<skill-dir>/tg chat "<name>" [limit]
```

- `<name>` is part of the chat or person name (not case sensitive).
- `limit` is optional, default 50: the newest N messages, printed oldest first.
- Output starts with `CHAT: <name> (<type>, id=...)`, then `[MM-DD HH:MM] who: text`,
  where `who` is `me` for the user.
- If several chats match, it lists them instead. Show the list and ask which one,
  or rerun with a more specific name.

Then answer the user's actual question from the messages (what they asked, what is
still unanswered, what the user owes them, a summary). Be concise.

Examples:
- "what did Alice send me" -> `tg chat "Alice"`
- "catch me up on the Uniswap group" -> `tg chat "Uniswap" 100`

## List all chats

```
<skill-dir>/tg dialogs
```

Columns: `id  type  unread  name`. Use it to find exact names.

## Notes

- The saved session gives full access to the account. Never print it, and never
  show the contents of the config file or the user's `pass` entries.

# tg-skill

A read-only Telegram skill for Claude Code (and other agents). Ask "what did Alice
say?" or "catch me up on the Uniswap group" and it reads your own Telegram chats.
It logs in as your account (not a bot), so it sees every DM, group and channel you do.
It never sends messages.

## Install

Needs Node.js 20+.

```sh
git clone https://github.com/aaronjmars/tg-skill ~/.claude/skills/telegram
~/.claude/skills/telegram/tg login
```

`login` asks for:

1. Your API id and hash. Get them at <https://my.telegram.org> -> API development tools
   (any app name works).
2. Your phone number, the code Telegram sends you, and your 2FA password if you have one.

That's it. Ask Claude about your Telegram chats.

## Commands

```sh
./tg dialogs                 # list all chats: id, type, unread, last activity, name
./tg chat "alice"            # last 50 messages with Alice
./tg chat "uniswap" 150      # last 150 messages in a group
./tg chat -5318659178        # a chat by id (from dialogs)
./tg waiting                 # who is waiting on your reply (last 60 days)
./tg waiting 14              # same, last 14 days
```

## Where your login is stored

`login` saves your API id, hash and session to `~/.config/tg-skill/config.env`
(only you can read it). The session is full access to your account, so keep that file private.

Other options, first match wins:

| Option | How |
| --- | --- |
| Env vars | `TG_API_ID`, `TG_API_HASH`, `TG_SESSION` |
| Config file | `~/.config/tg-skill/config.env`, or set `TG_CONFIG=/path/to/file` |
| [pass](https://www.passwordstore.org) | put `TG_PASS_PREFIX=tg` in the config file (or env). Reads and saves `tg/api-id`, `tg/api-hash`, `tg/session` |

To log out, end the session in Telegram (Settings -> Devices) and delete the config file.

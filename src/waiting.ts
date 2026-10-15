import { Api } from "telegram";
import { connect, finish } from "./client.js";
import { day, dialogName, dialogType, formatMessage } from "./format.js";

// Who is waiting on a reply from me, over the last N days (default 60).
// Usage: ./tg waiting [days]
//   DMs:    the other side sent the newest message. Shows what they sent since my last reply.
//   Groups: since my last message there, anything that @mentions me, replies to me,
//           or says my first name or username. Reads every message back to that point.
// Skips channels, bots, deleted accounts, the Telegram service account and Saved Messages.
const days = Number(process.argv[2] ?? 60);
if (!(days > 0)) {
  console.error("usage: ./tg waiting [days]");
  process.exit(2);
}
const MAX_DM_LINES = 8; // newest messages shown per DM
const MAX_GROUP_SCAN = 5000; // messages read per group before giving up

const cutoff = Math.floor(Date.now() / 1000) - days * 86400;
const client = await connect();

const me: any = await client.getMe();
const names = [me.firstName, me.username].filter((n) => n && n.length >= 3);
const nameRe = names.length
  ? new RegExp(`(^|[^\\p{L}\\p{N}_])@?(${names.map((n: string) => n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})($|[^\\p{L}\\p{N}_])`, "iu")
  : null;

const dmOut: string[] = [];
const groupOut: string[] = [];
const notes: string[] = [];
let scannedChats = 0;

for await (const d of client.iterDialogs({})) {
  if (!d.date || d.date < cutoff) break; // dialogs come newest first
  const e: any = d.entity;
  const type = dialogType(d);
  if (type === "channel" || e?.bot || e?.self || e?.support || e?.deleted || String(d.id) === "777000") continue;
  scannedChats++;
  const header = `### ${dialogName(d) || "(no name)"} (id=${d.id}, last ${day(d.date)}, unread ${d.unreadCount ?? 0})`;

  if (type === "dm") {
    // Newest first: collect their messages until my last reply.
    const theirs: any[] = [];
    let mine: any = null;
    for await (const m of client.iterMessages(d.id, { limit: 50 })) {
      if (m.date < cutoff) break;
      if (m.className === "MessageService") continue;
      if (m.out) {
        mine = m;
        break;
      }
      theirs.push(m);
    }
    if (!theirs.length) continue;
    const lines: string[] = [];
    if (mine) lines.push((await formatMessage(mine, 300)) ?? "");
    if (theirs.length > MAX_DM_LINES) lines.push(`(... ${theirs.length - MAX_DM_LINES} older messages from them)`);
    for (const m of theirs.slice(0, MAX_DM_LINES).reverse()) lines.push((await formatMessage(m, 500)) ?? "");
    dmOut.push(header, ...lines.filter(Boolean), "");
    continue;
  }

  // Group: read back to my last message (or the cutoff) and keep what is aimed at me.
  const hits: string[] = [];
  let read = 0;
  let reachedMine = false;
  for await (const m of client.iterMessages(d.id, { limit: MAX_GROUP_SCAN })) {
    if (m.date < cutoff) break;
    read++;
    if (m.out) {
      reachedMine = true;
      break;
    }
    if (m.className === "MessageService") continue;
    const why = m.mentioned ? " (@me/reply)" : nameRe?.test(m.message ?? "") ? " (name)" : "";
    if (why) hits.push((await formatMessage(m, 500, why)) ?? `[${day(m.date)}] (mention without text)`);
  }
  if (read >= MAX_GROUP_SCAN && !reachedMine) {
    // Too busy to read in full: fall back to Telegram's own "mentions of me" search
    // for the rest of the window (misses plain name drops, which need the full read).
    const seen = new Set(hits);
    for await (const m of client.iterMessages(d.id, { filter: new Api.InputMessagesFilterMyMentions(), limit: 200 })) {
      if (m.date < cutoff) break;
      const line = (await formatMessage(m, 500, " (@me/reply)")) ?? `[${day(m.date)}] (mention without text)`;
      if (!seen.has(line)) hits.push(line);
    }
    hits.sort((a, b) => b.localeCompare(a)); // newest first, like the full read
    notes.push(`${dialogName(d)}: read the newest ${MAX_GROUP_SCAN} messages, older ones checked for @mentions/replies only`);
  }
  if (!hits.length) continue;
  groupOut.push(`${header} - read ${read} messages since ${reachedMine ? "my last message" : `${days}d cutoff`}`, ...hits.reverse(), "");
}

console.log(`WAITING ON ME - last ${days} days, ${scannedChats} DMs/groups checked\n`);
console.log(`== DMs where they wrote last (${dmOut.filter((l) => l.startsWith("### ")).length}) ==\n`);
console.log(dmOut.join("\n") || "(none)\n");
console.log(`== Groups with mentions, replies or my name since my last message (${groupOut.filter((l) => l.startsWith("### ")).length}) ==\n`);
console.log(groupOut.join("\n") || "(none)\n");
if (notes.length) console.log(`Not fully read:\n${notes.map((n) => `- ${n}`).join("\n")}`);

await finish(client);

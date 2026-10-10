import { connect } from "./client.js";

// Fetch a conversation with someone by name (fuzzy substring match).
// Usage: ./tg chat "<name>" [limit]
//   ./tg chat "alice"        -> last 50 messages
//   ./tg chat "alice" 150    -> last 150 messages
const args = process.argv.slice(2);
const query = (args.find((a) => !/^\d+$/.test(a)) ?? "").toLowerCase();
const limit = Number(args.find((a) => /^\d+$/.test(a)) ?? 50);

if (!query) {
  console.error('usage: ./tg chat "<name>" [limit]');
  process.exit(2);
}

const client = await connect();

function dName(d: any): string {
  return (d.name ?? d.title ?? "").toString();
}

// Collect matching dialogs.
const matches: any[] = [];
for await (const d of client.iterDialogs({ limit: 300 })) {
  if (dName(d).toLowerCase().includes(query)) matches.push(d);
}

if (matches.length === 0) {
  console.log(`No chat matching "${query}".`);
  await client.disconnect();
  process.exit(0);
}

// An exact name match wins over substring matches.
const exact = matches.filter((d) => dName(d).toLowerCase() === query);
if (exact.length === 1) matches.splice(0, matches.length, exact[0]);

if (matches.length > 1) {
  console.log(`Multiple matches for "${query}" - be more specific:`);
  for (const d of matches) {
    const type = d.isChannel ? "channel" : d.isGroup ? "group" : "dm";
    console.log(`  - ${dName(d)} (${type}, id=${d.id})`);
  }
  await client.disconnect();
  process.exit(0);
}

const d = matches[0];
const type = d.isChannel ? "channel" : d.isGroup ? "group" : "dm";
console.log(`CHAT: ${dName(d)} (${type}, id=${d.id})\n`);

// iterMessages returns newest-first; buffer and reverse to read chronologically.
const buf: string[] = [];
for await (const m of client.iterMessages(d.id, { limit })) {
  if (!m.message) continue;
  const sender = await m.getSender().catch(() => null) as any;
  const who = m.out
    ? "me"
    : sender
      ? [sender.firstName, sender.lastName].filter(Boolean).join(" ") ||
        sender.title || sender.username || "them"
      : "them";
  const t = new Date(m.date * 1000).toISOString().slice(5, 16).replace("T", " ");
  buf.push(`[${t}] ${who}: ${m.message.replace(/\s+/g, " ")}`);
}
console.log(buf.reverse().join("\n"));

await client.disconnect();
process.exit(0);

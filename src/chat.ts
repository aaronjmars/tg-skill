import { connect, finish } from "./client.js";
import { dialogName, dialogType, formatMessage } from "./format.js";

// Fetch a conversation by name (fuzzy substring match) or by exact chat id.
// Usage: ./tg chat "<name or id>" [limit]
//   ./tg chat "alice"         -> last 50 messages
//   ./tg chat "alice" 150     -> last 150 messages
//   ./tg chat -5318659178     -> by id (from ./tg dialogs), useful for chats with no name
const [target = "", limitArg] = process.argv.slice(2);
const query = target.toLowerCase();
const limit = Number(limitArg ?? 50);

if (!query || !(limit > 0)) {
  console.error('usage: ./tg chat "<name or id>" [limit]');
  process.exit(2);
}

const client = await connect();

// Collect matching dialogs: an exact id wins, then an exact name, then substring matches.
const matches: any[] = [];
let byId: any = null;
for await (const d of client.iterDialogs({})) {
  if (String(d.id) === target) byId = d;
  else if (dialogName(d).toLowerCase().includes(query)) matches.push(d);
}
if (byId) matches.splice(0, matches.length, byId);

if (matches.length === 0) {
  console.log(`No chat matching "${target}".`);
  await finish(client);
}

const exact = matches.filter((d) => dialogName(d).toLowerCase() === query);
if (exact.length === 1) matches.splice(0, matches.length, exact[0]);

if (matches.length > 1) {
  console.log(`Multiple matches for "${target}" - be more specific or use the id:`);
  for (const d of matches) console.log(`  - ${dialogName(d)} (${dialogType(d)}, id=${d.id})`);
  await finish(client);
}

const d = matches[0];
console.log(`CHAT: ${dialogName(d)} (${dialogType(d)}, id=${d.id})\n`);

// iterMessages returns newest-first; buffer and reverse to read chronologically.
const buf: string[] = [];
for await (const m of client.iterMessages(d.id, { limit })) {
  const line = await formatMessage(m);
  if (line) buf.push(line);
}
console.log(buf.reverse().join("\n"));

await finish(client);

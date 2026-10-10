import { connect } from "./client.js";

// List all chats with id, type, unread count, and name.
// Usage: ./tg dialogs
const client = await connect();

const rows: string[] = [];
for await (const d of client.iterDialogs({ limit: 500 })) {
  const type = d.isChannel ? "channel" : d.isGroup ? "group" : "dm";
  const name = (d.name ?? d.title ?? "").toString().replace(/\s+/g, " ");
  rows.push(`${d.id}\t${type}\t${d.unreadCount ?? 0}\t${name}`);
}
console.log("id\ttype\tunread\tname");
console.log(rows.join("\n"));

await client.disconnect();
process.exit(0);

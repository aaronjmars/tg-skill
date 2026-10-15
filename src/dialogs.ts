import { connect } from "./client.js";
import { day, dialogName, dialogType } from "./format.js";

// List all chats, most recent first, with id, type, unread count, last activity and name.
// Usage: ./tg dialogs
const client = await connect();

const rows: string[] = [];
for await (const d of client.iterDialogs({})) {
  rows.push(`${d.id}\t${dialogType(d)}\t${d.unreadCount ?? 0}\t${d.date ? day(d.date) : "-"}\t${dialogName(d)}`);
}
console.log("id\ttype\tunread\tlast\tname");
console.log(rows.join("\n"));

await client.disconnect();
process.exit(0);

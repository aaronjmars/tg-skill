import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { makeClient } from "./client.js";
import { get, save, type Key } from "./config.js";

// One-time interactive login. Asks for the API id/hash if they are not set yet,
// then saves everything to pass (if TG_PASS_PREFIX is set) or the config file.
const rl = readline.createInterface({ input, output });
const ask = async (q: string) => (await rl.question(q)).trim();

const toSave: Partial<Record<Key, string>> = {};
let apiId = Number(get("TG_API_ID"));
let apiHash = get("TG_API_HASH");
if (!apiId || !apiHash) {
  console.log("Get your API id and hash at https://my.telegram.org -> API development tools.\n");
  apiId = Number(await ask("API id: "));
  apiHash = await ask("API hash: ");
  if (!apiId || !apiHash) {
    console.error("API id and hash are required.");
    process.exit(1);
  }
  toSave.TG_API_ID = String(apiId);
  toSave.TG_API_HASH = apiHash;
}

const client = makeClient(apiId, apiHash);
await client.start({
  phoneNumber: () => ask("Phone number (intl format, e.g. +15551234567): "),
  password: () => ask("2FA password (blank if none): "),
  phoneCode: () => ask("Login code (sent to your Telegram app): "),
  onError: (err) => console.error(err),
});
rl.close();

toSave.TG_SESSION = client.session.save() as unknown as string;
const where = save(toSave);
console.log(`\nLogged in. Saved to ${where}.`);
await client.disconnect();
process.exit(0);

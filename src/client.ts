import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions/index.js";
import { Logger, LogLevel } from "telegram/extensions/Logger.js";
import { get } from "./config.js";

export function makeClient(apiId: number, apiHash: string, session = ""): TelegramClient {
  return new TelegramClient(new StringSession(session), apiId, apiHash, {
    connectionRetries: 5,
    baseLogger: new Logger(LogLevel.ERROR),
  });
}

/** Connect using the saved session. Exits with a hint if not logged in yet. */
export async function connect(): Promise<TelegramClient> {
  const apiId = Number(get("TG_API_ID"));
  const apiHash = get("TG_API_HASH");
  const session = get("TG_SESSION");
  if (!apiId || !apiHash || !session) {
    console.error("Not logged in. Run `./tg login` in a terminal first.");
    process.exit(1);
  }
  const client = makeClient(apiId, apiHash, session);
  await client.connect();
  return client;
}

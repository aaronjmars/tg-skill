import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { parse } from "dotenv";

// Where credentials come from, first match wins:
//   1. env vars TG_API_ID, TG_API_HASH, TG_SESSION
//   2. the config file (~/.config/tg-skill/config.env, override with TG_CONFIG)
//   3. pass, only if TG_PASS_PREFIX is set (env or config file), e.g. "tg"
//      reads <prefix>/api-id, <prefix>/api-hash, <prefix>/session
export type Key = "TG_API_ID" | "TG_API_HASH" | "TG_SESSION";
const PASS_NAMES: Record<Key, string> = {
  TG_API_ID: "api-id",
  TG_API_HASH: "api-hash",
  TG_SESSION: "session",
};

const configDir = path.join(process.env.XDG_CONFIG_HOME || path.join(os.homedir(), ".config"), "tg-skill");
export const configFile = process.env.TG_CONFIG || path.join(configDir, "config.env");

function readConfigFile(): Record<string, string> {
  try {
    return parse(fs.readFileSync(configFile));
  } catch {
    return {};
  }
}
const fileConfig = readConfigFile();

export const passPrefix = (process.env.TG_PASS_PREFIX || fileConfig.TG_PASS_PREFIX || "").replace(/\/+$/, "");

function readPass(key: Key): string | undefined {
  if (!passPrefix) return undefined;
  try {
    const out = execFileSync("pass", ["show", `${passPrefix}/${PASS_NAMES[key]}`], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
    // Strip a leading "TG_SESSION=" if it was pasted in with the prefix.
    return out.split("\n")[0].trim().replace(/^TG_SESSION=/, "") || undefined;
  } catch {
    return undefined;
  }
}

export function get(key: Key): string | undefined {
  return process.env[key] || fileConfig[key] || readPass(key);
}

/** Save values to pass if a prefix is set, else to the config file (mode 600). Returns where. */
export function save(values: Partial<Record<Key, string>>): string {
  if (passPrefix) {
    for (const [k, v] of Object.entries(values)) {
      execFileSync("pass", ["insert", "-m", "-f", `${passPrefix}/${PASS_NAMES[k as Key]}`], {
        input: v,
        stdio: ["pipe", "ignore", "inherit"],
      });
    }
    return `pass (${passPrefix}/*)`;
  }
  const merged = { ...fileConfig, ...values };
  fs.mkdirSync(path.dirname(configFile), { recursive: true, mode: 0o700 });
  fs.writeFileSync(configFile, Object.entries(merged).map(([k, v]) => `${k}=${v}`).join("\n") + "\n", {
    mode: 0o600,
  });
  fs.chmodSync(configFile, 0o600);
  return configFile;
}

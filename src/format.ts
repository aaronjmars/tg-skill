// Shared helpers for printing chats and messages.

export function dialogName(d: any): string {
  return (d.name ?? d.title ?? "").toString().replace(/\s+/g, " ");
}

/** dm, group or channel. Supergroups count as groups, only broadcast channels as channels. */
export function dialogType(d: any): "dm" | "group" | "channel" {
  if (d.isUser) return "dm";
  return d.entity?.broadcast ? "channel" : "group";
}

export function day(unix: number): string {
  return new Date(unix * 1000).toISOString().slice(0, 10);
}

export function stamp(unix: number): string {
  return new Date(unix * 1000).toISOString().slice(5, 16).replace("T", " ");
}

/** Short label for a message's attachment, or "" if it has none. */
export function mediaLabel(m: any): string {
  const media = m.media;
  if (!media) return "";
  switch (media.className) {
    case "MessageMediaPhoto":
      return "[photo]";
    case "MessageMediaWebPage":
      return ""; // link preview, the link is already in the text
    case "MessageMediaPoll":
      return `[poll: ${media.poll?.question?.text ?? media.poll?.question ?? ""}]`;
    case "MessageMediaContact":
      return "[contact]";
    case "MessageMediaGeo":
    case "MessageMediaGeoLive":
    case "MessageMediaVenue":
      return "[location]";
    case "MessageMediaDocument": {
      const attrs: any[] = media.document?.attributes ?? [];
      const has = (c: string) => attrs.find((a) => a.className === c);
      if (has("DocumentAttributeSticker")) return `[sticker ${has("DocumentAttributeSticker").alt ?? ""}]`.replace(" ]", "]");
      const audio = has("DocumentAttributeAudio");
      if (audio) return audio.voice ? "[voice message]" : "[audio]";
      if (has("DocumentAttributeVideo")) return has("DocumentAttributeVideo").roundMessage ? "[video message]" : "[video]";
      if (has("DocumentAttributeAnimated")) return "[gif]";
      const file = has("DocumentAttributeFilename");
      return file ? `[file: ${file.fileName}]` : "[file]";
    }
    default:
      return "[media]";
  }
}

export async function senderName(m: any): Promise<string> {
  if (m.out) return "me";
  const s: any = await m.getSender().catch(() => null);
  if (!s) return "them";
  return [s.firstName, s.lastName].filter(Boolean).join(" ") || s.title || s.username || "them";
}

/** One message as `[MM-DD HH:MM] who: text`, or null for service messages (joins, pins). */
export async function formatMessage(m: any, maxLen = 0, tag = ""): Promise<string | null> {
  if (m.className === "MessageService") return null;
  const label = mediaLabel(m);
  let text = [label, (m.message ?? "").replace(/\s+/g, " ").trim()].filter(Boolean).join(" ");
  if (!text) return null;
  if (maxLen && text.length > maxLen) text = text.slice(0, maxLen) + "...";
  return `[${stamp(m.date)}] ${await senderName(m)}${tag}: ${text}`;
}

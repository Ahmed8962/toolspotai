/** JSON pretty-print, minify, validate — browser-native JSON.parse/stringify. */

export type JsonOk = { ok: true; value: unknown };
export type JsonErr = { ok: false; message: string };

export function tryParseJson(text: string): JsonOk | JsonErr {
  const trimmed = text.trim();
  if (trimmed === "") {
    return { ok: false, message: "Input is empty." };
  }
  try {
    return { ok: true, value: JSON.parse(trimmed) };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, message: msg };
  }
}

export function formatPretty(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

export function formatMinified(value: unknown): string {
  return JSON.stringify(value);
}

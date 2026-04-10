/** Base64 encode/decode for UTF-8 text — TextEncoder/TextDecoder + btoa/atob. */

export type B64Ok = { ok: true; value: string };
export type B64Err = { ok: false; message: string };

function utf8ToBinaryString(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return binary;
}

function binaryStringToUtf8(binary: string): string {
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

export function tryEncodeBase64(text: string): B64Ok | B64Err {
  const trimmed = text;
  if (trimmed === "") {
    return { ok: false, message: "Input is empty." };
  }
  try {
    const b64 = btoa(utf8ToBinaryString(trimmed));
    return { ok: true, value: b64 };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, message: msg };
  }
}

/** Strips whitespace so pasted wrapped or multi-line Base64 still decodes. */
export function normalizeBase64Input(raw: string): string {
  return raw.replace(/\s/g, "");
}

export function tryDecodeBase64(raw: string): B64Ok | B64Err {
  const normalized = normalizeBase64Input(raw);
  if (normalized === "") {
    return { ok: false, message: "Input is empty." };
  }
  try {
    const binary = atob(normalized);
    const text = binaryStringToUtf8(binary);
    return { ok: true, value: text };
  } catch (e) {
    const msg =
      e instanceof DOMException
        ? e.message
        : e instanceof Error
          ? e.message
          : String(e);
    return { ok: false, message: msg || "Invalid Base64." };
  }
}

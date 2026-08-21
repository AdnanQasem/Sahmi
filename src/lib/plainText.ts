const structuredTextToPlainText = (value: unknown): string => {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) {
    return value.map(structuredTextToPlainText).filter(Boolean).join("\n");
  }
  if (!value || typeof value !== "object") return "";
  const record = value as Record<string, unknown>;
  if (typeof record.text === "string") return record.text;
  if (record.type === "hardBreak") return "\n";
  return structuredTextToPlainText(record.content ?? Object.values(record));
};

export const storedContentToPlainText = (value: unknown): string => {
  if (typeof value !== "string") return structuredTextToPlainText(value).trim();
  const trimmed = value.trim();
  if (!trimmed || !["{", "[", '"'].includes(trimmed[0])) return value;
  try {
    return structuredTextToPlainText(JSON.parse(trimmed)).trim() || value;
  } catch {
    return value;
  }
};

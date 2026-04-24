/**
 * Sanitizes a filename to prevent path traversal and other security issues.
 * It removes path separators, leading dots, and illegal characters.
 */
export function sanitizeFilename(filename: string): string {
  // 1. Get the base name (handle both / and \)
  let name = filename.split(/[/\\]/).pop() || "";

  // 2. Remove leading dots (to prevent hidden files and ./ ../)
  name = name.replace(/^\.+/, "");

  // 3. Remove characters that are illegal in filenames on common OSs
  // < > : " / \ | ? *
  // Also remove control characters
  name = name.replace(/[<>:"/\\|?*\x00-\x1F]/g, "");

  // 4. If empty after sanitization, provide a fallback
  if (!name) {
    return "uploaded-file";
  }

  // 5. Limit length to avoid issues with extremely long paths (e.g. 255 chars)
  return name.slice(0, 255);
}

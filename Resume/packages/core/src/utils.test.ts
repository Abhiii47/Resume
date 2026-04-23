import { test } from "node:test";
import assert from "node:assert";
import { sanitizeFilename } from "./sanitization.ts";

test("sanitizeFilename - basic filename", () => {
  assert.strictEqual(sanitizeFilename("resume.pdf"), "resume.pdf");
});

test("sanitizeFilename - path traversal with forward slashes", () => {
  assert.strictEqual(sanitizeFilename("../../../etc/passwd"), "passwd");
  assert.strictEqual(sanitizeFilename("/etc/passwd"), "passwd");
});

test("sanitizeFilename - path traversal with backward slashes", () => {
  assert.strictEqual(sanitizeFilename("..\\..\\..\\windows\\system32\\cmd.exe"), "cmd.exe");
  assert.strictEqual(sanitizeFilename("C:\\windows\\system32\\cmd.exe"), "cmd.exe");
});

test("sanitizeFilename - leading dots", () => {
  assert.strictEqual(sanitizeFilename(".htaccess"), "htaccess");
  assert.strictEqual(sanitizeFilename("..bashrc"), "bashrc");
});

test("sanitizeFilename - illegal characters", () => {
  assert.strictEqual(sanitizeFilename("file<name>.pdf"), "filename.pdf");
  assert.strictEqual(sanitizeFilename('my"file"?|*.txt'), "myfile.txt");
});

test("sanitizeFilename - empty after sanitization", () => {
  assert.strictEqual(sanitizeFilename(""), "uploaded-file");
  assert.strictEqual(sanitizeFilename("/"), "uploaded-file");
  assert.strictEqual(sanitizeFilename(".."), "uploaded-file");
  assert.strictEqual(sanitizeFilename("...///"), "uploaded-file");
});

test("sanitizeFilename - very long filename", () => {
  const longName = "a".repeat(300) + ".pdf";
  const sanitized = sanitizeFilename(longName);
  assert.ok(sanitized.length <= 255);
  assert.ok(sanitized.startsWith("a"));
});

test("sanitizeFilename - spaces and normal special chars", () => {
  assert.strictEqual(sanitizeFilename("my resume (v1).pdf"), "my resume (v1).pdf");
  assert.strictEqual(sanitizeFilename("resume_2023.pdf"), "resume_2023.pdf");
});

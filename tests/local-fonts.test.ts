/**
 * Local-font safeguards for the site's typefaces.
 *
 * The site's fonts are committed to the project and served by this
 * computer's own server: the headline face (Asap) and the body face
 * (Inter) both live in src/app/fonts/ and are loaded through
 * `next/font/local` in src/lib/fonts.ts. Nothing may be fetched from
 * the internet — no remote font service, no remote stylesheet, no
 * `@import` — and the font files must stay in the project with their
 * licence text beside them.
 *
 * The checks are:
 *
 * 1. no stylesheet in src/ uses `@import`;
 * 2. no stylesheet in src/ pulls in a remote resource (a `url()` with
 *    an http, https or protocol-relative address), and no source file
 *    imports a remote font loader (`next/font/google`) or names a
 *    remote font host;
 * 3. `headingFont` points at the committed Asap file under
 *    src/app/fonts/, that file exists and really is the Asap family,
 *    and `bodyFont` still points at the committed Inter file;
 * 4. exactly one new font family (Asap) is committed beside the body
 *    font, the licence text of the headline font is saved in
 *    src/app/fonts/ and carries the SIL Open Font License's
 *    "PERMISSION & CONDITIONS" section, and a note records the font's
 *    source, version and date;
 * 5. no download leftovers (archives, temporary or partial files) are
 *    left anywhere in the project.
 *
 * Node-only: it reads files and does arithmetic. It never launches a
 * browser.
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const projectRoot = process.cwd();
const srcRoot = path.join(projectRoot, "src");
const fontsRoot = path.join(srcRoot, "app", "fonts");
const fontsModulePath = path.join(srcRoot, "lib", "fonts.ts");
const fontsSource = readFileSync(fontsModulePath, "utf8");

/** Folders that hold generated or installed dependencies, not source. */
const ignoredFolders = new Set([
  "node_modules",
  ".git",
  ".next",
  ".elara-dependencies",
  "coverage",
]);

/**
 * Every file under a folder, as paths relative to the project root.
 * `skip` names folders that are not project source.
 */
function listFiles(folder: string, skip: ReadonlySet<string>): string[] {
  const found: string[] = [];
  for (const entry of readdirSync(folder, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (skip.has(entry.name)) continue;
      found.push(...listFiles(path.join(folder, entry.name), skip));
    } else if (entry.isFile()) {
      found.push(path.relative(projectRoot, path.join(folder, entry.name)));
    }
  }
  return found;
}

/** The source files a stylesheet or a font loader could hide in. */
const codeExtensions = new Set([
  ".css",
  ".scss",
  ".sass",
  ".less",
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
]);

const srcFiles = listFiles(srcRoot, ignoredFolders);
const codeFiles = srcFiles.filter((file) =>
  codeExtensions.has(path.extname(file).toLowerCase()),
);
const styleFiles = codeFiles.filter((file) => file.endsWith(".css"));

/** One `localFont` call as it is written in src/lib/fonts.ts. */
interface LocalFontCall {
  /** The font file path, relative to src/lib/. */
  readonly src: string;
  /** The CSS custom property the font is exposed through. */
  readonly variable: string;
}

/**
 * Reads one `localFont` call out of src/lib/fonts.ts.
 *
 * The module is read as source rather than imported: `next/font/local`
 * is a build-time loader target, so the font file it names only exists
 * inside Next's compiler, and the published types do not carry it.
 */
function readLocalFontCall(name: string): LocalFontCall {
  const pattern = new RegExp(
    `export const ${name} = localFont\\(\\{([\\s\\S]*?)\\}\\);`,
  );
  const match = pattern.exec(fontsSource);
  expect(match, `${name} must be declared with localFont in src/lib/fonts.ts`)
    .not.toBeNull();
  const body = match?.[1] ?? "";
  const src = /src:\s*"([^"]+)"/.exec(body)?.[1] ?? "";
  const variable = /variable:\s*"([^"]+)"/.exec(body)?.[1] ?? "";
  return { src, variable };
}

/** Resolves a font path written in src/lib/fonts.ts to a file on disk. */
function resolveFontFile(src: string): string {
  return path.resolve(path.dirname(fontsModulePath), src);
}

/**
 * The family name recorded in a TrueType font file's own `name` table,
 * so the test checks the committed font and not only its file name.
 */
function readFontFamily(file: string): string {
  const bytes = readFileSync(file);
  const readU16 = (offset: number): number => bytes.readUInt16BE(offset);
  const readU32 = (offset: number): number => bytes.readUInt32BE(offset);

  let nameTableOffset = -1;
  for (let index = 0; index < readU16(4); index += 1) {
    const record = 12 + index * 16;
    if (bytes.toString("latin1", record, record + 4) === "name") {
      nameTableOffset = readU32(record + 8);
    }
  }
  expect(nameTableOffset, `${file} must have a name table`).toBeGreaterThan(-1);

  const count = readU16(nameTableOffset + 2);
  const stringOffset = nameTableOffset + readU16(nameTableOffset + 4);
  let family = "";
  for (let index = 0; index < count; index += 1) {
    const record = nameTableOffset + 6 + index * 12;
    const platformId = readU16(record);
    const encodingId = readU16(record + 2);
    const languageId = readU16(record + 4);
    const nameId = readU16(record + 6);
    const length = readU16(record + 8);
    const offset = readU16(record + 10);
    const isWindowsUnicode =
      platformId === 3 && encodingId === 1 && languageId === 0x409;
    if (!isWindowsUnicode || nameId !== 1) continue;
    let text = "";
    for (let index2 = 0; index2 < length; index2 += 2) {
      text += String.fromCharCode(readU16(stringOffset + offset + index2));
    }
    family = text;
  }
  return family;
}

/** Remote hosts that serve fonts or stylesheets. */
const remoteFontHosts = [
  "fonts.googleapis.com",
  "fonts.gstatic.com",
  "ajax.googleapis.com",
  "use.typekit.net",
  "cdn.jsdelivr.net",
  "unpkg.com",
  "fonts.fontawesome.com",
];

describe("local fonts", () => {
  it("uses no @import in any stylesheet under src/", () => {
    const offenders: string[] = [];
    for (const file of styleFiles) {
      const contents = readFileSync(path.join(projectRoot, file), "utf8");
      const withoutComments = contents.replace(/\/\*[\s\S]*?\*\//g, " ");
      if (/@import/i.test(withoutComments)) offenders.push(file);
    }
    expect(
      offenders,
      `no stylesheet may use @import (offenders: ${offenders.join(", ")})`,
    ).toEqual([]);
  });

  it("loads no remote font or stylesheet address from src/", () => {
    const offenders: string[] = [];
    for (const file of codeFiles) {
      const contents = readFileSync(path.join(projectRoot, file), "utf8");
      const withoutComments = contents.replace(/\/\*[\s\S]*?\*\//g, " ");
      const withoutLineComments = withoutComments.replace(/\/\/[^\n]*/g, " ");
      const problems: string[] = [];

      if (/url\(\s*['"]?(https?:)?\/\//i.test(withoutLineComments)) {
        problems.push("a url() with a remote address");
      }
      if (/next\/font\/(google|google-.*)/i.test(withoutLineComments)) {
        problems.push("a remote font loader");
      }
      if (/@import\s+['"]?(https?:)?\/\//i.test(withoutLineComments)) {
        problems.push("a remote @import");
      }
      for (const host of remoteFontHosts) {
        if (withoutLineComments.toLowerCase().includes(host)) {
          problems.push(`the remote host ${host}`);
        }
      }

      if (problems.length > 0) {
        offenders.push(`${file} (${problems.join("; ")})`);
      }
    }
    expect(
      offenders,
      `nothing in src/ may load a font or stylesheet from the internet (offenders: ${offenders.join(
        "; ",
      )})`,
    ).toEqual([]);
  });

  it("points the headings at the committed headline font file", () => {
    const heading = readLocalFontCall("headingFont");
    expect(
      heading.src,
      "the heading font file lives in src/app/fonts/",
    ).toContain("../app/fonts/");
    expect(
      heading.src.toLowerCase(),
      "the heading font file is the Asap file",
    ).toContain("asap");
    expect(heading.variable, "the heading face is exposed as --font-heading").toBe(
      "--font-heading",
    );

    const resolved = resolveFontFile(heading.src);
    expect(
      existsSync(resolved),
      `the heading font file ${heading.src} must be committed`,
    ).toBe(true);
    expect(
      path.resolve(fontsRoot),
      "the heading font file is committed under src/app/fonts/",
    ).toBe(path.dirname(resolved));
    expect(
      readFontFamily(resolved),
      "the committed heading font file is the Asap family",
    ).toBe("Asap");
  });

  it("keeps the body text in the committed Inter file", () => {
    const body = readLocalFontCall("bodyFont");
    expect(body.src.toLowerCase(), "the body font is Inter").toContain("inter");
    expect(body.variable, "the body face is exposed as --font-body").toBe(
      "--font-body",
    );

    const resolved = resolveFontFile(body.src);
    expect(
      existsSync(resolved),
      `the body font file ${body.src} must be committed`,
    ).toBe(true);
    expect(
      path.resolve(fontsRoot),
      "the body font file is committed under src/app/fonts/",
    ).toBe(path.dirname(resolved));
    expect(
      readFontFamily(resolved),
      "the committed body font file is the Inter family",
    ).toMatch(/^Inter/);
  });

  it("commits exactly one new font family beside the body font", () => {
    const families = new Set<string>();
    for (const name of readdirSync(fontsRoot)) {
      if (!/\.(ttf|otf|woff2?)$/i.test(name)) continue;
      families.add(readFontFamily(path.join(fontsRoot, name)));
    }
    const newFamilies = [...families].filter(
      (family) => !/^Inter/i.test(family),
    );
    expect(
      newFamilies,
      "exactly one new font family is committed beside the body font",
    ).toEqual(["Asap"]);
  });

  it("saves the headline font's licence text and a source note beside it", () => {
    const folderFiles = readdirSync(fontsRoot);
    const textFiles = folderFiles.filter((name) => /\.(txt|md)$/i.test(name));
    const texts = new Map(
      textFiles.map((name) => [name, readFileSync(path.join(fontsRoot, name), "utf8")]),
    );

    const licenceTexts = [...texts.values()].filter((text) =>
      text.includes("PERMISSION & CONDITIONS"),
    );
    expect(
      licenceTexts.length,
      "the SIL Open Font License text with its PERMISSION & CONDITIONS section is saved in src/app/fonts/",
    ).toBeGreaterThan(0);

    const notes = [...texts.entries()].filter(
      ([, text]) => /source/i.test(text) && /version/i.test(text) && /date/i.test(text),
    );
    expect(
      notes.length,
      "a note in src/app/fonts/ records the font's source, version and date",
    ).toBeGreaterThan(0);
    const headlineNote = notes.find(([, text]) => /asap/i.test(text));
    expect(
      headlineNote,
      "the note describes the headline font",
    ).toBeDefined();
    expect(
      (headlineNote?.[1] ?? "").toLowerCase(),
      "the note records a date",
    ).toMatch(/\b20\d{2}\b/);
  });

  it("leaves no download leftovers in the project", () => {
    const leftovers: string[] = [];
    const leftoverExtensions = [
      ".zip",
      ".tgz",
      ".tar",
      ".tar.gz",
      ".tmp",
      ".temp",
      ".part",
      ".crdownload",
      ".download",
    ];
    for (const file of listFiles(projectRoot, ignoredFolders)) {
      const lower = file.toLowerCase();
      if (leftoverExtensions.some((extension) => lower.endsWith(extension))) {
        leftovers.push(file);
      }
    }
    expect(
      leftovers,
      `no archives or temporary downloads may stay in the project (found: ${leftovers.join(
        ", ",
      )})`,
    ).toEqual([]);
  });

  it("keeps the font files themselves readable and non-empty", () => {
    for (const name of readdirSync(fontsRoot)) {
      const full = path.join(fontsRoot, name);
      if (!statSync(full).isFile()) continue;
      if (!/\.(ttf|otf|woff2?)$/i.test(name)) continue;
      expect(
        statSync(full).size,
        `${name} must not be an empty file`,
      ).toBeGreaterThan(0);
    }
  });
});

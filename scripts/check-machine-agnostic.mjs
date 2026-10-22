// Portability guard (part of `pnpm lint`): the repository must not contain host-, user- or operator-specific
// data (machine names, home paths, local scheduler jobs, device serials) or references to a specific agent setup.
// Anyone must be able to clone the repo and work with it. Policy: AGENTS.md (Hard rules).
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

/** Leading word boundary that works in both POSIX ERE (`git grep -E`) and JavaScript regular expressions. */
const START = "(^|[^a-z0-9])";

/**
 * Case-insensitive extended regular expressions, checked with `git grep` over tracked files. `hits` and `misses`
 * are injected samples verified on every run (self-test), so a broken pattern fails loudly instead of passing.
 * Only generic shapes live here; names tied to one specific setup are private terms (see below).
 */
const PATTERNS = [
  {
    label: "absolute home or temp path",
    pattern: "/Users/[A-Za-z]|/home/[a-z_][a-z0-9_-]*/|/private/tmp/",
    hits: [
      ["", "Users", "someone", "projects"].join("/"),
      "/home/alice/projects",
      "/private/tmp/wt",
    ],
    misses: ["see docs/home.md", "/home/"],
  },
  {
    label: "device serial or local AVD",
    pattern: "emulator-[0-9]{4}|Pixel_[0-9]",
    hits: ["adb -s emulator-5556", "Pixel_10a"],
    misses: ["adb -s <emulator-serial>"],
  },
  {
    label: "agent setup",
    pattern: "\\.[a-z0-9_-]+/(worktrees|sessions)/",
    hits: ["~/.some-agent/worktrees/repo", "see .tool/sessions/abc"],
    misses: [
      ".github/workflows/ci.yml",
      "git worktree add ../wt",
      "docs/sessions/",
      "agent-device",
    ],
  },
  {
    label: "team role",
    pattern: `${START}(product owner|[a-z]+er bot)([^a-z0-9]|$)`,
    hits: ["Product Owner review", "the Developer bot", "ask the tester bot"],
    misses: [
      "a reviewer squash-merges",
      "developer build",
      "web developers",
      "an agent or bot setup",
      "register both",
    ],
  },
];

/**
 * Private terms (host, user, role and tool names of one specific setup) must not be committed, not even here, so they
 * are read from a file outside the repository: `~/.budget-lens-local/forbidden-terms.json` by default, or the file
 * named by the `MACHINE_AGNOSTIC_TERMS_FILE` env var. Format: `{ "terms": [...] }` (template:
 * `scripts/forbidden-terms.example.json`). Terms match literally and case-insensitively. Without the default file
 * (e.g. in CI) this part is skipped with a note and the generic patterns above still run. A file named by the env var
 * must exist (a missing one is most likely a typo), and an unreadable file fails the check with one clear line.
 */
const TERMS_FILE_ENV = "MACHINE_AGNOSTIC_TERMS_FILE";
const DEFAULT_TERMS_FILE = join(homedir(), ".budget-lens-local", "forbidden-terms.json");

/** Self-test for the private-terms matcher, with placeholder terms only. */
const PRIVATE_TERMS_SAMPLE = {
  terms: ["example-host", "Example Tool", "ex.ample"],
  hits: ["built on EXAMPLE-HOST", "run it with example tool", "see ex.ample/x", "example-hosting"],
  misses: ["an example host", "exXample", "example_tool"],
};

/**
 * The private terms to check as `{ terms }`, a skip as `{ skip: reason }`, or a failure as `{ error: message }`.
 * `read(file)` returns the file content, or `undefined` when the file does not exist (injected for the self-test).
 * Messages never quote the file content, so no term can leak into a log.
 */
function resolvePrivateTerms({ file, explicit, read }) {
  const text = read(file);
  if (text === undefined) {
    return missingTermsFile(file, explicit);
  }
  const parsed = termsFromText(text);
  if (typeof parsed === "string") {
    return { error: `Private terms file ${parsed}: ${file}` };
  }
  const terms = [...new Set(parsed.map((term) => String(term).trim()).filter(Boolean))];
  return terms.length > 0 ? { terms } : { skip: `no terms in ${file}` };
}

/** A missing default file is skipped; a missing file named by the env var is most likely a typo, so it fails. */
function missingTermsFile(file, explicit) {
  return explicit
    ? { error: `${TERMS_FILE_ENV} names a file that does not exist: ${file}` }
    : { skip: `no local terms file (see ${TERMS_FILE_ENV})` };
}

/** The `terms` array of a terms file's content, or the problem as a short phrase. */
function termsFromText(text) {
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    return "is not valid JSON";
  }
  return Array.isArray(data?.terms) ? data.terms : 'must look like { "terms": ["..."] }';
}

function readIfExists(file) {
  return existsSync(file) ? readFileSync(file, "utf8") : undefined;
}

/** Self-test cases for `resolvePrivateTerms`: the skip, failure and success paths, with placeholder content. */
const PRIVATE_TERMS_FILE_CASES = [
  {
    name: "default file missing (CI) skips",
    explicit: false,
    content: undefined,
    expected: "skip",
  },
  {
    name: "explicitly named file missing fails",
    explicit: true,
    content: undefined,
    expected: "error",
  },
  { name: "malformed JSON fails", explicit: false, content: '{ "terms": [', expected: "error" },
  {
    name: "missing terms array fails",
    explicit: false,
    content: '{ "names": [] }',
    expected: "error",
  },
  {
    name: "non-array terms fails",
    explicit: false,
    content: '{ "terms": "x" }',
    expected: "error",
  },
  {
    name: "empty terms skips",
    explicit: false,
    content: '{ "terms": [" ", ""] }',
    expected: "skip",
  },
  {
    name: "valid file returns trimmed unique terms",
    explicit: true,
    content: '{ "terms": [" example-host ", "example-host", "example-tool"] }',
    expected: "terms",
    terms: ["example-host", "example-tool"],
  },
];

function privateTermsFileFailures() {
  return PRIVATE_TERMS_FILE_CASES.flatMap(({ name, explicit, content, expected, terms }) => {
    const result = resolvePrivateTerms({ file: "terms.json", explicit, read: () => content });
    const outcome = Object.keys(result)[0];
    if (outcome !== expected) {
      return [`private terms file, ${name}: expected ${expected}, got ${outcome}`];
    }
    if (terms && JSON.stringify(result.terms) !== JSON.stringify(terms)) {
      return [`private terms file, ${name}: unexpected terms ${JSON.stringify(result.terms)}`];
    }
    return [];
  });
}

/** An ERE (`git grep -E`) and JavaScript pattern matching any of `terms` literally, also inside longer words. */
function privateTermsPattern(terms) {
  return terms.map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
}

/** GitHub configuration may name `agent:*` labels; everything else may not. */
const LABEL = {
  label: "agent label",
  pattern: "agent:[a-z]",
  hits: ["`agent:developer`"],
  misses: ["`agent.act()`", "agent-device"],
};

/**
 * The Expo app config must not name an Expo account: `eas init` writes `expo.owner`, but since SDK 53 EAS identifies
 * the project by `extra.eas.projectId` alone (docs/release/testflight.md). A key check, because the word "owner" is
 * fine elsewhere. `hits` and `misses` are self-tested like the patterns above.
 */
const APP_CONFIG = {
  label: "Expo account name (expo.owner)",
  file: "apps/mobile/app.json",
  hits: [{ expo: { name: "App", owner: "some-account" } }, { expo: { owner: "" } }],
  misses: [
    {
      expo: { name: "App", extra: { eas: { projectId: "00000000-0000-0000-0000-000000000000" } } },
    },
    { expo: { name: "App" } },
  ],
};

function hasExpoOwner(config) {
  return Object.hasOwn(config?.expo ?? {}, "owner");
}

const ALWAYS_EXCLUDED = [
  ":(exclude)scripts/check-machine-agnostic.mjs",
  ":(exclude)pnpm-lock.yaml",
];

/** Samples whose match result differs from `expected`, as readable failure lines. */
function mismatches({ label, pattern }, samples, expected) {
  const regex = new RegExp(pattern, "i");
  return samples
    .filter((sample) => regex.test(sample) !== expected)
    .map(
      (sample) =>
        `${label}: ${expected ? "expected a hit" : "unexpected hit"} for ${JSON.stringify(sample)}`,
    );
}

/**
 * Findings of the grep-based checks plus notes. `grepLines(pattern, extraExcludes)` returns the matching lines
 * (injected for the self-test). A skipped private-terms check only adds a note; the other checks still run.
 */
function grepFindings(privateTerms, grepLines) {
  const findings = [];
  const notes = [];
  for (const { label, pattern } of PATTERNS) {
    findings.push(...grepLines(pattern, []).map((line) => `${label}: ${line}`));
  }
  if (privateTerms.terms) {
    const pattern = privateTermsPattern(privateTerms.terms);
    findings.push(...grepLines(pattern, []).map((line) => `private term: ${line}`));
  } else {
    notes.push(`Private-terms check skipped: ${privateTerms.skip}.`);
  }
  findings.push(
    ...grepLines(LABEL.pattern, [":(exclude).github/**"]).map((line) => `${LABEL.label}: ${line}`),
  );
  return { findings, notes };
}

/** Self-test of the skip path: with no terms file, there is one note and every generic check still reports. */
function skipPathFailures() {
  const { findings, notes } = grepFindings({ skip: "no local terms file" }, () => [
    "docs/x.md:1:sample",
  ]);
  const expectedLabels = [...PATTERNS, LABEL].map(({ label }) => label);
  const failures = [];
  if (notes.length !== 1 || !notes[0].startsWith("Private-terms check skipped")) {
    failures.push(`skip path: expected one skip note, got ${JSON.stringify(notes)}`);
  }
  const labels = findings.map((finding) => finding.split(": ")[0]);
  if (JSON.stringify(labels) !== JSON.stringify(expectedLabels)) {
    failures.push(
      `skip path: expected findings from ${expectedLabels.join(", ")}, got ${labels.join(", ")}`,
    );
  }
  return failures;
}

function selfTest() {
  const appConfigFailures = [
    ...APP_CONFIG.hits.filter((sample) => !hasExpoOwner(sample)).map((s) => ["expected a hit", s]),
    ...APP_CONFIG.misses.filter((sample) => hasExpoOwner(sample)).map((s) => ["unexpected hit", s]),
  ].map(([problem, sample]) => `${APP_CONFIG.label}: ${problem} for ${JSON.stringify(sample)}`);
  return [
    ...[...PATTERNS, LABEL].flatMap((entry) => [
      ...mismatches(entry, entry.hits, true),
      ...mismatches(entry, entry.misses, false),
    ]),
    ...appConfigFailures,
    ...privateTermsFileFailures(),
    ...skipPathFailures(),
    ...[true, false].flatMap((expected) =>
      mismatches(
        { label: "private terms", pattern: privateTermsPattern(PRIVATE_TERMS_SAMPLE.terms) },
        expected ? PRIVATE_TERMS_SAMPLE.hits : PRIVATE_TERMS_SAMPLE.misses,
        expected,
      ),
    ),
  ];
}

function grep(pattern, extraExcludes) {
  try {
    return execFileSync(
      "git",
      [
        "grep",
        "-n",
        "-I",
        "-i",
        "-E",
        "-e",
        pattern,
        "--",
        ".",
        ...ALWAYS_EXCLUDED,
        ...extraExcludes,
      ],
      { encoding: "utf8" },
    );
  } catch (error) {
    // `git grep` exits 1 when nothing matches.
    if (error.status === 1) {
      return "";
    }
    throw error;
  }
}

const selfTestFailures = selfTest();
if (selfTestFailures.length > 0) {
  process.stderr.write(`Portability check self-test failed:\n${selfTestFailures.join("\n")}\n`);
  process.exit(1);
}

const privateTerms = resolvePrivateTerms({
  file: process.env[TERMS_FILE_ENV] || DEFAULT_TERMS_FILE,
  explicit: Boolean(process.env[TERMS_FILE_ENV]),
  read: readIfExists,
});
if (privateTerms.error) {
  process.stderr.write(`Portability check failed: ${privateTerms.error}\n`);
  process.exit(1);
}
const { findings, notes } = grepFindings(privateTerms, (pattern, extraExcludes) =>
  grep(pattern, extraExcludes).split("\n").filter(Boolean),
);
for (const note of notes) {
  process.stdout.write(`${note}\n`);
}

if (
  existsSync(APP_CONFIG.file) &&
  hasExpoOwner(JSON.parse(readFileSync(APP_CONFIG.file, "utf8")))
) {
  findings.push(
    `${APP_CONFIG.label}: ${APP_CONFIG.file} sets "owner"; commit only extra.eas.projectId`,
  );
}

if (findings.length > 0) {
  process.stderr.write(
    `Machine- or operator-specific content found (see AGENTS.md, Hard rules):\n${findings.join("\n")}\n`,
  );
  process.exit(1);
}
process.stdout.write(
  "Portability check passed: no host-, user- or agent-setup-specific content.\n",
);

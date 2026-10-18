// License gate (CI job `licenses`): every installed production and dev dependency must use a license
// compatible with the MIT-licensed core. Fails on copyleft (GPL/AGPL/LGPL…), unknown or missing licenses.
// Policy and how to add an exception: docs/ci.md#licenses
import { execFileSync } from "node:child_process";

/** SPDX ids compatible with MIT distribution. */
const ALLOWED = new Set([
  "MIT",
  "MIT-0",
  "ISC",
  "BSD-2-Clause",
  "BSD-3-Clause",
  "Apache-2.0",
  "0BSD",
  "CC0-1.0",
  "CC-BY-4.0",
  "Unlicense",
  "BlueOak-1.0.0",
  "Python-2.0",
]);

/**
 * Reviewed exceptions: a package name pattern plus the exact license it was reviewed with, and the reason.
 * Add an entry only in a PR that explains why the package is acceptable.
 */
const EXCEPTIONS = [
  {
    name: /^lightningcss(-[a-z0-9-]+)?$/,
    license: "MPL-2.0",
    reason:
      "file-level copyleft only; dev-only transitive dependency of Vite (Vitest), never modified or shipped in the app",
  },
];

/** Accepts a simple SPDX expression: any `OR` alternative whose `AND` parts are all allowed. */
function isAllowed(license) {
  const expression = license.replaceAll(/[()]/g, " ").trim();
  if (expression === "") {
    return false;
  }
  return expression
    .split(/\s+OR\s+/)
    .some((alternative) => alternative.split(/\s+AND\s+/).every((id) => ALLOWED.has(id.trim())));
}

const output = execFileSync("pnpm", ["licenses", "list", "--recursive", "--json"], {
  encoding: "utf8",
  maxBuffer: 64 * 1024 * 1024,
});
const byLicense = JSON.parse(output);

const violations = [];
let checked = 0;
for (const [license, packages] of Object.entries(byLicense)) {
  for (const pkg of packages) {
    checked += 1;
    if (isAllowed(license)) {
      continue;
    }
    const exception = EXCEPTIONS.find(
      (entry) => entry.license === license && entry.name.test(pkg.name),
    );
    if (exception) {
      console.log(
        `exception: ${pkg.name}@${pkg.versions.join(",")} (${license}): ${exception.reason}`,
      );
      continue;
    }
    violations.push(`${pkg.name}@${pkg.versions.join(",")}: ${license || "missing license"}`);
  }
}

if (violations.length > 0) {
  console.error(`Disallowed or unknown licenses (${violations.length}):`);
  for (const violation of violations) {
    console.error(`  ${violation}`);
  }
  process.exit(1);
}
console.log(`All ${checked} dependencies use allowed licenses.`);

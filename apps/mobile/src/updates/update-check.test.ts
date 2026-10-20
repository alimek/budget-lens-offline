import { describe, expect, it } from "vitest";
import { checkForUpdateInBackground } from "./update-check";

const releaseBuild = { enabled: true, development: false, channel: "production" } as const;

function client(options: {
  available?: boolean;
  isNew?: boolean;
  checkError?: Error;
  fetchError?: Error;
}) {
  const calls: string[] = [];
  return {
    calls,
    checkForUpdate: async () => {
      calls.push("check");
      if (options.checkError) throw options.checkError;
      return { isAvailable: options.available ?? false };
    },
    fetchUpdate: async () => {
      calls.push("fetch");
      if (options.fetchError) throw options.fetchError;
      return { isNew: options.isNew ?? true };
    },
  };
}

describe("checkForUpdateInBackground", () => {
  it("downloads an available update so it applies on the next launch", async () => {
    const updates = client({ available: true });

    const outcome = await checkForUpdateInBackground(releaseBuild, updates);

    expect(outcome).toBe("downloaded");
    expect(updates.calls).toEqual(["check", "fetch"]);
  });

  it("downloads nothing when the build already runs the latest update", async () => {
    const updates = client({ available: false });

    const outcome = await checkForUpdateInBackground(releaseBuild, updates);

    expect(outcome).toBe("up-to-date");
    expect(updates.calls).toEqual(["check"]);
  });

  it("keeps the current bundle when the device is offline", async () => {
    const updates = client({
      checkError: new Error("The Internet connection appears to be offline."),
    });

    const outcome = await checkForUpdateInBackground(releaseBuild, updates);

    expect(outcome).toBe("failed");
  });

  it("keeps the current bundle when the download fails", async () => {
    const updates = client({ available: true, fetchError: new Error("Network request failed") });

    const outcome = await checkForUpdateInBackground(releaseBuild, updates);

    expect(outcome).toBe("failed");
  });

  it.each([
    ["development bundles", { ...releaseBuild, development: true }],
    ["binaries without expo-updates enabled", { ...releaseBuild, enabled: false }],
    ["local builds without an EAS channel", { ...releaseBuild, channel: null }],
  ])("does not touch the network in %s", async (_name, environment) => {
    const updates = client({ available: true });

    const outcome = await checkForUpdateInBackground(environment, updates);

    expect(outcome).toBe("skipped");
    expect(updates.calls).toEqual([]);
  });
});

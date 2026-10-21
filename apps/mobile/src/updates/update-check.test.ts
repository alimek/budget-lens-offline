import { describe, expect, it } from "vitest";
import { checkForUpdateInBackground } from "./update-check";

const releaseBuild = { enabled: true, development: false, channel: "production" } as const;

function client(options: {
  available?: boolean;
  rollBackRequested?: boolean;
  isNew?: boolean;
  rollBackFetched?: boolean;
  checkError?: Error;
  fetchError?: Error;
}) {
  const calls: string[] = [];
  return {
    calls,
    checkForUpdate: async () => {
      calls.push("check");
      if (options.checkError) throw options.checkError;
      const rollBackRequested = options.rollBackRequested ?? false;
      return {
        isAvailable: rollBackRequested ? false : (options.available ?? false),
        isRollBackToEmbedded: rollBackRequested,
      };
    },
    fetchUpdate: async () => {
      calls.push("fetch");
      if (options.fetchError) throw options.fetchError;
      const rollBackFetched = options.rollBackFetched ?? false;
      return {
        isNew: rollBackFetched ? false : (options.isNew ?? true),
        isRollBackToEmbedded: rollBackFetched,
      };
    },
  };
}

describe("checkForUpdateInBackground", () => {
  it("downloads an available update so it applies on the next launch", async () => {
    // Arrange
    const updates = client({ available: true });

    // Act
    const outcome = await checkForUpdateInBackground(releaseBuild, updates);

    // Assert
    expect(outcome).toBe("downloaded");
    expect(updates.calls).toEqual(["check", "fetch"]);
  });

  it("stores a roll-back-to-embedded directive so the embedded bundle runs on the next launch", async () => {
    // Arrange - the server reports a rollback with isAvailable: false, and only the fetch stores it
    const updates = client({ rollBackRequested: true, rollBackFetched: true });

    // Act
    const outcome = await checkForUpdateInBackground(releaseBuild, updates);

    // Assert
    expect(outcome).toBe("rolled-back-to-embedded");
    expect(updates.calls).toEqual(["check", "fetch"]);
  });

  it("downloads nothing when the build already runs the latest update", async () => {
    // Arrange
    const updates = client({ available: false });

    // Act
    const outcome = await checkForUpdateInBackground(releaseBuild, updates);

    // Assert
    expect(outcome).toBe("up-to-date");
    expect(updates.calls).toEqual(["check"]);
  });

  it("keeps the current bundle when the device is offline", async () => {
    // Arrange
    const updates = client({
      checkError: new Error("The Internet connection appears to be offline."),
    });

    // Act
    const outcome = await checkForUpdateInBackground(releaseBuild, updates);

    // Assert
    expect(outcome).toBe("failed");
    expect(updates.calls).toEqual(["check"]);
  });

  it("keeps the current bundle when the download fails", async () => {
    // Arrange
    const updates = client({ available: true, fetchError: new Error("Network request failed") });

    // Act
    const outcome = await checkForUpdateInBackground(releaseBuild, updates);

    // Assert
    expect(outcome).toBe("failed");
  });

  it.each([
    ["development bundles", { ...releaseBuild, development: true }],
    ["binaries without expo-updates enabled", { ...releaseBuild, enabled: false }],
    ["local builds without an EAS channel", { ...releaseBuild, channel: null }],
  ])("does not touch the network in %s", async (_name, environment) => {
    // Arrange
    const updates = client({ available: true });

    // Act
    const outcome = await checkForUpdateInBackground(environment, updates);

    // Assert
    expect(outcome).toBe("skipped");
    expect(updates.calls).toEqual([]);
  });
});

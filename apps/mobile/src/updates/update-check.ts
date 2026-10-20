/** What the running binary reports about EAS Update (read from `expo-updates` at launch). */
interface UpdateEnvironment {
  /** `expo-updates` is enabled in this binary; false in development builds that load the bundle from Metro. */
  readonly enabled: boolean;
  /** A development bundle (`__DEV__`). */
  readonly development: boolean;
  /** The channel EAS Build wrote into the binary (`build.<profile>.channel` in `eas.json`); null for local builds. */
  readonly channel: string | null;
}

/** The two `expo-updates` calls the check needs, injected so the decision logic stays testable. */
interface UpdateClient {
  checkForUpdate(): Promise<{ readonly isAvailable: boolean }>;
  fetchUpdate(): Promise<{ readonly isNew: boolean }>;
}

type UpdateCheckOutcome = "skipped" | "up-to-date" | "downloaded" | "failed";

/**
 * Looks for a published update of the build's channel and downloads it in the background. A downloaded update is
 * applied on the **next launch**; the running session is never reloaded. The check never blocks startup and never
 * throws: offline, server or download errors resolve to `"failed"` and the app keeps running the current bundle.
 * Development bundles and builds without an EAS channel (local builds) do not touch the network at all.
 */
export async function checkForUpdateInBackground(
  environment: UpdateEnvironment,
  client: UpdateClient,
): Promise<UpdateCheckOutcome> {
  if (!environment.enabled || environment.development || !environment.channel) {
    return "skipped";
  }
  try {
    const check = await client.checkForUpdate();
    if (!check.isAvailable) {
      return "up-to-date";
    }
    const fetched = await client.fetchUpdate();
    return fetched.isNew ? "downloaded" : "up-to-date";
  } catch {
    return "failed";
  }
}

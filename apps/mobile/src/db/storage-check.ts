import { openDatabaseSync } from "expo-sqlite";
import {
  closeOnce,
  createSafetyCopy,
  type DatabaseFileInventory,
  inspectDatabaseFiles,
} from "./database-files";
import { DATABASE_NAME } from "./database-names";

/**
 * Development only (#242, #75 R6): report the files this app owns, and prove the pre-migration copy really works
 * on this device by taking one through the same steps the app takes before migrating. A copy the app is keeping
 * because a migration failed is reported and left alone (#75 R1); a copy this check took itself is deleted again,
 * so the check changes nothing about what a launch will find.
 */
export function checkDatabaseFiles(): DatabaseFileInventory {
  const found = inspectDatabaseFiles();
  if (found.copy !== "missing") {
    return found;
  }
  // A second, plain connection: the live one belongs to `DatabaseGate` and this check must not disturb it.
  const client = openDatabaseSync(DATABASE_NAME);
  const close = closeOnce(client);
  const safetyCopy = createSafetyCopy({ client, closeConnection: close });
  try {
    safetyCopy.create();
    return inspectDatabaseFiles();
  } finally {
    close();
    safetyCopy.discard();
  }
}

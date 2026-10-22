import { Host, Snackbar, SnackbarHost, type SnackbarHostRef } from "@expo/ui/jetpack-compose";
import { useEffect, useRef } from "react";
import { View } from "react-native";
import { useThemeColors } from "../use-theme";
import type { SnackbarProps } from "./types";

/**
 * A Material 3 `Snackbar` over the bottom of the screen, for a thing that has already happened (#63: "Archived"
 * after a row is archived, with no Undo in v1). `containerColor` / `contentColor` are the inverse of the page, as
 * Material 3's inverse surface asks, so it stands off a light and a dark screen alike.
 *
 * Touches pass through it: the notice has no action. React Native, not Compose, owns the layer it sits in, so the
 * list underneath keeps scrolling while the notice is up.
 */
export function AppSnackbar({ message, onShown, testID }: SnackbarProps) {
  const theme = useThemeColors();
  const host = useRef<SnackbarHostRef>(null);
  useEffect(() => {
    if (message === undefined) return;
    // Fire and forget: the queue belongs to the host, and the owner has nothing to wait for.
    void host.current?.showSnackbar({ message, duration: "short" });
    onShown();
  }, [message, onShown]);
  return (
    <View testID={testID} pointerEvents="none" className="absolute right-0 bottom-0 left-0">
      <Host matchContents={{ vertical: true }} useViewportSizeMeasurement style={{ flex: 1 }}>
        <SnackbarHost ref={host}>
          <Snackbar containerColor={theme.foreground} contentColor={theme.background} />
        </SnackbarHost>
      </Host>
    </View>
  );
}

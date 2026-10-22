import { useEffect } from "react";
import { AccessibilityInfo } from "react-native";
import type { SnackbarProps } from "./types";

/**
 * iOS has no Snackbar: the same notice is a VoiceOver announcement (#63: "On iOS the change is announced"), and
 * the list itself shows what changed.
 */
export function AppSnackbar({ message, onShown }: SnackbarProps) {
  useEffect(() => {
    if (message === undefined) return;
    AccessibilityInfo.announceForAccessibility(message);
    onShown();
  }, [message, onShown]);
  return null;
}

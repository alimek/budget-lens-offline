import { useEffect, useRef } from "react";
import { Alert } from "react-native";
import type { AlertProps } from "./types";

/**
 * The iOS system alert (`UIAlertController`, the view SwiftUI's `alert` presents too): a cancel button and a confirm
 * button, `destructive` for actions such as "Delete". Shown when `visible` turns true. React Native's `Alert` is used
 * because Expo UI's SwiftUI `Alert` is built around a visible `Alert.Trigger` and did not present from an invisible
 * anchor, while this wrapper is opened from anywhere (a swipe action, a button) and has no trigger of its own.
 */
export function AppAlert({
  visible,
  title,
  message,
  confirmLabel,
  cancelLabel,
  destructive = false,
  onConfirm,
  onDismiss,
}: AlertProps) {
  // The latest callbacks, so the open alert never calls a stale closure.
  const handlers = useRef({ onConfirm, onDismiss });
  handlers.current = { onConfirm, onDismiss };
  useEffect(() => {
    if (!visible) return;
    Alert.alert(
      title,
      message,
      [
        { text: cancelLabel, style: "cancel", onPress: () => handlers.current.onDismiss() },
        {
          text: confirmLabel,
          style: destructive ? "destructive" : "default",
          onPress: () => {
            handlers.current.onConfirm();
            handlers.current.onDismiss();
          },
        },
      ],
      { cancelable: true, onDismiss: () => handlers.current.onDismiss() },
    );
  }, [visible, title, message, confirmLabel, cancelLabel, destructive]);
  return null;
}

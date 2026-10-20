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
  // The latest props, so the open alert never calls a stale closure and changing a prop while it is open does not
  // present it again: only `visible` turning true presents it.
  const latest = useRef({
    title,
    message,
    confirmLabel,
    cancelLabel,
    destructive,
    onConfirm,
    onDismiss,
  });
  latest.current = { title, message, confirmLabel, cancelLabel, destructive, onConfirm, onDismiss };
  useEffect(() => {
    if (!visible) return;
    const props = latest.current;
    Alert.alert(
      props.title,
      props.message,
      [
        { text: props.cancelLabel, style: "cancel", onPress: () => latest.current.onDismiss() },
        {
          text: props.confirmLabel,
          style: props.destructive ? "destructive" : "default",
          onPress: () => {
            latest.current.onConfirm();
            latest.current.onDismiss();
          },
        },
      ],
      { cancelable: true, onDismiss: () => latest.current.onDismiss() },
    );
  }, [visible]);
  return null;
}

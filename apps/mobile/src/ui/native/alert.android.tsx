import { AlertDialog, Host, Text, TextButton } from "@expo/ui/jetpack-compose";
import { testID as testIDModifier } from "@expo/ui/jetpack-compose/modifiers";
import { useThemeColors } from "../use-theme";
import type { AlertProps } from "./types";

/**
 * A Material 3 `AlertDialog`: text buttons for cancel and confirm (confirm in `destructive` for actions such as
 * "Delete", otherwise `primary`). Shown while `visible`; back and a tap outside dismiss it.
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
  testID,
}: AlertProps) {
  const theme = useThemeColors();
  if (!visible) return null;
  return (
    <Host matchContents>
      <AlertDialog
        onDismissRequest={onDismiss}
        colors={{
          containerColor: theme.popover,
          titleContentColor: theme["popover-foreground"],
          textContentColor: theme["muted-foreground"],
        }}
      >
        <AlertDialog.Title>
          <Text>{title}</Text>
        </AlertDialog.Title>
        {message ? (
          <AlertDialog.Text>
            <Text>{message}</Text>
          </AlertDialog.Text>
        ) : null}
        <AlertDialog.ConfirmButton>
          <TextButton
            onClick={() => {
              onConfirm();
              onDismiss();
            }}
            colors={{ contentColor: destructive ? theme.destructive : theme.primary }}
            modifiers={[testIDModifier(`${testID}-confirm`)]}
          >
            <Text>{confirmLabel}</Text>
          </TextButton>
        </AlertDialog.ConfirmButton>
        <AlertDialog.DismissButton>
          <TextButton
            onClick={onDismiss}
            colors={{ contentColor: theme.primary }}
            modifiers={[testIDModifier(`${testID}-cancel`)]}
          >
            <Text>{cancelLabel}</Text>
          </TextButton>
        </AlertDialog.DismissButton>
      </AlertDialog>
    </Host>
  );
}

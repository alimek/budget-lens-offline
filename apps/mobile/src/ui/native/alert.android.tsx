import { AlertDialog, Host, Text, TextButton } from "@expo/ui/jetpack-compose";
import { testID as testIDModifier } from "@expo/ui/jetpack-compose/modifiers";
import { useThemeColors } from "../use-theme";
import type { AlertProps } from "./types";

/** A text button of the dialog: `contentColor` carries the meaning (destructive, primary). */
function DialogButton({
  label,
  color,
  testID,
  onClick,
}: {
  readonly label: string;
  readonly color: string;
  readonly testID: string;
  readonly onClick: () => void;
}) {
  return (
    <TextButton
      onClick={onClick}
      colors={{ contentColor: color }}
      modifiers={[testIDModifier(testID)]}
    >
      <Text>{label}</Text>
    </TextButton>
  );
}

/** The buttons of the dialog: confirm always, cancel only when the alert has one to offer. */
function DialogButtons({
  testID,
  confirmLabel,
  cancelLabel,
  destructive,
  onConfirm,
  onDismiss,
}: {
  readonly testID: string;
  readonly confirmLabel: string;
  readonly cancelLabel: string | undefined;
  readonly destructive: boolean;
  readonly onConfirm: () => void;
  readonly onDismiss: () => void;
}) {
  const theme = useThemeColors();
  return (
    <>
      <AlertDialog.ConfirmButton>
        <DialogButton
          label={confirmLabel}
          color={destructive ? theme.destructive : theme.primary}
          testID={`${testID}-confirm`}
          onClick={() => {
            onConfirm();
            onDismiss();
          }}
        />
      </AlertDialog.ConfirmButton>
      {cancelLabel === undefined ? null : (
        <AlertDialog.DismissButton>
          <DialogButton
            label={cancelLabel}
            color={theme.primary}
            testID={`${testID}-cancel`}
            onClick={onDismiss}
          />
        </AlertDialog.DismissButton>
      )}
    </>
  );
}

/**
 * A Material 3 `AlertDialog`: text buttons for cancel and confirm (confirm in `destructive` for actions such as
 * "Delete", otherwise `primary`). With no `cancelLabel` there is only the confirm button. Shown while `visible`;
 * back and a tap outside dismiss it.
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
        <DialogButtons
          testID={testID}
          confirmLabel={confirmLabel}
          cancelLabel={cancelLabel}
          destructive={destructive}
          onConfirm={onConfirm}
          onDismiss={onDismiss}
        />
      </AlertDialog>
    </Host>
  );
}

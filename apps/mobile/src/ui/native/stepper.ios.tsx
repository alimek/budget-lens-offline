import { Host, Stepper } from "@expo/ui/swift-ui";
import type { StepperProps } from "./types";

/**
 * SwiftUI `Stepper`: the value lives in the label ("Every 4 months") and the control is its pair of ± buttons,
 * which is also why the label carries the number rather than a field. `min` and `max` stop the buttons at the
 * bounds, so the value never leaves the range the caller allows.
 */
export function AppStepper({ label, value, min, max, onValueChange, testID }: StepperProps) {
  return (
    <Host matchContents={{ vertical: true }} style={{ alignSelf: "stretch" }}>
      <Stepper
        label={label}
        value={value}
        min={min}
        max={max}
        step={1}
        onValueChange={onValueChange}
        testID={testID}
      />
    </Host>
  );
}

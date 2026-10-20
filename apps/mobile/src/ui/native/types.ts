export interface ButtonProps {
  label: string;
  onPress: () => void;
  testID: string;
  disabled?: boolean;
}

export interface ToggleProps {
  /** Visible label; also the accessible name of the switch (VoiceOver / TalkBack read it with the state). */
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  testID: string;
  disabled?: boolean;
}

export interface ProgressIndicatorProps {
  /** 0..1 */
  fraction: number;
  color: string;
  trackColor: string;
}

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
}

export interface SegmentedControlProps<T extends string> {
  options: readonly SegmentOption<T>[];
  value: T;
  onValueChange: (value: T) => void;
  testID: string;
}

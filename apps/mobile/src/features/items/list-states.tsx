// The states around an items list (#112), shared by the tab and the archived screen: the loading state that waits
// 300 ms before it appears, the failed read the user can retry, the empty state whose next child is #82's "Add
// first item" CTA, and the note about items the read could not use.
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { Text } from "@/ui/components/text";
import { SecondaryButton } from "@/ui/native/button";
import { ProgressIndicator } from "@/ui/native/progress-indicator";
import { useDelayedFlag } from "@/ui/use-delayed-flag";
import { useThemeColors } from "@/ui/use-theme";

/**
 * The states of a live read that are not the list itself: the spinner that waits 300 ms (#58) and the failed read
 * the user can retry. Both items screens share it, each with its own test IDs.
 */
export function ReadState({
  status,
  reload,
  loadingTestID = "items-loading",
  errorTestID = "items-error",
  children,
}: {
  readonly status: "loading" | "ready" | "error";
  readonly reload: () => void;
  readonly loadingTestID?: string;
  readonly errorTestID?: string;
  readonly children: ReactNode;
}) {
  // A live read is synchronous, so its pending state is gone within a frame: the spinner would only flash.
  const showLoading = useDelayedFlag(status === "loading");
  // Nothing at all while the read is pending: until the 300 ms are up the screen shows neither a spinner nor a
  // list, and in particular not the empty state of a list nobody has read yet (#63 states).
  if (status === "loading") return showLoading ? <LoadingItems testID={loadingTestID} /> : null;
  if (status === "error") return <LoadFailed onRetry={reload} testID={errorTestID} />;
  return <>{children}</>;
}

/** The loading state, shown only after the 300 ms of #58 so a local read never flashes a spinner. */
function LoadingItems({ testID = "items-loading" }: { readonly testID?: string }) {
  const { t } = useTranslation("items");
  const theme = useThemeColors();
  return (
    <View testID={testID} className="flex-row items-center gap-3 px-4 pt-6">
      <ProgressIndicator color={theme.primary} trackColor={theme.muted} />
      <Text variant="subheadline">{t("list.loading")}</Text>
    </View>
  );
}

/** A read that failed: the list is gone, the data is not (#63 states). */
function LoadFailed({
  onRetry,
  testID = "items-error",
}: {
  readonly onRetry: () => void;
  readonly testID?: string;
}) {
  const { t } = useTranslation("items");
  const { t: tShared } = useTranslation();
  return (
    <View testID={testID} className="gap-3 px-4 pt-6">
      <Text variant="body" className="text-destructive">
        {t("list.loadError")}
      </Text>
      <SecondaryButton
        testID="items-error-retry"
        label={tShared("common.retry")}
        onPress={onRetry}
      />
    </View>
  );
}

/**
 * The empty state: a title, a body, and the note about items the read could not use. #82 adds its "Add first
 * item" CTA (`items-empty-add`) as the next child of this column, which is why the texts are a block of their own
 * rather than a section footer.
 */
export function EmptyItems({
  hasInvalidItems,
  children,
  testID = "items-empty",
}: {
  readonly hasInvalidItems: boolean;
  /** #82's call to action; nothing renders here until it exists. */
  readonly children?: ReactNode;
  readonly testID?: string;
}) {
  const { t } = useTranslation("items");
  return (
    <View testID={testID} className="items-center gap-2 px-8 py-14">
      <Text variant="title-3" className="text-center">
        {t("empty.title")}
      </Text>
      <Text variant="body" className="text-center text-muted-foreground">
        {t("empty.body")}
      </Text>
      <SomeInvalidNote visible={hasInvalidItems} />
      {children}
    </View>
  );
}

/** The muted note about items the read reported as unusable (#88 hides them instead of losing the list). */
function SomeInvalidNote({
  visible,
  testID = "items-some-invalid",
}: {
  readonly visible: boolean;
  readonly testID?: string;
}) {
  const { t } = useTranslation("items");
  if (!visible) return null;
  return (
    <Text testID={testID} variant="footnote" className="text-center text-muted-foreground">
      {t("list.someInvalid")}
    </Text>
  );
}

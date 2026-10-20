import type { ReactNode } from "react";
import { View } from "react-native";
import { Text } from "../components/text";

/** The React Native body of `AppSheet` on both platforms: a `title-2` heading above the content. */
export function SheetContent({
  title,
  testID,
  children,
}: {
  title: string;
  testID: string;
  children: ReactNode;
}) {
  return (
    <View testID={testID} collapsable={false} className="gap-4 px-5 pt-2 pb-8">
      <Text variant="title-2" accessibilityRole="header">
        {title}
      </Text>
      {children}
    </View>
  );
}

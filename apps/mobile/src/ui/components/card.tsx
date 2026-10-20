// React Native Reusables `card` (Uniwind registry), adapted to #58: `rounded-lg` (12) custom container,
// `p-4` padding and `gap-2` stack, on the `card` surface.

import type * as React from "react";
import { View } from "react-native";
import { Text, TextClassContext } from "@/ui/components/text";
import { cn } from "@/ui/lib/utils";

function Card({
  className,
  ...props
}: React.ComponentProps<typeof View> & React.RefAttributes<View>) {
  return (
    <TextClassContext.Provider value="text-card-foreground">
      <View className={cn("bg-card flex flex-col gap-3 rounded-lg p-4", className)} {...props} />
    </TextClassContext.Provider>
  );
}

function CardHeader({
  className,
  ...props
}: React.ComponentProps<typeof View> & React.RefAttributes<View>) {
  return <View className={cn("flex flex-col gap-1", className)} {...props} />;
}

function CardTitle(props: React.ComponentProps<typeof Text>) {
  return <Text variant="title-3" {...props} />;
}

function CardDescription({ className, ...props }: React.ComponentProps<typeof Text>) {
  return (
    <Text variant="subheadline" className={cn("text-muted-foreground", className)} {...props} />
  );
}

function CardContent({
  className,
  ...props
}: React.ComponentProps<typeof View> & React.RefAttributes<View>) {
  return <View className={cn("flex flex-col gap-2", className)} {...props} />;
}

export { Card, CardContent, CardDescription, CardHeader, CardTitle };

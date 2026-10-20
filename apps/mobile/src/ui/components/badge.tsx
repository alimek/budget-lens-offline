// React Native Reusables `badge` (Uniwind registry), adapted to #58: `rounded-sm` (6), `caption` text and a
// `tinted` variant (primary at 12%) for the "Changed this month" badge.

import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";
import { View } from "react-native";
import { TextClassContext } from "@/ui/components/text";
import { cn } from "@/ui/lib/utils";

const badgeVariants = cva(
  "shrink-0 flex-row items-center justify-center gap-1 self-start overflow-hidden rounded-sm border border-transparent px-2 py-0.5",
  {
    variants: {
      variant: {
        tinted: "bg-primary/12",
        default: "bg-primary",
        secondary: "bg-secondary",
        destructive: "bg-destructive",
        outline: "border-border",
      },
    },
    defaultVariants: { variant: "tinted" },
  },
);

const badgeTextVariants = cva("", {
  variants: {
    variant: {
      tinted: "text-primary",
      default: "text-primary-foreground",
      secondary: "text-secondary-foreground",
      destructive: "text-card",
      outline: "text-foreground",
    },
  },
  defaultVariants: { variant: "tinted" },
});

type BadgeProps = React.ComponentProps<typeof View> &
  React.RefAttributes<View> &
  VariantProps<typeof badgeVariants>;

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <TextClassContext.Provider value={badgeTextVariants({ variant })}>
      <View className={cn(badgeVariants({ variant }), className)} {...props} />
    </TextClassContext.Provider>
  );
}

export { Badge };

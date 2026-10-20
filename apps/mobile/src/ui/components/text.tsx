// React Native Reusables `text` (Uniwind registry), adapted to the #58 type scale: sizes come from
// `typeStyle` per platform, colours from the token classes, and no font family is ever set.

import { Slot } from "@rn-primitives/slot";
import { cva } from "class-variance-authority";
import * as React from "react";
import { Platform, Text as RNText, type Role } from "react-native";
import { cn } from "@/ui/lib/utils";
import { type TypeVariant, typeStyle } from "@/ui/typography";

const textVariants = cva("text-foreground", {
  variants: {
    variant: {
      display: "",
      "title-1": "",
      "title-2": "",
      "title-3": "",
      headline: "",
      body: "",
      callout: "",
      subheadline: "text-muted-foreground",
      footnote: "text-muted-foreground",
      caption: "",
      "section-label": "text-muted-foreground",
      "amount-lg": "text-right",
      amount: "text-right",
    } satisfies Record<TypeVariant, string>,
  },
  defaultVariants: { variant: "body" },
});

const HEADINGS: Partial<Record<TypeVariant, number>> = {
  display: 1,
  "title-1": 1,
  "title-2": 2,
  "title-3": 3,
  "section-label": 4,
};

const TextClassContext = React.createContext<string | undefined>(undefined);

type TextProps = React.ComponentProps<typeof RNText> &
  React.RefAttributes<RNText> & {
    asChild?: boolean;
    variant?: TypeVariant;
  };

function Text({ className, asChild = false, variant = "body", style, ...props }: TextProps) {
  const textClass = React.useContext(TextClassContext);
  const Component = asChild ? Slot : RNText;
  const level = HEADINGS[variant];
  const role: Role | undefined = level === undefined ? undefined : "heading";
  return (
    <Component
      className={cn(textVariants({ variant }), textClass, className)}
      style={[typeStyle(variant, Platform.OS), style]}
      role={role}
      aria-level={level}
      {...props}
    />
  );
}

export { Text, TextClassContext };

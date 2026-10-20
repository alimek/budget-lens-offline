declare module "*.css";

declare module "*.css?raw" {
  const content: string;
  export default content;
}

/** Vector drawables (Material icons for Expo UI `Icon` on Android), resolved by Metro as assets. */
declare module "*.xml" {
  const source: import("react-native").ImageSourcePropType;
  export default source;
}

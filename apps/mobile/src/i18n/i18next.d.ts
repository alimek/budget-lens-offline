import type { defaultNS, resources } from "./resources";

// Type-checks `t()` keys and namespaces against the English resources.
declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: typeof defaultNS;
    resources: (typeof resources)["en"];
  }
}

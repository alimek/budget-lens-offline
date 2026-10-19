import { toYearMonth, type YearMonth } from "@budget-lens/core";
import { createContext, type PropsWithChildren, use, useState } from "react";
import { type StoreApi, useStore } from "zustand";
import { createStore } from "zustand/vanilla";

type AppState = { selectedMonth: YearMonth };
const AppStoreContext = createContext<StoreApi<AppState> | null>(null);

export function AppStoreProvider({
  children,
  clock = () => new Date(),
}: PropsWithChildren<{ clock?: () => Date }>) {
  const [store] = useState(() => {
    const now = clock();
    const selectedMonth = toYearMonth(
      `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`,
    );
    return createStore<AppState>()(() => ({ selectedMonth }));
  });
  return <AppStoreContext value={store}>{children}</AppStoreContext>;
}

export function useAppStore<T>(selector: (state: AppState) => T): T {
  const store = use(AppStoreContext);
  if (!store) throw new Error("AppStoreProvider is missing");
  return useStore(store, selector);
}

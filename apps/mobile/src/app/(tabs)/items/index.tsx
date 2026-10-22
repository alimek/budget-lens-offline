// The Items tab (#112): the income and expense items with their recurrence summaries, and the entry point to the
// archived list. Everything on it comes from one live read, so a write through any repository lands here without
// a refresh callback. Adding and editing items is #82; the row actions are a list it extends with "edit".
import { useRouter } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { ArchiveDialog } from "@/features/items/archive-dialog";
import { itemRowActions } from "@/features/items/item-row-copy";
import type { ItemRow } from "@/features/items/item-rows";
import { ItemSectionList } from "@/features/items/item-section-list";
import { EmptyItems, ReadState } from "@/features/items/list-states";
import { useItemRows } from "@/features/items/use-item-rows";
import { GroupedList, ListSection, NavigationRow } from "@/ui/native/list";

export default function ItemsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const items = useItemRows();
  const [confirming, setConfirming] = useState<ItemRow | null>(null);
  const note = items.hasInvalidItems ? t("items.list.someInvalid") : undefined;

  return (
    <View testID="screen-items" collapsable={false} className="flex-1 bg-background">
      <ReadState status={items.status} reload={items.reload}>
        {items.empty ? <EmptyItems hasInvalidItems={items.hasInvalidItems} /> : null}
        <GroupedList testID="items-list">
          <ItemSectionList
            sections={items.sections}
            sectionTestIds={{ income: "items-section-income", expenses: "items-section-expenses" }}
            rowTestIdPrefix="items-row"
            actions={itemRowActions((key, options) => t(key, { ...options }))}
            onAction={setConfirming}
            note={note}
          />
          <ListSection>
            <NavigationRow
              testID="items-open-archived"
              label={t("items.list.archived")}
              onPress={() => router.push("/(tabs)/items/archived")}
            />
          </ListSection>
        </GroupedList>
      </ReadState>
      <ArchiveDialog row={confirming} onClose={() => setConfirming(null)} />
    </View>
  );
}

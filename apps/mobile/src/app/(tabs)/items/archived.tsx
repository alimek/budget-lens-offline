// The archived items (#112): the read-only list behind the "Archived items" row. Restoring is not in v1
// (#63 open point 4), so the rows have no actions at all and the screen writes nothing.
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { ItemSectionList } from "@/features/items/item-section-list";
import { ReadState } from "@/features/items/list-states";
import { useItemRows } from "@/features/items/use-item-rows";
import { Text } from "@/ui/components/text";
import { GroupedList } from "@/ui/native/list";

export default function ArchivedItemsScreen() {
  const { t } = useTranslation();
  const items = useItemRows({ archived: true });
  return (
    <View testID="screen-items-archived" collapsable={false} className="flex-1 bg-background">
      <ReadState
        status={items.status}
        reload={items.reload}
        loadingTestID="items-archived-loading"
        errorTestID="items-archived-error"
      >
        {items.empty ? (
          <Text
            testID="items-archived-empty"
            variant="body"
            className="px-4 py-6 text-muted-foreground"
          >
            {t("items.archived.empty")}
          </Text>
        ) : null}
        <GroupedList testID="items-archived-list">
          <ItemSectionList
            sections={items.sections}
            sectionTestIds={{
              income: "items-archived-section-income",
              expenses: "items-archived-section-expenses",
            }}
            rowTestIdPrefix="items-archived-row"
          />
        </GroupedList>
      </ReadState>
    </View>
  );
}

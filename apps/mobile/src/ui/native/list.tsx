// Platform split: Metro loads list.ios.tsx / list.android.tsx; this file gives TypeScript the shared API.
export {
  GroupedList,
  ListSection,
  NavigationRow,
  TransactionRow,
} from "./list.android";

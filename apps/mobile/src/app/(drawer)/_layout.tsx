import { Drawer } from "expo-router/drawer";

import { HistoryDrawerContent } from "@/screens/HistoryDrawerContent";

export default function DrawerLayout() {
  return (
    <Drawer
      screenOptions={{ headerShown: false, drawerPosition: "left" }}
      drawerContent={(props) => <HistoryDrawerContent {...props} />}
    >
      <Drawer.Screen name="index" />
      <Drawer.Screen name="thread/[threadId]" options={{ swipeEnabled: false }} />
    </Drawer>
  );
}

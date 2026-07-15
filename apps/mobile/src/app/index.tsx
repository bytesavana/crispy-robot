import { router } from "expo-router";
import { useEffect } from "react";
import { View } from "react-native";

import { getHasOnboarded } from "@/lib/onboarding";
import { colors } from "@/theme";

export default function Index() {
  useEffect(() => {
    getHasOnboarded()
      .then((value) => {
        router.replace(value === "true" ? "/(drawer)" : "/onboarding");
      })
      .catch(() => router.replace("/onboarding"));
  }, []);

  return <View style={{ flex: 1, backgroundColor: colors.background }} />;
}

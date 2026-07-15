import AsyncStorage from "@react-native-async-storage/async-storage";

const HAS_ONBOARDED_KEY = "mtaapal.hasOnboarded";

export function getHasOnboarded(): Promise<string | null> {
  return AsyncStorage.getItem(HAS_ONBOARDED_KEY);
}

export function setHasOnboarded(): Promise<void> {
  return AsyncStorage.setItem(HAS_ONBOARDED_KEY, "true");
}

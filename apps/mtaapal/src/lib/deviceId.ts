import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Crypto from "expo-crypto";

const DEVICE_ID_KEY = "mtaapal.deviceId";

let deviceId: string | null = null;

/**
 * One GUID per install, generated once on first read and persisted — sent as X-Customer-Id
 * for guest (signed-out) requests. Unlike session.ts's threadId, this must survive restarts.
 */
export async function getDeviceId(): Promise<string> {
  if (deviceId) return deviceId;

  const stored = await AsyncStorage.getItem(DEVICE_ID_KEY);
  if (stored) {
    deviceId = stored;
    return stored;
  }

  const generated = Crypto.randomUUID();
  await AsyncStorage.setItem(DEVICE_ID_KEY, generated);
  deviceId = generated;
  return generated;
}

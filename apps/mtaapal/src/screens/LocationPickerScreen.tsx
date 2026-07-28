import { router } from "expo-router";
import { useEffect } from "react";

import { LocationPicker } from "@/components/LocationPicker";
import { isAddressPickPending, resolveAddressPick } from "@/lib/locationPickerBridge";

/**
 * Full-screen modal wrapper for LocationPicker — search results and a
 * scrolling address list need real room, which the old composer-overlay
 * (matching AttachMenu's small popover) couldn't give them.
 */
export function LocationPickerScreen() {
  useEffect(() => {
    return () => {
      // Swipe-to-dismiss or back-navigation without picking anything still has
      // to answer the pending request — otherwise the caller (the agent's tool
      // call, or a manual pickLocation()) hangs forever awaiting a promise that
      // will never resolve. A no-op if LocationPicker already resolved it.
      if (isAddressPickPending()) resolveAddressPick("cancelled");
    };
  }, []);

  return <LocationPicker onDone={() => router.back()} />;
}

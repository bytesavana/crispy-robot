import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import * as Location from "expo-location";

import { resolveAddressPick } from "@/lib/locationPickerBridge";
import { searchPlaces, type PlaceResult } from "@/lib/placesApi";
import { useSavedAddresses, type SavedAddress } from "@/lib/useAddress";
import { colors, radii, spacing, typography } from "@/theme";

const SEARCH_DEBOUNCE_MS = 300;
const SEARCH_TIMEOUT_MS = 5000;

type PickableAddress = SavedAddress & { latitude: number; longitude: number };

/**
 * The manual half of location selection — the other half is the agent calling
 * ask_customer_for_address itself (see locationTools.ts). Rendered inside the
 * location-picker modal (see screens/LocationPickerScreen.tsx) whenever
 * useIsAddressPickRequested() is true, whichever triggered it.
 *
 * `onDone` is purely navigational (the modal screen calls router.back()) —
 * resolveAddressPick is what actually answers the caller, and is called here
 * directly so the two can never get out of sync.
 */
export function LocationPicker({ onDone }: { onDone: () => void }) {
  const savedAddresses = useSavedAddresses();
  const [locating, setLocating] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PlaceResult[]>([]);
  // The query `results` actually answers, so "searching" can be derived at
  // render time (below) instead of tracked as its own state set synchronously
  // inside the effect — only the async callback ever calls setState here.
  const [searchedQuery, setSearchedQuery] = useState<string | null>(null);
  const searchToken = useRef(0);

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) return;
    const token = ++searchToken.current;
    const controller = new AbortController();
    const abortTimer = setTimeout(() => controller.abort(), SEARCH_TIMEOUT_MS);
    const timer = setTimeout(async () => {
      try {
        const found = await searchPlaces(trimmed, controller.signal);
        // A slower earlier search resolving after a newer one must not clobber
        // its results — only the most recently fired request may apply.
        if (token === searchToken.current) {
          setResults(found);
          setSearchedQuery(trimmed);
        }
      } catch {
        // Timed out or aborted — treat like "nothing found" so the picker
        // doesn't spin forever on a stuck request.
        if (token === searchToken.current) {
          setResults([]);
          setSearchedQuery(trimmed);
        }
      } finally {
        clearTimeout(abortTimer);
      }
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      clearTimeout(timer);
      clearTimeout(abortTimer);
      controller.abort();
    };
  }, [query]);

  const trimmedQuery = query.trim();
  const isSearchMode = trimmedQuery.length > 0;
  const searching = isSearchMode && searchedQuery !== trimmedQuery;

  const pickable = savedAddresses.filter(
    (a): a is PickableAddress => a.latitude !== null && a.longitude !== null,
  );
  const unpickable = savedAddresses.filter((a) => a.latitude === null || a.longitude === null);

  const useCurrentLocation = async () => {
    setLocating(true);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) {
        resolveAddressPick("cancelled");
        onDone();
        return;
      }
      const position = await Location.getCurrentPositionAsync();
      resolveAddressPick({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        source: "gps",
      });
      onDone();
    } catch {
      resolveAddressPick("cancelled");
      onDone();
    } finally {
      setLocating(false);
    }
  };

  const pickSaved = (address: PickableAddress) => {
    resolveAddressPick({
      latitude: address.latitude,
      longitude: address.longitude,
      name: address.label,
      source: "saved_address",
    });
    onDone();
  };

  const pickResult = (place: PlaceResult) => {
    resolveAddressPick({
      latitude: place.latitude,
      longitude: place.longitude,
      name: place.name,
      source: "picker",
    });
    onDone();
  };

  const cancel = () => {
    resolveAddressPick("cancelled");
    onDone();
  };

  return (
    <View style={styles.panel}>
      <View style={styles.header}>
        <Text style={styles.title}>WHERE ARE YOU?</Text>
        <Pressable hitSlop={8} onPress={cancel}>
          <Ionicons name="close" size={18} color={colors.textMuted} />
        </Pressable>
      </View>

      <View style={styles.searchBox}>
        <Ionicons name="search-outline" size={18} color={colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search for a place or address"
          placeholderTextColor={colors.textMuted}
          value={query}
          onChangeText={setQuery}
          autoFocus
        />
        {query.length > 0 ? (
          <Pressable hitSlop={8} onPress={() => setQuery("")}>
            <Ionicons name="close-circle" size={18} color={colors.textMuted} />
          </Pressable>
        ) : null}
      </View>

      {isSearchMode ? (
        <View style={styles.resultsArea}>
          {searching ? (
            <View style={styles.centeredRow}>
              <ActivityIndicator size="small" color={colors.primaryDark} />
            </View>
          ) : results.length === 0 ? (
            <Text style={styles.note}>No places found for &quot;{query.trim()}&quot;.</Text>
          ) : (
            <FlatList
              data={results}
              keyExtractor={(place, index) => `${place.name}-${index}`}
              renderItem={({ item, index }) => (
                <Pressable
                  onPress={() => pickResult(item)}
                  style={({ pressed }) => [
                    styles.item,
                    index < results.length - 1 && styles.itemDivider,
                    pressed && styles.itemPressed,
                  ]}
                >
                  <View style={[styles.iconCircle, { backgroundColor: colors.accentPeach }]}>
                    <Ionicons name="pin-outline" size={20} color={colors.primaryDark} />
                  </View>
                  <View style={styles.itemText}>
                    <Text style={styles.itemLabel}>{item.name}</Text>
                    <Text style={styles.itemDescription}>{item.address_text}</Text>
                  </View>
                </Pressable>
              )}
            />
          )}
        </View>
      ) : (
        <>
          <Pressable
            onPress={useCurrentLocation}
            disabled={locating}
            style={({ pressed }) => [styles.item, styles.itemDivider, pressed && styles.itemPressed]}
          >
            <View style={[styles.iconCircle, { backgroundColor: colors.accentGreen }]}>
              {locating ? (
                <ActivityIndicator size="small" color={colors.primaryDark} />
              ) : (
                <Ionicons name="navigate-outline" size={20} color={colors.primaryDark} />
              )}
            </View>
            <Text style={styles.itemLabel}>Use my current location</Text>
          </Pressable>

          {pickable.map((address, index) => (
            <Pressable
              key={address.id}
              onPress={() => pickSaved(address)}
              style={({ pressed }) => [
                styles.item,
                index < pickable.length - 1 && styles.itemDivider,
                pressed && styles.itemPressed,
              ]}
            >
              <View style={[styles.iconCircle, { backgroundColor: colors.accentBlue }]}>
                <Ionicons name="location-outline" size={20} color="#3A6B8A" />
              </View>
              <View style={styles.itemText}>
                <Text style={styles.itemLabel}>{address.label}</Text>
                <Text style={styles.itemDescription}>{address.address_text}</Text>
              </View>
            </Pressable>
          ))}

          {unpickable.length > 0 ? (
            <Text style={styles.note}>
              {unpickable.map((a) => a.label).join(", ")} saved without a map location —
              can&apos;t be used to set where you are, but still usable as a delivery address.
            </Text>
          ) : null}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    flex: 1,
    backgroundColor: colors.surface,
    padding: spacing.md,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.bodySmall,
    fontWeight: "700",
    color: colors.textMuted,
    letterSpacing: 0.5,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.background,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
  },
  searchInput: {
    flex: 1,
    ...typography.body,
    color: colors.text,
    padding: 0,
  },
  resultsArea: {
    flex: 1,
  },
  centeredRow: {
    paddingVertical: spacing.lg,
    alignItems: "center",
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  itemDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  itemPressed: {
    opacity: 0.6,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  itemText: {
    flex: 1,
    gap: 2,
  },
  itemLabel: {
    ...typography.body,
    fontWeight: "700",
    color: colors.text,
  },
  itemDescription: {
    ...typography.bodySmall,
    color: colors.textMuted,
  },
  note: {
    ...typography.bodySmall,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
});

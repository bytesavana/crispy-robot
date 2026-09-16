import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Alert, FlatList, RefreshControl, StyleSheet, View } from "react-native";

import { EmptyState } from "@/components/EmptyState";
import { ErrorNotice } from "@/components/ErrorNotice";
import { OfferActionCard } from "@/components/OfferActionCard";
import { Screen } from "@/components/Screen";
import { acceptTaskOffer, rejectTaskOffer } from "@/lib/api/tasks";
import { useProviderSession } from "@/lib/providerSession";
import { useJobs } from "@/lib/useJobs";
import { colors, spacing } from "@/theme";

type RespondVars = { taskId: string; offerId: string; accept: boolean };

export function OffersScreen() {
  const session = useProviderSession();
  const queryClient = useQueryClient();
  const { data: jobs, error, isLoading, isRefreshing, refresh } = useJobs(session?.providerId);
  const offers = (jobs ?? []).filter((job) => job.status === "new");

  const [expiredIds, setExpiredIds] = useState<string[]>([]);

  const respondMutation = useMutation({
    mutationFn: ({ taskId, offerId, accept }: RespondVars) =>
      accept ? acceptTaskOffer(taskId, offerId) : rejectTaskOffer(taskId, offerId, "Declined"),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["jobs"] }),
    onError: (caught) =>
      Alert.alert("Couldn't send that", caught instanceof Error ? caught.message : "Try again."),
  });
  const busyTaskId = respondMutation.isPending ? (respondMutation.variables?.taskId ?? null) : null;

  function markExpired(taskId: string) {
    setExpiredIds((current) => (current.includes(taskId) ? current : [...current, taskId]));
  }

  function respond(taskId: string, offerId: string, accept: boolean) {
    respondMutation.mutate({ taskId, offerId, accept });
  }

  function confirmDecline(taskId: string, offerId: string) {
    Alert.alert("Decline this job?", "We'll look for someone else, or tell the customer.", [
      { text: "Keep it", style: "cancel" },
      { text: "Decline", style: "destructive", onPress: () => respond(taskId, offerId, false) },
    ]);
  }

  return (
    <Screen title="Offers">
      {error ? <ErrorNotice message={error} onRetry={refresh} /> : null}

      <FlatList
        data={offers}
        keyExtractor={(job) => job.taskId}
        contentContainerStyle={[styles.list, offers.length === 0 && styles.emptyList]}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={refresh} tintColor={colors.primary} />}
        renderItem={({ item }) => (
          <OfferActionCard
            job={item}
            isBusy={busyTaskId === item.taskId}
            isExpired={expiredIds.includes(item.taskId)}
            onAccept={() => respond(item.taskId, item.offerId!, true)}
            onDecline={() => confirmDecline(item.taskId, item.offerId!)}
            onExpired={() => markExpired(item.taskId)}
          />
        )}
        ListEmptyComponent={
          isLoading ? null : (
            <EmptyState
              icon="hand-left-outline"
              title="Nothing to answer"
              message="New job requests will show up here before they land on your calendar."
            />
          )
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  emptyList: {
    flexGrow: 1,
  },
  separator: {
    height: spacing.md,
  },
});

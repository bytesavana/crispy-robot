import { useState } from "react";
import { KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, View } from "react-native";

import type { ServiceTaskLineItem } from "@/lib/api/types";
import { formatKes, formatQuantity } from "@/lib/format";
import { colors, radii, spacing, typography } from "@/theme";

import { OutlineButton } from "./OutlineButton";
import { PrimaryButton } from "./PrimaryButton";
import { TextField } from "./TextField";

export interface LineReport {
  actualUnitPrice?: number;
  actualQuantity?: number;
  reason?: string;
}

type ReportLineSheetProps = {
  item: ServiceTaskLineItem | null;
  isBusy?: boolean;
  onSubmit: (report: LineReport) => void;
  onClose: () => void;
};

/**
 * What a runner found in the shop, for one line.
 *
 * Price and quantity are here; proposing a *substitute* is not. A substitute is a change of product
 * identity and has to be a real catalog product — the same allow-list that governs what enters a
 * basket governs what may replace it — so it needs a product search this app doesn't have yet. The
 * sheet says so rather than pretending the field is missing by accident.
 */
export function ReportLineSheet({ item, isBusy, onSubmit, onClose }: ReportLineSheetProps) {
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [error, setError] = useState<string | undefined>();

  function reset() {
    setPrice("");
    setQuantity("");
    setError(undefined);
  }

  function close() {
    reset();
    onClose();
  }

  function submit(overrides?: LineReport) {
    if (overrides) {
      onSubmit(overrides);
      reset();
      return;
    }

    const parsedPrice = price.trim() ? Number(price.trim()) : undefined;
    const parsedQuantity = quantity.trim() ? Number(quantity.trim()) : undefined;

    if (parsedPrice !== undefined && (Number.isNaN(parsedPrice) || parsedPrice < 0)) {
      setError("Enter the price as a number, e.g. 185");
      return;
    }
    if (parsedQuantity !== undefined && (Number.isNaN(parsedQuantity) || parsedQuantity < 0)) {
      setError("Enter the quantity as a number, e.g. 2");
      return;
    }
    if (parsedPrice === undefined && parsedQuantity === undefined) {
      setError("Enter what you paid, how much you got, or mark it unavailable.");
      return;
    }

    onSubmit({ actualUnitPrice: parsedPrice, actualQuantity: parsedQuantity });
    reset();
  }

  return (
    <Modal visible={item !== null} animationType="slide" transparent onRequestClose={close}>
      <View style={styles.backdrop}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <View style={styles.sheet}>
            <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
              {item ? (
                <>
                  <View style={styles.header}>
                    <Text style={styles.title}>{item.displayName}</Text>
                    <Text style={styles.quoted}>
                      Quoted {formatQuantity(item.quantity)} × {formatKes(item.quotedUnitPrice)}
                    </Text>
                  </View>

                  <TextField
                    label="Price paid (per unit)"
                    value={price}
                    onChangeText={setPrice}
                    placeholder={String(item.quotedUnitPrice)}
                    keyboardType="decimal-pad"
                    hint="Close to the quote and it's applied quietly. Far off and the customer is asked."
                  />

                  <TextField
                    label="Quantity you got"
                    value={quantity}
                    onChangeText={setQuantity}
                    placeholder={formatQuantity(item.quantity)}
                    keyboardType="decimal-pad"
                    error={error}
                  />

                  <Text style={styles.note}>
                    Swapping this for a different product has to go through the office for now — report
                    it as unavailable and say why.
                  </Text>

                  <PrimaryButton label="Report" onPress={() => submit()} isBusy={isBusy} />
                  <OutlineButton
                    label="Couldn't get it at all"
                    disabled={isBusy}
                    onPress={() => submit({ actualQuantity: 0, reason: "Out of stock" })}
                  />
                  <OutlineButton label="Cancel" disabled={isBusy} onPress={close} />
                </>
              ) : null}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(18, 33, 31, 0.45)",
  },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    maxHeight: "90%",
  },
  content: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  header: {
    gap: spacing.xs,
  },
  title: {
    ...typography.heading,
    color: colors.text,
  },
  quoted: {
    ...typography.bodySmall,
    color: colors.textMuted,
  },
  note: {
    ...typography.bodySmall,
    color: colors.textMuted,
  },
});

import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { colors, radii, spacing, typography } from "@/theme";

type WeekStripProps = {
  selectedDate: Date;
  onSelect: (date: Date) => void;
  /** Which days have at least one job — draws the small dot under the date, the same signal the
   * mockups use to say "something's scheduled here" without opening the day. */
  datesWithJobs: Date[];
};

function startOfWeek(date: Date): Date {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7)); // Monday-first, matching the mockups.
  return start;
}

function isSameDate(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function WeekStrip({ selectedDate, onSelect, datesWithJobs }: WeekStripProps) {
  const today = new Date();
  const monday = startOfWeek(selectedDate);
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {days.map((day) => {
        const selected = isSameDate(day, selectedDate);
        const isToday = isSameDate(day, today);
        const hasJobs = datesWithJobs.some((d) => isSameDate(d, day));

        return (
          <Pressable
            key={day.toISOString()}
            accessibilityRole="button"
            onPress={() => onSelect(day)}
            style={[styles.day, selected && styles.daySelected]}
          >
            <Text style={[styles.dayLabel, selected && styles.dayLabelSelected]}>
              {day.toLocaleDateString("en-US", { weekday: "short" }).slice(0, 2).toUpperCase()}
            </Text>
            <Text style={[styles.dayNumber, selected && styles.dayNumberSelected, isToday && !selected && styles.today]}>
              {day.getDate()}
            </Text>
            {hasJobs ? <View style={[styles.dot, selected && styles.dotSelected]} /> : <View style={styles.dotSpacer} />}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  day: {
    alignItems: "center",
    justifyContent: "center",
    width: 44,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    gap: 4,
  },
  daySelected: {
    backgroundColor: colors.accentPeach,
  },
  dayLabel: {
    ...typography.label,
    color: colors.textMuted,
    fontWeight: "700",
  },
  dayLabelSelected: {
    color: colors.primaryDark,
  },
  dayNumber: {
    ...typography.title,
    color: colors.text,
  },
  dayNumberSelected: {
    color: colors.primaryDark,
  },
  today: {
    color: colors.primary,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: colors.primary,
  },
  dotSelected: {
    backgroundColor: colors.primaryDark,
  },
  dotSpacer: {
    width: 5,
    height: 5,
  },
});

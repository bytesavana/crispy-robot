import { router } from "expo-router";
import { useRef, useState } from "react";
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AssistantCard } from "@/components/AssistantCard";
import { PaginationDots } from "@/components/PaginationDots";
import { PrimaryButton } from "@/components/PrimaryButton";
import { UserBubble } from "@/components/UserBubble";
import { setHasOnboarded } from "@/lib/onboarding";
import { colors, radii, spacing, typography } from "@/theme";

type Slide = {
  heading: string;
  body: string;
  cta: "Next" | "Continue";
  illustration: "logo" | "preview" | "blobs";
};

const slides: Slide[] = [
  {
    heading: "MtaaPal",
    body: "AI errands, run by your neighborhood.",
    cta: "Next",
    illustration: "logo",
  },
  {
    heading: "Just tell us what you need",
    body: "Message our AI concierge like you would a friend. It plans the errand and lines up your runner.",
    cta: "Next",
    illustration: "preview",
  },
  {
    heading: "Built around your neighborhood",
    body: "Services, pricing, and runners are tuned to exactly where you are.",
    cta: "Continue",
    illustration: "blobs",
  },
];

function Illustration({ kind }: { kind: Slide["illustration"] }) {
  if (kind === "logo") {
    return (
      <View style={styles.logoCircle}>
        <Text style={styles.logoText}>M</Text>
      </View>
    );
  }
  if (kind === "preview") {
    return (
      <View style={styles.previewCard}>
        <UserBubble text="Grab my dry cleaning today" />
        <AssistantCard text="On it — runner assigned, ETA 25 min." />
      </View>
    );
  }
  return (
    <View style={styles.blobsContainer}>
      <View style={[styles.blob, styles.blobPeach]} />
      <View style={[styles.blob, styles.blobBlue]} />
    </View>
  );
}

export function OnboardingCarousel() {
  const { width: screenWidth } = useWindowDimensions();
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const goToSlide = (index: number) => {
    // react-native-web's animated scrollTo stalls when combined with the
    // scroll-snap CSS that `pagingEnabled` applies on web — jump instantly there.
    scrollRef.current?.scrollTo({ x: index * screenWidth, animated: Platform.OS !== "web" });
    setActiveIndex(index);
  };

  const finishOnboarding = () => {
    setHasOnboarded().catch(() => {});
    router.replace("/location-permission");
  };

  const handleScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / screenWidth);
    setActiveIndex(index);
  };

  const handleCta = () => {
    if (activeIndex < slides.length - 1) {
      goToSlide(activeIndex + 1);
    } else {
      finishOnboarding();
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={styles.skipRow}>
        <Pressable onPress={finishOnboarding} hitSlop={12}>
          <Text style={styles.skipText}>Skip</Text>
        </Pressable>
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScrollEnd}
        style={styles.scroll}
      >
        {slides.map((slide) => (
          <View key={slide.heading} style={[styles.slide, { width: screenWidth }]}>
            <Illustration kind={slide.illustration} />
            <Text style={styles.heading}>{slide.heading}</Text>
            <Text style={styles.body}>{slide.body}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <PaginationDots count={slides.length} activeIndex={activeIndex} />
        <PrimaryButton label={slides[activeIndex].cta} onPress={handleCta} style={styles.ctaButton} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  skipRow: {
    alignItems: "flex-end",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  skipText: {
    ...typography.body,
    color: colors.textMuted,
    fontWeight: "600",
  },
  scroll: {
    flex: 1,
  },
  slide: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
  },
  heading: {
    ...typography.headingLarge,
    color: colors.text,
    textAlign: "center",
    marginTop: spacing.xl,
  },
  body: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: "center",
    marginTop: spacing.sm,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    gap: spacing.lg,
  },
  ctaButton: {
    width: "100%",
  },
  logoCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: {
    ...typography.headingLarge,
    color: colors.textOnPrimary,
  },
  previewCard: {
    width: "100%",
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    gap: spacing.xs,
  },
  blobsContainer: {
    width: 160,
    height: 140,
    justifyContent: "center",
  },
  blob: {
    position: "absolute",
    width: 110,
    height: 110,
    borderRadius: 55,
  },
  blobPeach: {
    backgroundColor: colors.accentPeach,
    top: 0,
    left: 0,
  },
  blobBlue: {
    backgroundColor: colors.accentBlue,
    bottom: 0,
    right: 0,
  },
});

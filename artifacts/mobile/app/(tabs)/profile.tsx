import { Ionicons } from "@expo/vector-icons";
import { Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useStudy } from "@/context/StudyContext";
import { useColors } from "@/hooks/useColors";

const BADGE_MILESTONES = [
  { count: 1, icon: "star" as const, label: "First Question", color: "#EAB308" },
  { count: 5, icon: "flame" as const, label: "5 Questions", color: "#F97316" },
  { count: 10, icon: "trophy" as const, label: "10 Questions", color: "#7C3AED" },
  { count: 25, icon: "rocket" as const, label: "25 Questions", color: "#06B6D4" },
  { count: 50, icon: "diamond" as const, label: "50 Questions", color: "#10B981" },
  { count: 100, icon: "medal" as const, label: "100 Questions", color: "#F43F5E" },
];

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { questions, savedQuestions, streak, badges } = useStudy();

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const totalCount = questions.length;

  const subjectCounts: Record<string, number> = {};
  for (const q of questions) {
    subjectCounts[q.subject] = (subjectCounts[q.subject] ?? 0) + 1;
  }

  const SUBJECT_COLORS: Record<string, string> = {
    Mathematics: "#7C3AED",
    Science: "#06B6D4",
    English: "#F97316",
    "Social Studies": "#10B981",
    General: "#6B7280",
  };

  return (
    <ScrollView
      style={[styles.scroll, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { paddingTop: topPad + 8, paddingBottom: 100 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Avatar */}
      <View style={styles.avatarSection}>
        <View style={[styles.avatar, { backgroundColor: colors.secondary }]}>
          <Ionicons name="person" size={36} color={colors.primary} />
        </View>
        <Text style={[styles.name, { color: colors.foreground }]}>Student</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>AI Study Helper</Text>
      </View>

      {/* Stats */}
      <View style={[styles.statsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {[
          { icon: "help-circle" as const, label: "Questions", value: totalCount, color: colors.primary },
          { icon: "bookmark" as const, label: "Saved", value: savedQuestions.length, color: "#06B6D4" },
          { icon: "flame" as const, label: "Streak", value: streak, color: "#F97316" },
          { icon: "trophy" as const, label: "Badges", value: badges, color: "#EAB308" },
        ].map((s, i) => (
          <View key={s.label} style={[styles.statItem, i > 0 && { borderLeftWidth: 1, borderLeftColor: colors.border }]}>
            <Ionicons name={s.icon} size={20} color={s.color} />
            <Text style={[styles.statValue, { color: colors.foreground }]}>{s.value}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* Subject breakdown */}
      {Object.keys(subjectCounts).length > 0 && (
        <>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Subject Breakdown</Text>
          <View style={[styles.subjectCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {Object.entries(subjectCounts).map(([subject, count]) => {
              const col = SUBJECT_COLORS[subject] ?? "#6B7280";
              const pct = totalCount > 0 ? count / totalCount : 0;
              return (
                <View key={subject} style={styles.subjectRow}>
                  <View style={styles.subjectLabel}>
                    <View style={[styles.dot, { backgroundColor: col }]} />
                    <Text style={[styles.subjectName, { color: colors.foreground }]}>{subject}</Text>
                  </View>
                  <View style={styles.barWrap}>
                    <View style={[styles.barTrack, { backgroundColor: colors.muted }]}>
                      <View style={[styles.barFill, { backgroundColor: col, width: `${pct * 100}%` }]} />
                    </View>
                    <Text style={[styles.barCount, { color: colors.mutedForeground }]}>{count}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </>
      )}

      {/* Badges */}
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Badges</Text>
      <View style={styles.badgesGrid}>
        {BADGE_MILESTONES.map((b) => {
          const earned = totalCount >= b.count;
          return (
            <View
              key={b.label}
              style={[
                styles.badgeItem,
                {
                  backgroundColor: earned ? b.color + "15" : colors.card,
                  borderColor: earned ? b.color + "44" : colors.border,
                },
              ]}
            >
              <Ionicons
                name={b.icon}
                size={28}
                color={earned ? b.color : colors.mutedForeground}
              />
              <Text
                style={[
                  styles.badgeLabel,
                  { color: earned ? colors.foreground : colors.mutedForeground },
                ]}
              >
                {b.label}
              </Text>
              {!earned && (
                <Text style={[styles.badgeLock, { color: colors.mutedForeground }]}>
                  {b.count - totalCount} more
                </Text>
              )}
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { paddingHorizontal: 16, gap: 0 },
  avatarSection: { alignItems: "center", paddingVertical: 24 },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  name: { fontSize: 20, fontFamily: "Inter_700Bold" },
  subtitle: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 2 },
  statsCard: {
    flexDirection: "row",
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 24,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
    gap: 4,
    paddingVertical: 4,
  },
  statValue: { fontSize: 20, fontFamily: "Inter_700Bold" },
  statLabel: { fontSize: 10, fontFamily: "Inter_400Regular" },
  sectionTitle: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    marginBottom: 12,
    marginTop: 8,
  },
  subjectCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 14,
    marginBottom: 24,
  },
  subjectRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  subjectLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    width: 110,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  subjectName: { fontSize: 12, fontFamily: "Inter_500Medium" },
  barWrap: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8 },
  barTrack: { flex: 1, height: 6, borderRadius: 3, overflow: "hidden" },
  barFill: { height: 6, borderRadius: 3 },
  barCount: { fontSize: 11, fontFamily: "Inter_500Medium", width: 20, textAlign: "right" },
  badgesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 20,
  },
  badgeItem: {
    width: "30%",
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    alignItems: "center",
    gap: 6,
  },
  badgeLabel: { fontSize: 10, fontFamily: "Inter_600SemiBold", textAlign: "center" },
  badgeLock: { fontSize: 9, fontFamily: "Inter_400Regular" },
});

import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FeatureCard } from "@/components/FeatureCard";
import { QuestionCard } from "@/components/QuestionCard";
import { StatCard } from "@/components/StatCard";
import { SubjectCard } from "@/components/SubjectCard";
import { useStudy } from "@/context/StudyContext";
import { useColors } from "@/hooks/useColors";

const SUBJECTS = [
  {
    name: "Mathematics",
    nameLocal: "गणित",
    color: "#7C3AED",
    icon: "calculator" as const,
    count: 54,
  },
  {
    name: "Science",
    nameLocal: "विज्ञान",
    color: "#06B6D4",
    icon: "flask" as const,
    count: 41,
  },
  {
    name: "English",
    nameLocal: "अंग्रेज़ी",
    color: "#F97316",
    icon: "book" as const,
    count: 29,
  },
  {
    name: "Social Studies",
    nameLocal: "सामाजिक",
    color: "#10B981",
    icon: "globe" as const,
    count: 18,
  },
];

const FEATURES = [
  {
    icon: "scan" as const,
    title: "OCR Scanner",
    subtitle: "Extract text from images",
    iconBg: "#7C3AED",
  },
  {
    icon: "list" as const,
    title: "Step-by-Step",
    subtitle: "Detailed explanations",
    iconBg: "#06B6D4",
  },
  {
    icon: "language" as const,
    title: "Hindi Support",
    subtitle: "हिंदी में जवाब पाएं",
    iconBg: "#F97316",
  },
  {
    icon: "bookmark" as const,
    title: "Save Answers",
    subtitle: "Revisit anytime",
    iconBg: "#10B981",
  },
];

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { questions, savedQuestions, streak, badges, toggleSave } = useStudy();

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const recentQuestions = questions.slice(0, 3);

  return (
    <ScrollView
      style={[styles.scroll, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.content,
        { paddingTop: topPad + 8, paddingBottom: 100 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={styles.logoRow}>
          <View style={[styles.logoBox, { backgroundColor: colors.secondary }]}>
            <Ionicons name="school" size={18} color={colors.primary} />
          </View>
          <Text style={[styles.logoText, { color: colors.foreground }]}>AIStudyHelper</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity hitSlop={8}>
            <Ionicons name="notifications-outline" size={22} color={colors.foreground} />
          </TouchableOpacity>
          <TouchableOpacity hitSlop={8}>
            <Ionicons name="moon-outline" size={22} color={colors.foreground} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Gradient Banner */}
      <LinearGradient
        colors={["#7C3AED", "#C026D3", "#F43F5E"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.banner}
      >
        <View style={styles.bannerBadge}>
          <Ionicons name="sparkles" size={12} color="#fff" />
          <Text style={styles.bannerBadgeText}>AI POWERED</Text>
        </View>
        <Text style={styles.bannerGreeting}>नमस्ते!</Text>
        <Text style={styles.bannerTitle}>Ready to study smarter?</Text>
        <Text style={styles.bannerSub}>
          Ask any question in Hindi or English. Get step-by-step answers instantly — free for all students.
        </Text>
        <TouchableOpacity
          style={styles.bannerBtn}
          onPress={() => router.push("/(tabs)/ask")}
          activeOpacity={0.85}
        >
          <Text style={styles.bannerBtnText}>Start Studying</Text>
          <Ionicons name="arrow-forward" size={16} color="#7C3AED" />
        </TouchableOpacity>
      </LinearGradient>

      {/* Stats */}
      <View style={styles.statsRow}>
        <StatCard value={questions.length} label="Questions" icon="help-circle-outline" color={colors.statQuestions ?? colors.primary} />
        <StatCard value={savedQuestions.length} label="Saved" icon="bookmark-outline" color={colors.statSaved ?? "#06B6D4"} />
        <StatCard value={streak} label="Day Streak" icon="flame-outline" color={colors.statStreak ?? "#F97316"} />
        <StatCard value={badges} label="Badges" icon="trophy-outline" color={colors.statBadges ?? "#EAB308"} />
      </View>

      {/* Subjects */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Subjects</Text>
        <TouchableOpacity hitSlop={8}>
          <Text style={[styles.viewAll, { color: colors.primary }]}>View all</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.subjectsGrid}>
        <View style={styles.subjectsRow}>
          {SUBJECTS.slice(0, 2).map((s) => (
            <SubjectCard
              key={s.name}
              {...s}
              onPress={() => router.push({ pathname: "/(tabs)/ask", params: { subject: s.name } })}
            />
          ))}
        </View>
        <View style={styles.subjectsRow}>
          {SUBJECTS.slice(2).map((s) => (
            <SubjectCard
              key={s.name}
              {...s}
              onPress={() => router.push({ pathname: "/(tabs)/ask", params: { subject: s.name } })}
            />
          ))}
        </View>
      </View>

      {/* Features */}
      <Text style={[styles.sectionTitle, { color: colors.foreground, marginBottom: 12 }]}>Features</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.featuresRow}>
        {FEATURES.map((f) => (
          <FeatureCard key={f.title} {...f} />
        ))}
      </ScrollView>

      {/* Recent Questions */}
      <Text style={[styles.sectionTitle, { color: colors.foreground, marginBottom: 12, marginTop: 20 }]}>
        Recent Questions
      </Text>
      {recentQuestions.length === 0 ? (
        <View style={[styles.emptyBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="chatbubble-ellipses-outline" size={36} color={colors.mutedForeground} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No questions yet</Text>
          <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
            Ask your first question to see activity here
          </Text>
        </View>
      ) : (
        recentQuestions.map((q) => (
          <QuestionCard
            key={q.id}
            question={q}
            onToggleSave={toggleSave}
          />
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { paddingHorizontal: 16 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  logoRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  logoBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: { fontSize: 16, fontFamily: "Inter_700Bold" },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 14 },
  banner: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    gap: 6,
  },
  bannerBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 4,
  },
  bannerBadgeText: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1,
  },
  bannerGreeting: {
    color: "#fff",
    fontSize: 24,
    fontFamily: "Inter_700Bold",
  },
  bannerTitle: {
    color: "#fff",
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    lineHeight: 26,
  },
  bannerSub: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
    marginTop: 2,
  },
  bannerBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#fff",
    alignSelf: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 50,
    marginTop: 8,
  },
  bannerBtnText: {
    color: "#7C3AED",
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  statsRow: { flexDirection: "row", gap: 8, marginBottom: 20 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 16, fontFamily: "Inter_700Bold" },
  viewAll: { fontSize: 13, fontFamily: "Inter_500Medium" },
  subjectsGrid: { gap: 10, marginBottom: 20 },
  subjectsRow: { flexDirection: "row", gap: 10 },
  featuresRow: { gap: 10, paddingBottom: 4 },
  emptyBox: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 32,
    alignItems: "center",
    gap: 8,
  },
  emptyTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  emptySub: { fontSize: 12, fontFamily: "Inter_400Regular", textAlign: "center" },
});

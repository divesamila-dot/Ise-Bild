import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { useState } from "react";
import { Platform, Pressable, ScrollView, Share, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { QuestionCard } from "@/components/QuestionCard";
import { useStudy } from "@/context/StudyContext";
import { useColors } from "@/hooks/useColors";

export default function SavedScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { savedQuestions, toggleSave, deleteQuestion } = useStudy();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const filtered = search.trim()
    ? savedQuestions.filter(
        (q) =>
          q.question.toLowerCase().includes(search.toLowerCase()) ||
          q.subject.toLowerCase().includes(search.toLowerCase()) ||
          q.answer.toLowerCase().includes(search.toLowerCase())
      )
    : savedQuestions;

  const handleCopy = async (id: string) => {
    const q = savedQuestions.find((x) => x.id === id);
    if (!q) return;
    await Clipboard.setStringAsync(`Q: ${q.question}\n\nA: ${q.answer}`);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleShare = async (id: string) => {
    const q = savedQuestions.find((x) => x.id === id);
    if (!q) return;
    try {
      await Share.share({
        title: `Study Answer - ${q.subject}`,
        message: `📚 ${q.subject} — AIStudyHelper\n\nQ: ${q.question}\n\n${q.answer}`,
      });
    } catch {}
  };

  return (
    <ScrollView
      style={[styles.scroll, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { paddingTop: topPad + 8, paddingBottom: 100 }]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.pageTitle, { color: colors.foreground }]}>Saved</Text>
      <Text style={[styles.pageSub, { color: colors.mutedForeground }]}>
        {savedQuestions.length} saved answer{savedQuestions.length !== 1 ? "s" : ""}
      </Text>

      {/* Search bar */}
      {savedQuestions.length > 0 && (
        <View style={[styles.searchBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="search" size={16} color={colors.mutedForeground} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search saved answers..."
            placeholderTextColor={colors.mutedForeground}
            style={[styles.searchInput, { color: colors.foreground }]}
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch("")} hitSlop={8}>
              <Ionicons name="close-circle" size={16} color={colors.mutedForeground} />
            </Pressable>
          )}
        </View>
      )}

      {savedQuestions.length === 0 ? (
        <View style={[styles.emptyBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="bookmark-outline" size={44} color={colors.mutedForeground} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Nothing saved yet</Text>
          <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
            Bookmark answers in the Ask tab to revisit them here
          </Text>
        </View>
      ) : filtered.length === 0 ? (
        <View style={[styles.emptyBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="search-outline" size={44} color={colors.mutedForeground} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No results found</Text>
          <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>Try a different search term</Text>
        </View>
      ) : (
        filtered.map((q) => (
          <QuestionCard
            key={q.id}
            question={q}
            onToggleSave={toggleSave}
            onDelete={deleteQuestion}
            onCopy={handleCopy}
            onShare={handleShare}
            expanded={expandedId === q.id}
            onPress={() => setExpandedId(expandedId === q.id ? null : q.id)}
          />
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { paddingHorizontal: 16 },
  pageTitle: { fontSize: 24, fontFamily: "Inter_700Bold", marginBottom: 4 },
  pageSub: { fontSize: 13, fontFamily: "Inter_400Regular", marginBottom: 16 },
  searchBox: {
    flexDirection: "row", alignItems: "center", gap: 8,
    borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 12,
  },
  searchInput: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular" },
  emptyBox: {
    borderRadius: 16, borderWidth: 1, padding: 40,
    alignItems: "center", gap: 8, marginTop: 24,
  },
  emptyTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  emptySub: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center" },
});

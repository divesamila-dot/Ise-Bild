import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { QuestionCard } from "@/components/QuestionCard";
import { useStudy } from "@/context/StudyContext";
import { useColors } from "@/hooks/useColors";

export default function SavedScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { savedQuestions, toggleSave, deleteQuestion } = useStudy();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const topPad = Platform.OS === "web" ? 67 : insets.top;

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

      {savedQuestions.length === 0 ? (
        <View style={[styles.emptyBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="bookmark-outline" size={44} color={colors.mutedForeground} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Nothing saved yet</Text>
          <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
            Bookmark answers to revisit them here
          </Text>
        </View>
      ) : (
        savedQuestions.map((q) => (
          <QuestionCard
            key={q.id}
            question={q}
            onToggleSave={toggleSave}
            onDelete={deleteQuestion}
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
  pageSub: { fontSize: 13, fontFamily: "Inter_400Regular", marginBottom: 20 },
  emptyBox: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 40,
    alignItems: "center",
    gap: 8,
    marginTop: 24,
  },
  emptyTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  emptySub: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center" },
});

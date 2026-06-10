import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useColors } from "@/hooks/useColors";
import type { Question } from "@/context/StudyContext";

const SUBJECT_COLORS: Record<string, string> = {
  Mathematics: "#7C3AED",
  Science: "#06B6D4",
  English: "#F97316",
  "Social Studies": "#10B981",
  General: "#6B7280",
};

interface QuestionCardProps {
  question: Question;
  onToggleSave: (id: string) => void;
  onDelete?: (id: string) => void;
  expanded?: boolean;
  onPress?: () => void;
}

export function QuestionCard({
  question,
  onToggleSave,
  onDelete,
  expanded,
  onPress,
}: QuestionCardProps) {
  const colors = useColors();
  const subjectColor = SUBJECT_COLORS[question.subject] ?? "#6B7280";

  const handleSave = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onToggleSave(question.id);
  };

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          opacity: pressed ? 0.95 : 1,
        },
      ]}
    >
      <View style={styles.header}>
        <View style={[styles.subjectBadge, { backgroundColor: subjectColor + "22" }]}>
          <Text style={[styles.subjectText, { color: subjectColor }]}>
            {question.subject}
          </Text>
        </View>
        <View style={styles.actions}>
          {question.language === "hi" && (
            <View style={[styles.langBadge, { backgroundColor: colors.secondary }]}>
              <Text style={[styles.langText, { color: colors.primary }]}>हिंदी</Text>
            </View>
          )}
          <Pressable onPress={handleSave} hitSlop={8}>
            <Ionicons
              name={question.saved ? "bookmark" : "bookmark-outline"}
              size={18}
              color={question.saved ? colors.primary : colors.mutedForeground}
            />
          </Pressable>
          {onDelete && (
            <Pressable onPress={() => onDelete(question.id)} hitSlop={8}>
              <Ionicons name="trash-outline" size={16} color={colors.destructive} />
            </Pressable>
          )}
        </View>
      </View>

      <Text style={[styles.question, { color: colors.foreground }]} numberOfLines={expanded ? undefined : 2}>
        {question.question}
      </Text>

      {expanded && (
        <View style={[styles.answerBox, { backgroundColor: colors.muted }]}>
          <Text style={[styles.answer, { color: colors.foreground }]}>
            {question.answer}
          </Text>
        </View>
      )}

      <Text style={[styles.time, { color: colors.mutedForeground }]}>
        {new Date(question.createdAt).toLocaleDateString()}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 8,
    marginBottom: 10,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  subjectBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  subjectText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  langBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  langText: {
    fontSize: 10,
    fontFamily: "Inter_500Medium",
  },
  question: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    lineHeight: 20,
  },
  answerBox: {
    borderRadius: 10,
    padding: 12,
    marginTop: 4,
  },
  answer: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
  },
  time: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
  },
});

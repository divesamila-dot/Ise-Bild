import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useState } from "react";
import { Pressable, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { StepAnswer } from "@/components/StepAnswer";
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
  onCopy?: (id: string) => void;
  onShare?: (id: string) => void;
  expanded?: boolean;
  onPress?: () => void;
}

export function QuestionCard({
  question,
  onToggleSave,
  onDelete,
  onCopy,
  onShare,
  expanded,
  onPress,
}: QuestionCardProps) {
  const colors = useColors();
  const subjectColor = SUBJECT_COLORS[question.subject] ?? "#6B7280";
  const [copied, setCopied] = useState(false);

  const handleSave = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onToggleSave(question.id);
  };

  const handleCopy = () => {
    if (!onCopy) return;
    onCopy(question.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = () => {
    onShare?.(question.id);
  };

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.95 : 1 },
      ]}
    >
      <View style={styles.header}>
        <View style={[styles.subjectBadge, { backgroundColor: subjectColor + "22" }]}>
          <Text style={[styles.subjectText, { color: subjectColor }]}>{question.subject}</Text>
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
        <>
          <View style={[styles.answerBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <StepAnswer answer={question.answer} subjectColor={subjectColor} />
          </View>

          {/* Copy / Share actions */}
          {(onCopy || onShare) && (
            <View style={[styles.actionRow, { borderTopColor: colors.border }]}>
              {onCopy && (
                <TouchableOpacity onPress={handleCopy} style={[styles.actionBtn, { backgroundColor: colors.muted }]}>
                  <Ionicons name={copied ? "checkmark" : "copy-outline"} size={14} color={copied ? "#10B981" : colors.mutedForeground} />
                  <Text style={[styles.actionText, { color: copied ? "#10B981" : colors.mutedForeground }]}>
                    {copied ? "Copied!" : "Copy"}
                  </Text>
                </TouchableOpacity>
              )}
              {onShare && (
                <TouchableOpacity onPress={handleShare} style={[styles.actionBtn, { backgroundColor: colors.muted }]}>
                  <Ionicons name="share-outline" size={14} color={colors.mutedForeground} />
                  <Text style={[styles.actionText, { color: colors.mutedForeground }]}>Share</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </>
      )}

      <View style={styles.footer}>
        <Text style={[styles.time, { color: colors.mutedForeground }]}>
          {new Date(question.createdAt).toLocaleDateString()}
        </Text>
        <Ionicons
          name={expanded ? "chevron-up" : "chevron-down"}
          size={14}
          color={colors.mutedForeground}
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 8, marginBottom: 10 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  subjectBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  subjectText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  actions: { flexDirection: "row", alignItems: "center", gap: 10 },
  langBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5 },
  langText: { fontSize: 10, fontFamily: "Inter_500Medium" },
  question: { fontSize: 14, fontFamily: "Inter_500Medium", lineHeight: 20 },
  answerBox: { borderRadius: 12, borderWidth: 1, padding: 14, marginTop: 4 },
  actionRow: {
    flexDirection: "row", gap: 8, paddingTop: 8,
    borderTopWidth: 1, marginTop: 4,
  },
  actionBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 5, paddingVertical: 7, borderRadius: 8,
  },
  actionText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  footer: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  time: { fontSize: 10, fontFamily: "Inter_400Regular" },
});

import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useStudy, type Question } from "@/context/StudyContext";
import { useColors } from "@/hooks/useColors";

const SUBJECTS = ["Mathematics", "Science", "English", "Social Studies", "General"];

const SUBJECT_COLORS: Record<string, string> = {
  Mathematics: "#7C3AED",
  Science: "#06B6D4",
  English: "#F97316",
  "Social Studies": "#10B981",
  General: "#6B7280",
};

export default function AskScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { subject: paramSubject } = useLocalSearchParams<{ subject?: string }>();
  const { askQuestion, isAsking, toggleSave } = useStudy();

  const [selectedSubject, setSelectedSubject] = useState(paramSubject ?? "Mathematics");
  const [language, setLanguage] = useState<"en" | "hi">("en");
  const [questionText, setQuestionText] = useState("");
  const [result, setResult] = useState<Question | null>(null);
  const [error, setError] = useState<string | null>(null);

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  useEffect(() => {
    if (paramSubject && SUBJECTS.includes(paramSubject)) {
      setSelectedSubject(paramSubject);
    }
  }, [paramSubject]);

  const handleAsk = async () => {
    if (!questionText.trim() || isAsking) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setError(null);
    setResult(null);
    try {
      const res = await askQuestion(questionText.trim(), selectedSubject, language);
      if (res) {
        setResult(res);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Could not get an answer. Please try again.";
      setError(msg);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const subjectColor = SUBJECT_COLORS[selectedSubject] ?? "#6B7280";

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={0}
    >
    <ScrollView
      style={[styles.scroll, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { paddingTop: topPad + 8, paddingBottom: 120 }]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.pageTitle, { color: colors.foreground }]}>Ask a Question</Text>
      <Text style={[styles.pageSub, { color: colors.mutedForeground }]}>
        Get instant AI-powered answers
      </Text>

      {/* Subject picker */}
      <Text style={[styles.label, { color: colors.foreground }]}>Subject</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.subjectScroll}>
        {SUBJECTS.map((s) => {
          const active = s === selectedSubject;
          const col = SUBJECT_COLORS[s] ?? "#6B7280";
          return (
            <Pressable
              key={s}
              onPress={() => setSelectedSubject(s)}
              style={[
                styles.subjectChip,
                {
                  backgroundColor: active ? col : colors.card,
                  borderColor: active ? col : colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.subjectChipText,
                  { color: active ? "#fff" : colors.mutedForeground },
                ]}
              >
                {s}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Language toggle */}
      <Text style={[styles.label, { color: colors.foreground }]}>Language</Text>
      <View style={[styles.langToggle, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {(["en", "hi"] as const).map((l) => (
          <Pressable
            key={l}
            onPress={() => setLanguage(l)}
            style={[
              styles.langOption,
              { backgroundColor: language === l ? colors.primary : "transparent" },
            ]}
          >
            <Text
              style={[
                styles.langOptionText,
                { color: language === l ? "#fff" : colors.mutedForeground },
              ]}
            >
              {l === "en" ? "English" : "हिंदी"}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Question input */}
      <Text style={[styles.label, { color: colors.foreground }]}>Your Question</Text>
      <View style={[styles.inputBox, { backgroundColor: colors.card, borderColor: questionText ? subjectColor : colors.border }]}>
        <TextInput
          value={questionText}
          onChangeText={setQuestionText}
          placeholder="Type your question here..."
          placeholderTextColor={colors.mutedForeground}
          multiline
          style={[styles.input, { color: colors.foreground }]}
          textAlignVertical="top"
          returnKeyType="default"
        />
        {questionText.length > 0 && (
          <Pressable onPress={() => setQuestionText("")} hitSlop={8} style={styles.clearBtn}>
            <Ionicons name="close-circle" size={18} color={colors.mutedForeground} />
          </Pressable>
        )}
      </View>

      {/* Ask Button */}
      <TouchableOpacity
        onPress={handleAsk}
        disabled={isAsking || !questionText.trim()}
        activeOpacity={0.85}
        style={[
          styles.askBtn,
          {
            backgroundColor: !questionText.trim() || isAsking ? colors.muted : subjectColor,
          },
        ]}
      >
        {isAsking ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <>
            <Ionicons name="send" size={16} color={!questionText.trim() ? colors.mutedForeground : "#fff"} />
            <Text
              style={[
                styles.askBtnText,
                { color: !questionText.trim() ? colors.mutedForeground : "#fff" },
              ]}
            >
              Get Answer
            </Text>
          </>
        )}
      </TouchableOpacity>

      {/* Loading state */}
      {isAsking && (
        <View style={[styles.loadingBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <ActivityIndicator color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
            {language === "hi" ? "जवाब तैयार हो रहा है..." : "Getting your answer..."}
          </Text>
        </View>
      )}

      {/* Error */}
      {error && (
        <View style={[styles.errorBox, { backgroundColor: "#FEF2F2", borderColor: "#FECACA" }]}>
          <Ionicons name="alert-circle" size={18} color={colors.destructive} />
          <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text>
        </View>
      )}

      {/* Answer */}
      {result && (
        <View style={[styles.answerCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.answerHeader}>
            <View style={[styles.answerBadge, { backgroundColor: subjectColor + "22" }]}>
              <Ionicons name="sparkles" size={12} color={subjectColor} />
              <Text style={[styles.answerBadgeText, { color: subjectColor }]}>AI Answer</Text>
            </View>
            <Pressable
              onPress={() => toggleSave(result.id)}
              hitSlop={8}
              style={[
                styles.saveBtn,
                {
                  backgroundColor: result.saved ? colors.primary + "15" : colors.muted,
                },
              ]}
            >
              <Ionicons
                name={result.saved ? "bookmark" : "bookmark-outline"}
                size={16}
                color={result.saved ? colors.primary : colors.mutedForeground}
              />
              <Text
                style={[
                  styles.saveBtnText,
                  { color: result.saved ? colors.primary : colors.mutedForeground },
                ]}
              >
                {result.saved ? "Saved" : "Save"}
              </Text>
            </Pressable>
          </View>

          <Text style={[styles.questionPreview, { color: colors.mutedForeground }]}>
            {result.question}
          </Text>

          <View style={[styles.answerDivider, { backgroundColor: colors.border }]} />

          <Text style={[styles.answerText, { color: colors.foreground }]}>{result.answer}</Text>

          <Pressable
            onPress={() => {
              setQuestionText("");
              setResult(null);
              setError(null);
            }}
            style={[styles.newQuestionBtn, { borderColor: colors.border }]}
          >
            <Ionicons name="add-circle-outline" size={16} color={colors.primary} />
            <Text style={[styles.newQuestionText, { color: colors.primary }]}>Ask another question</Text>
          </Pressable>
        </View>
      )}
    </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { paddingHorizontal: 16, gap: 0 },
  pageTitle: { fontSize: 24, fontFamily: "Inter_700Bold", marginBottom: 4 },
  pageSub: { fontSize: 13, fontFamily: "Inter_400Regular", marginBottom: 20 },
  label: { fontSize: 13, fontFamily: "Inter_600SemiBold", marginBottom: 8, marginTop: 16 },
  subjectScroll: { gap: 8, paddingBottom: 4 },
  subjectChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 50,
    borderWidth: 1.5,
  },
  subjectChipText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  langToggle: {
    flexDirection: "row",
    borderRadius: 10,
    borderWidth: 1,
    padding: 3,
    gap: 3,
  },
  langOption: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
  },
  langOptionText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  inputBox: {
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 14,
    minHeight: 110,
    marginTop: 0,
  },
  input: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    lineHeight: 22,
    flex: 1,
  },
  clearBtn: { alignSelf: "flex-end", marginTop: 4 },
  askBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 16,
  },
  askBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  loadingBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 12,
  },
  loadingText: { fontSize: 13, fontFamily: "Inter_400Regular" },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 12,
  },
  errorText: { fontSize: 13, fontFamily: "Inter_500Medium", flex: 1 },
  answerCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginTop: 16,
    gap: 10,
  },
  answerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  answerBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  answerBadgeText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  saveBtnText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  questionPreview: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    fontStyle: "italic",
    lineHeight: 18,
  },
  answerDivider: { height: 1, marginVertical: 2 },
  answerText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    lineHeight: 22,
  },
  newQuestionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 4,
  },
  newQuestionText: { fontSize: 13, fontFamily: "Inter_500Medium" },
});

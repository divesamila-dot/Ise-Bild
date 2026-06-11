import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StepAnswer } from "@/components/StepAnswer";
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
  const router = useRouter();
  const { subject: paramSubject } = useLocalSearchParams<{ subject?: string }>();
  const { askQuestion, scanImage, isAsking, toggleSave, apiKey, serverReady } = useStudy();

  const [selectedSubject, setSelectedSubject] = useState(paramSubject ?? "Mathematics");
  const [language, setLanguage] = useState<"en" | "hi">("en");
  const [deepResearch, setDeepResearch] = useState(false);
  const [questionText, setQuestionText] = useState("");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState<Question | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const subjectColor = SUBJECT_COLORS[selectedSubject] ?? "#6B7280";

  useEffect(() => {
    if (paramSubject && SUBJECTS.includes(paramSubject)) setSelectedSubject(paramSubject);
  }, [paramSubject]);

  const handleAsk = async () => {
    if (!questionText.trim() || isAsking) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setError(null);
    setResult(null);
    try {
      const res = await askQuestion(questionText.trim(), selectedSubject, language, deepResearch);
      if (res) {
        setResult(res);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 200);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Could not get an answer. Please try again.";
      setError(msg);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const pickImage = async (fromCamera: boolean) => {
    try {
      if (fromCamera) {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (!perm.granted) { Alert.alert("Permission needed", "Camera access is required."); return; }
      } else {
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!perm.granted) { Alert.alert("Permission needed", "Gallery access is required."); return; }
      }

      const result = await (fromCamera
        ? ImagePicker.launchCameraAsync({ base64: true, quality: 0.5, allowsEditing: true })
        : ImagePicker.launchImageLibraryAsync({ base64: true, quality: 0.5, allowsEditing: true, mediaTypes: ["images"] }));

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setImageUri(asset.uri);
        if (asset.base64) {
          await handleOCR(asset.base64, asset.mimeType ?? "image/jpeg");
        }
      }
    } catch {
      setError("Could not access image. Please try again.");
    }
  };

  const handleOCR = async (base64: string, mimeType: string) => {
    if (!apiKey) {
      setError("Please add your Groq API key in Settings to use OCR scanner.");
      return;
    }
    setIsScanning(true);
    setError(null);
    try {
      const extracted = await scanImage(base64, mimeType);
      if (extracted.trim()) {
        setQuestionText(extracted.trim());
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        setError("No text detected. Try a clearer photo.");
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "OCR failed. Please try again.");
    } finally {
      setIsScanning(false);
    }
  };

  const handleCopy = async () => {
    if (!result?.answer) return;
    await Clipboard.setStringAsync(`Q: ${result.question}\n\nA: ${result.answer}`);
    setCopied(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (!result?.answer) return;
    try {
      await Share.share({
        title: `Study Answer - ${result.subject}`,
        message: `📚 ${result.subject} — AIStudyHelper\n\nQ: ${result.question}\n\n${result.answer}`,
      });
    } catch {}
  };

  const handleDownload = async () => {
    if (!result?.answer) return;
    if (Platform.OS === "web") {
      const text = `Q: ${result.question}\n\n${result.answer}`;
      const blob = new Blob([text], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = "answer.txt"; a.click();
      URL.revokeObjectURL(url);
    } else {
      await handleShare();
    }
  };

  const resetForm = () => {
    setQuestionText(""); setResult(null); setError(null);
    setImageUri(null); setCopied(false);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"} keyboardVerticalOffset={0}>
      <ScrollView
        ref={scrollRef}
        style={[styles.scroll, { backgroundColor: colors.background }]}
        contentContainerStyle={[styles.content, { paddingTop: topPad + 8, paddingBottom: 120 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.pageTitle, { color: colors.foreground }]}>Ask a Question</Text>
        <Text style={[styles.pageSub, { color: colors.mutedForeground }]}>
          Get instant AI-powered step-by-step answers
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
                style={[styles.subjectChip, { backgroundColor: active ? col : colors.card, borderColor: active ? col : colors.border }]}
              >
                <Text style={[styles.subjectChipText, { color: active ? "#fff" : colors.mutedForeground }]}>{s}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Language + Deep Research row */}
        <View style={styles.controlsRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.label, { color: colors.foreground }]}>Language</Text>
            <View style={[styles.langToggle, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {(["en", "hi"] as const).map((l) => (
                <Pressable
                  key={l}
                  onPress={() => setLanguage(l)}
                  style={[styles.langOption, { backgroundColor: language === l ? colors.primary : "transparent" }]}
                >
                  <Text style={[styles.langOptionText, { color: language === l ? "#fff" : colors.mutedForeground }]}>
                    {l === "en" ? "English" : "हिंदी"}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.deepBox}>
            <Text style={[styles.label, { color: colors.foreground }]}>Deep Research</Text>
            <View style={[styles.deepRow, { backgroundColor: colors.card, borderColor: deepResearch ? "#F97316" : colors.border }]}>
              <Ionicons name="search" size={14} color={deepResearch ? "#F97316" : colors.mutedForeground} />
              <Switch
                value={deepResearch}
                onValueChange={(v) => { setDeepResearch(v); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                trackColor={{ false: colors.muted, true: "#F9731644" }}
                thumbColor={deepResearch ? "#F97316" : colors.mutedForeground}
                style={{ transform: [{ scaleX: 0.85 }, { scaleY: 0.85 }] }}
              />
            </View>
          </View>
        </View>

        {/* Question input */}
        <Text style={[styles.label, { color: colors.foreground }]}>Your Question</Text>
        <View style={[styles.inputBox, { backgroundColor: colors.card, borderColor: questionText ? subjectColor : colors.border }]}>
          <TextInput
            value={questionText}
            onChangeText={setQuestionText}
            placeholder={isScanning ? "Scanning image..." : "Type your question or use camera..."}
            placeholderTextColor={colors.mutedForeground}
            multiline
            editable={!isScanning}
            style={[styles.input, { color: colors.foreground }]}
            textAlignVertical="top"
            returnKeyType="default"
          />

          {/* Image preview */}
          {imageUri && (
            <View style={styles.imgPreviewRow}>
              <Image source={{ uri: imageUri }} style={styles.imgThumb} />
              <Pressable onPress={() => { setImageUri(null); }} hitSlop={8} style={styles.imgRemove}>
                <Ionicons name="close-circle" size={18} color={colors.destructive} />
              </Pressable>
              {isScanning && (
                <View style={styles.scanningOverlay}>
                  <ActivityIndicator size="small" color={subjectColor} />
                  <Text style={[styles.scanningText, { color: subjectColor }]}>Scanning...</Text>
                </View>
              )}
            </View>
          )}

          {/* Input toolbar */}
          <View style={styles.inputToolbar}>
            <TouchableOpacity onPress={() => pickImage(true)} style={[styles.toolbarBtn, { backgroundColor: colors.muted }]} hitSlop={4}>
              <Ionicons name="camera" size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => pickImage(false)} style={[styles.toolbarBtn, { backgroundColor: colors.muted }]} hitSlop={4}>
              <Ionicons name="images" size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
            <View style={{ flex: 1 }} />
            {questionText.length > 0 && (
              <Pressable onPress={() => { setQuestionText(""); setImageUri(null); }} hitSlop={8}>
                <Ionicons name="close-circle" size={18} color={colors.mutedForeground} />
              </Pressable>
            )}
          </View>
        </View>

        {deepResearch && (
          <View style={[styles.deepBanner, { backgroundColor: "#F9731611", borderColor: "#F9731633" }]}>
            <Ionicons name="search" size={13} color="#F97316" />
            <Text style={[styles.deepBannerText, { color: "#F97316" }]}>
              Deep Research ON — detailed multi-angle explanation (slower)
            </Text>
          </View>
        )}

        {/* Ask button */}
        <TouchableOpacity
          onPress={handleAsk}
          disabled={isAsking || !questionText.trim() || isScanning}
          activeOpacity={0.85}
          style={[styles.askBtn, { backgroundColor: !questionText.trim() || isAsking ? colors.muted : subjectColor }]}
        >
          {isAsking ? (
            <>
              <ActivityIndicator color="#fff" size="small" />
              <Text style={styles.askBtnText}>{deepResearch ? "Researching..." : "Getting answer..."}</Text>
            </>
          ) : (
            <>
              <Ionicons name={deepResearch ? "search" : "send"} size={16} color={!questionText.trim() ? colors.mutedForeground : "#fff"} />
              <Text style={[styles.askBtnText, { color: !questionText.trim() ? colors.mutedForeground : "#fff" }]}>
                {deepResearch ? "Deep Research" : "Get Answer"}
              </Text>
            </>
          )}
        </TouchableOpacity>

        {/* No API key warning — only show if neither local key nor server key is set */}
        {!apiKey && !serverReady && (
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/settings")}
            style={[styles.noKeyBanner, { backgroundColor: "#FEF3C7", borderColor: "#FDE68A" }]}
          >
            <Ionicons name="warning" size={16} color="#D97706" />
            <Text style={[styles.noKeyText, { color: "#92400E" }]}>
              No API key set. Tap to add your free Groq key in Settings →
            </Text>
          </TouchableOpacity>
        )}

        {/* Error */}
        {error && (
          <View style={[styles.errorBox, { backgroundColor: "#FEF2F2", borderColor: "#FECACA" }]}>
            <Ionicons name="alert-circle" size={18} color="#DC2626" />
            <Text style={[styles.errorText, { color: "#DC2626" }]}>{error}</Text>
          </View>
        )}

        {/* Answer card */}
        {result && (
          <View style={[styles.answerCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {/* Header */}
            <View style={styles.answerHeader}>
              <View style={[styles.answerBadge, { backgroundColor: subjectColor + "22" }]}>
                <Ionicons name={deepResearch ? "search" : "sparkles"} size={12} color={subjectColor} />
                <Text style={[styles.answerBadgeText, { color: subjectColor }]}>
                  {deepResearch ? "Deep Research" : "AI Answer"}
                </Text>
              </View>
              <Pressable
                onPress={() => toggleSave(result.id)}
                style={[styles.saveBtn, { backgroundColor: result.saved ? colors.primary + "15" : colors.muted }]}
              >
                <Ionicons name={result.saved ? "bookmark" : "bookmark-outline"} size={16} color={result.saved ? colors.primary : colors.mutedForeground} />
                <Text style={[styles.saveBtnText, { color: result.saved ? colors.primary : colors.mutedForeground }]}>
                  {result.saved ? "Saved" : "Save"}
                </Text>
              </Pressable>
            </View>

            <Text style={[styles.questionPreview, { color: colors.mutedForeground }]}>{result.question}</Text>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <StepAnswer answer={result.answer} subjectColor={subjectColor} />

            {/* Action buttons */}
            <View style={[styles.actionRow, { borderTopColor: colors.border }]}>
              <TouchableOpacity onPress={handleCopy} style={[styles.actionBtn, { backgroundColor: colors.muted }]}>
                <Ionicons name={copied ? "checkmark" : "copy-outline"} size={15} color={copied ? "#10B981" : colors.mutedForeground} />
                <Text style={[styles.actionBtnText, { color: copied ? "#10B981" : colors.mutedForeground }]}>
                  {copied ? "Copied!" : "Copy"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleShare} style={[styles.actionBtn, { backgroundColor: colors.muted }]}>
                <Ionicons name="share-outline" size={15} color={colors.mutedForeground} />
                <Text style={[styles.actionBtnText, { color: colors.mutedForeground }]}>Share</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleDownload} style={[styles.actionBtn, { backgroundColor: colors.muted }]}>
                <Ionicons name="download-outline" size={15} color={colors.mutedForeground} />
                <Text style={[styles.actionBtnText, { color: colors.mutedForeground }]}>Download</Text>
              </TouchableOpacity>
            </View>

            <Pressable onPress={resetForm} style={[styles.newQuestionBtn, { borderColor: colors.border }]}>
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
  subjectChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 50, borderWidth: 1.5 },
  subjectChipText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  controlsRow: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  langToggle: { flexDirection: "row", borderRadius: 10, borderWidth: 1, padding: 3, gap: 3 },
  langOption: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: "center" },
  langOptionText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  deepBox: { alignItems: "flex-start" },
  deepRow: {
    flexDirection: "row", alignItems: "center", gap: 6,
    borderRadius: 10, borderWidth: 1.5, paddingHorizontal: 10, paddingVertical: 6,
  },
  inputBox: { borderRadius: 14, borderWidth: 1.5, padding: 14, minHeight: 110 },
  input: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 22, flex: 1, minHeight: 60 },
  imgPreviewRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8 },
  imgThumb: { width: 60, height: 60, borderRadius: 8 },
  imgRemove: { position: "absolute", top: -6, left: 48 },
  scanningOverlay: { flexDirection: "row", alignItems: "center", gap: 6, marginLeft: 8 },
  scanningText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  inputToolbar: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8 },
  toolbarBtn: { padding: 7, borderRadius: 8 },
  deepBanner: {
    flexDirection: "row", alignItems: "center", gap: 6,
    padding: 10, borderRadius: 8, borderWidth: 1, marginTop: 8,
  },
  deepBannerText: { fontSize: 11, fontFamily: "Inter_500Medium", flex: 1 },
  askBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: 14, borderRadius: 14, marginTop: 16,
  },
  askBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#fff" },
  noKeyBanner: {
    flexDirection: "row", alignItems: "center", gap: 8,
    padding: 12, borderRadius: 12, borderWidth: 1, marginTop: 10,
  },
  noKeyText: { fontSize: 12, fontFamily: "Inter_500Medium", flex: 1 },
  errorBox: {
    flexDirection: "row", alignItems: "flex-start", gap: 8,
    padding: 14, borderRadius: 12, borderWidth: 1, marginTop: 12,
  },
  errorText: { fontSize: 13, fontFamily: "Inter_500Medium", flex: 1 },
  answerCard: { borderRadius: 16, borderWidth: 1, padding: 16, marginTop: 16, gap: 10 },
  answerHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  answerBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6,
  },
  answerBadgeText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  saveBtn: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8,
  },
  saveBtnText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  questionPreview: { fontSize: 13, fontFamily: "Inter_400Regular", fontStyle: "italic", lineHeight: 18 },
  divider: { height: 1, marginVertical: 2 },
  actionRow: {
    flexDirection: "row", gap: 8, paddingTop: 10,
    borderTopWidth: 1, marginTop: 4,
  },
  actionBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 5, paddingVertical: 8, borderRadius: 10,
  },
  actionBtnText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  newQuestionBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, paddingVertical: 10, borderRadius: 10, borderWidth: 1, marginTop: 4,
  },
  newQuestionText: { fontSize: 13, fontFamily: "Inter_500Medium" },
});

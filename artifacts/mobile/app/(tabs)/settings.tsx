import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Linking, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useState } from "react";
import { useStudy } from "@/context/StudyContext";
import { useColors } from "@/hooks/useColors";

export default function SettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { apiKey, setApiKey } = useStudy();

  const [inputKey, setInputKey] = useState(apiKey);
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<"success" | "error" | null>(null);

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const handleSave = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await setApiKey(inputKey.trim());
    setSaved(true);
    setTestResult(null);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleClear = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setInputKey("");
    setTestResult(null);
    await setApiKey("");
  };

  const handleTest = async () => {
    const keyToTest = inputKey.trim();
    if (!keyToTest) return;
    setTesting(true);
    setTestResult(null);
    try {
      const domain = process.env["EXPO_PUBLIC_DOMAIN"];
      const base = domain ? `https://${domain}` : "";
      const r = await fetch(`${base}/api/study/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Groq-Key": keyToTest },
        body: JSON.stringify({ question: "Say hello in one word", subject: "General", language: "en" }),
        signal: AbortSignal.timeout(15000),
      });
      if (r.ok) {
        setTestResult("success");
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        setTestResult("error");
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } catch {
      setTestResult("error");
    } finally {
      setTesting(false);
    }
  };

  const isKeySet = inputKey.trim().length > 0;

  return (
    <ScrollView
      style={[styles.scroll, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { paddingTop: topPad + 8, paddingBottom: 100 }]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.pageTitle, { color: colors.foreground }]}>Settings</Text>
      <Text style={[styles.pageSub, { color: colors.mutedForeground }]}>Configure your AI assistant</Text>

      {/* API Key Card */}
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.cardHeader}>
          <View style={[styles.iconBox, { backgroundColor: "#7C3AED22" }]}>
            <Ionicons name="key" size={18} color="#7C3AED" />
          </View>
          <View style={styles.cardHeaderText}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>Groq API Key</Text>
            <Text style={[styles.cardSub, { color: colors.mutedForeground }]}>Powers AI answers + OCR scanner</Text>
          </View>
          <View style={[styles.statusDot, { backgroundColor: isKeySet ? "#10B981" : "#F97316" }]} />
        </View>

        <View style={[styles.inputRow, { backgroundColor: colors.muted, borderColor: colors.border }]}>
          <TextInput
            value={inputKey}
            onChangeText={(t) => { setInputKey(t); setTestResult(null); setSaved(false); }}
            placeholder="gsk_xxxxxxxxxxxxxxxx"
            placeholderTextColor={colors.mutedForeground}
            secureTextEntry={!showKey}
            autoCapitalize="none"
            autoCorrect={false}
            style={[styles.keyInput, { color: colors.foreground }]}
          />
          <TouchableOpacity onPress={() => setShowKey(!showKey)} hitSlop={8} style={styles.eyeBtn}>
            <Ionicons name={showKey ? "eye-off" : "eye"} size={18} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>

        {testResult === "success" && (
          <View style={[styles.testBanner, { backgroundColor: "#D1FAE5", borderColor: "#6EE7B7" }]}>
            <Ionicons name="checkmark-circle" size={16} color="#059669" />
            <Text style={[styles.testText, { color: "#065F46" }]}>Key is valid! AI is ready.</Text>
          </View>
        )}
        {testResult === "error" && (
          <View style={[styles.testBanner, { backgroundColor: "#FEE2E2", borderColor: "#FCA5A5" }]}>
            <Ionicons name="close-circle" size={16} color="#DC2626" />
            <Text style={[styles.testText, { color: "#991B1B" }]}>Invalid key. Please check and retry.</Text>
          </View>
        )}

        <View style={styles.btnRow}>
          <TouchableOpacity
            onPress={handleSave}
            disabled={!isKeySet}
            style={[styles.saveBtn, { backgroundColor: isKeySet ? "#7C3AED" : colors.muted }]}
          >
            <Ionicons name={saved ? "checkmark" : "save"} size={14} color={isKeySet ? "#fff" : colors.mutedForeground} />
            <Text style={[styles.saveBtnText, { color: isKeySet ? "#fff" : colors.mutedForeground }]}>
              {saved ? "Saved!" : "Save Key"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleTest}
            disabled={!isKeySet || testing}
            style={[styles.testBtn, { borderColor: isKeySet ? "#7C3AED" : colors.border }]}
          >
            <Ionicons name="flash" size={14} color={isKeySet ? "#7C3AED" : colors.mutedForeground} />
            <Text style={[styles.testBtnText, { color: isKeySet ? "#7C3AED" : colors.mutedForeground }]}>
              {testing ? "Testing..." : "Test"}
            </Text>
          </TouchableOpacity>

          {isKeySet && (
            <TouchableOpacity onPress={handleClear} style={[styles.clearBtn, { borderColor: colors.border }]}>
              <Ionicons name="trash-outline" size={14} color={colors.destructive} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* How to get key */}
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.cardHeader}>
          <View style={[styles.iconBox, { backgroundColor: "#06B6D422" }]}>
            <Ionicons name="information-circle" size={18} color="#06B6D4" />
          </View>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>How to get a free key</Text>
        </View>
        {[
          { num: "1", text: "Visit console.groq.com" },
          { num: "2", text: "Sign in with Google (free)" },
          { num: "3", text: "Go to API Keys → Create Key" },
          { num: "4", text: "Copy the key (starts with gsk_)" },
          { num: "5", text: "Paste it above and tap Save" },
        ].map((step) => (
          <View key={step.num} style={styles.stepRow}>
            <View style={[styles.stepNum, { backgroundColor: "#06B6D422" }]}>
              <Text style={[styles.stepNumText, { color: "#06B6D4" }]}>{step.num}</Text>
            </View>
            <Text style={[styles.stepText, { color: colors.foreground }]}>{step.text}</Text>
          </View>
        ))}
        <TouchableOpacity
          onPress={() => Linking.openURL("https://console.groq.com")}
          style={[styles.openBtn, { backgroundColor: "#06B6D422" }]}
        >
          <Ionicons name="open-outline" size={14} color="#06B6D4" />
          <Text style={[styles.openBtnText, { color: "#06B6D4" }]}>Open console.groq.com</Text>
        </TouchableOpacity>
      </View>

      {/* Features info */}
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.cardHeader}>
          <View style={[styles.iconBox, { backgroundColor: "#F9731622" }]}>
            <Ionicons name="sparkles" size={18} color="#F97316" />
          </View>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>What your key unlocks</Text>
        </View>
        {[
          { icon: "chatbubble-ellipses" as const, text: "AI step-by-step answers", color: "#7C3AED" },
          { icon: "scan" as const, text: "OCR text scanner from photos", color: "#06B6D4" },
          { icon: "search" as const, text: "Deep Research mode", color: "#F97316" },
          { icon: "language" as const, text: "Hindi & English support", color: "#10B981" },
        ].map((f) => (
          <View key={f.text} style={styles.featureRow}>
            <Ionicons name={f.icon} size={16} color={f.color} />
            <Text style={[styles.featureText, { color: colors.foreground }]}>{f.text}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { paddingHorizontal: 16, gap: 0 },
  pageTitle: { fontSize: 24, fontFamily: "Inter_700Bold", marginBottom: 4 },
  pageSub: { fontSize: 13, fontFamily: "Inter_400Regular", marginBottom: 20 },
  card: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 16, gap: 12 },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  iconBox: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  cardHeaderText: { flex: 1 },
  cardTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  cardSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 1 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  keyInput: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular", paddingVertical: 8 },
  eyeBtn: { padding: 4 },
  testBanner: { flexDirection: "row", alignItems: "center", gap: 6, padding: 10, borderRadius: 8, borderWidth: 1 },
  testText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  btnRow: { flexDirection: "row", gap: 8 },
  saveBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, paddingVertical: 10, borderRadius: 10,
  },
  saveBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  testBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10, borderWidth: 1.5,
  },
  testBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  clearBtn: {
    alignItems: "center", justifyContent: "center",
    paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1.5,
  },
  stepRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  stepNum: { width: 24, height: 24, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  stepNumText: { fontSize: 11, fontFamily: "Inter_700Bold" },
  stepText: { fontSize: 13, fontFamily: "Inter_400Regular", flex: 1 },
  openBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, paddingVertical: 10, borderRadius: 10,
  },
  openBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  featureRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  featureText: { fontSize: 13, fontFamily: "Inter_400Regular" },
});

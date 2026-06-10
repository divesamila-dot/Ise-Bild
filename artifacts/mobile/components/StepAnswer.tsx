import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { useColors } from "@/hooks/useColors";

interface ParsedBlock {
  type: "header" | "step" | "keypoints" | "finalAnswer" | "paragraph" | "bullet";
  stepNum?: number;
  text: string;
  color?: string;
}

const STEP_COLORS = ["#7C3AED", "#C026D3", "#0891B2", "#059669", "#EA580C", "#DC2626"];

function parseAnswer(raw: string): ParsedBlock[] {
  const blocks: ParsedBlock[] = [];
  const lines = raw.split("\n").map((l) => l.trim()).filter(Boolean);

  let inKeyPoints = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Strip markdown bold **text**
    const clean = line.replace(/\*\*(.*?)\*\*/g, "$1").replace(/\*(.*?)\*/g, "$1").trim();

    // Header line
    if (/^here.?s a step.?by.?step/i.test(clean)) {
      blocks.push({ type: "header", text: clean });
      inKeyPoints = false;
      continue;
    }

    // Step line: "Step 1:", "Step1:", "Step 1 -", "1.", "1)"
    const stepMatch = clean.match(/^(?:step\s*(\d+)[:\-.]?\s*(.*)$|^(\d+)[.)]\s+(.+)$)/i);
    if (stepMatch) {
      const num = parseInt(stepMatch[1] ?? stepMatch[3], 10);
      const text = (stepMatch[2] ?? stepMatch[4] ?? "").trim();
      if (text) {
        blocks.push({
          type: "step",
          stepNum: num,
          text,
          color: STEP_COLORS[(num - 1) % STEP_COLORS.length],
        });
      }
      inKeyPoints = false;
      continue;
    }

    // Key points / conclusion section header
    if (/^(key\s*points?|remember|summary|conclusion|important|note)[:\-]?$/i.test(clean)) {
      blocks.push({ type: "keypoints", text: clean.replace(/:$/, "") });
      inKeyPoints = true;
      continue;
    }

    // Final answer line
    if (/^(the\s+answer\s+is|final\s+answer|answer)[:\-]?\s*.+/i.test(clean)) {
      const text = clean.replace(/^(the\s+answer\s+is|final\s+answer|answer)[:\-]?\s*/i, "").trim();
      blocks.push({ type: "finalAnswer", text: text || clean });
      inKeyPoints = false;
      continue;
    }

    // Bullet point
    if (/^[-•*]\s+/.test(clean)) {
      blocks.push({ type: "bullet", text: clean.replace(/^[-•*]\s+/, ""), color: inKeyPoints ? "#7C3AED" : undefined });
      continue;
    }

    // Normal paragraph
    if (inKeyPoints) {
      blocks.push({ type: "bullet", text: clean, color: "#7C3AED" });
    } else {
      blocks.push({ type: "paragraph", text: clean });
    }
  }

  return blocks;
}

interface StepAnswerProps {
  answer: string;
  subjectColor: string;
}

export function StepAnswer({ answer, subjectColor }: StepAnswerProps) {
  const colors = useColors();
  const blocks = parseAnswer(answer);

  const stepBlocks = blocks.filter((b) => b.type === "step");
  const hasSteps = stepBlocks.length > 0;

  return (
    <View style={styles.container}>
      {blocks.map((block, idx) => {
        switch (block.type) {
          case "header":
            return (
              <View key={idx} style={styles.headerRow}>
                <Ionicons name="list" size={14} color={subjectColor} />
                <Text style={[styles.headerText, { color: subjectColor }]}>{block.text}</Text>
              </View>
            );

          case "step": {
            const col = block.color ?? subjectColor;
            return (
              <View key={idx} style={[styles.stepCard, { borderLeftColor: col, backgroundColor: col + "0D" }]}>
                <View style={[styles.stepBadge, { backgroundColor: col }]}>
                  <Text style={styles.stepBadgeText}>{block.stepNum}</Text>
                </View>
                <Text style={[styles.stepText, { color: colors.foreground }]}>{block.text}</Text>
              </View>
            );
          }

          case "keypoints":
            return (
              <View key={idx} style={styles.sectionHeader}>
                <Ionicons name="bookmark" size={13} color={subjectColor} />
                <Text style={[styles.sectionTitle, { color: subjectColor }]}>{block.text}</Text>
              </View>
            );

          case "bullet":
            return (
              <View key={idx} style={styles.bulletRow}>
                <View style={[styles.bulletDot, { backgroundColor: block.color ?? colors.mutedForeground }]} />
                <Text style={[styles.bulletText, { color: colors.foreground }]}>{block.text}</Text>
              </View>
            );

          case "finalAnswer":
            return (
              <View key={idx} style={[styles.finalCard, { backgroundColor: subjectColor + "18", borderColor: subjectColor + "44" }]}>
                <Ionicons name="checkmark-circle" size={18} color={subjectColor} />
                <View style={styles.finalTextWrap}>
                  <Text style={[styles.finalLabel, { color: subjectColor }]}>The Answer is</Text>
                  <Text style={[styles.finalValue, { color: colors.foreground }]}>{block.text}</Text>
                </View>
              </View>
            );

          case "paragraph":
          default:
            return (
              <Text key={idx} style={[styles.paragraph, { color: colors.foreground }]}>
                {block.text}
              </Text>
            );
        }
      })}

      {/* Fallback: if no steps were parsed, render raw text */}
      {!hasSteps && blocks.length === 0 && (
        <Text style={[styles.paragraph, { color: colors.foreground }]}>{answer}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 10 },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  headerText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },

  stepCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    borderLeftWidth: 3,
    borderRadius: 10,
    padding: 12,
  },
  stepBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginTop: 1,
  },
  stepBadgeText: {
    color: "#fff",
    fontSize: 11,
    fontFamily: "Inter_700Bold",
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    lineHeight: 21,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 6,
    marginBottom: 2,
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },

  bulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    paddingLeft: 4,
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 7,
    flexShrink: 0,
  },
  bulletText: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
  },

  finalCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginTop: 4,
  },
  finalTextWrap: { flex: 1 },
  finalLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 3,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  finalValue: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    lineHeight: 23,
  },

  paragraph: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    lineHeight: 21,
  },
});

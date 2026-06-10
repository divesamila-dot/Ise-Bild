import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useColors } from "@/hooks/useColors";

interface SubjectCardProps {
  name: string;
  nameLocal: string;
  count: number;
  color: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
}

export function SubjectCard({
  name,
  nameLocal,
  count,
  color,
  icon,
  onPress,
}: SubjectCardProps) {
  const colors = useColors();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: color, opacity: pressed ? 0.85 : 1 },
      ]}
    >
      <View style={[styles.iconBg, { backgroundColor: "rgba(255,255,255,0.2)" }]}>
        <Ionicons name={icon} size={22} color="#fff" />
      </View>
      <Text style={styles.name}>{name}</Text>
      <Text style={styles.nameLocal}>{nameLocal}</Text>
      <View style={styles.footer}>
        <Text style={styles.count}>{count} Qs</Text>
        <Ionicons name="chevron-forward" size={14} color="rgba(255,255,255,0.8)" />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 16,
    padding: 14,
    minHeight: 110,
    justifyContent: "space-between",
  },
  iconBg: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  name: {
    color: "#fff",
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  nameLocal: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    marginTop: 1,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
  },
  count: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
});

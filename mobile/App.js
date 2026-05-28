import { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StatusBar,
  Platform,
  Animated,
  Dimensions,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";

const API_URL = "http://localhost:8000";
const { width } = Dimensions.get("window");

// ─── Animated fade+slide wrapper ───────────────────────────────────────────
function FadeIn({ delay = 0, children, style }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 400, delay, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 400, delay, useNativeDriver: true }),
    ]).start();
  }, []);
  return (
    <Animated.View style={[{ opacity, transform: [{ translateY }] }, style]}>
      {children}
    </Animated.View>
  );
}

// ─── Skeleton loader block ──────────────────────────────────────────────────
function Skeleton({ width: w = "100%", height = 16, radius = 8, style }) {
  const pulse = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return (
    <Animated.View
      style={[
        { width: w, height, borderRadius: radius, backgroundColor: "#e2e8f0", opacity: pulse },
        style,
      ]}
    />
  );
}

// ─── Pulsing dot for loading ────────────────────────────────────────────────
function PulsingDot({ delay }) {
  const scale = useRef(new Animated.Value(0.6)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scale, { toValue: 1, duration: 600, delay, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 0.6, duration: 600, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return (
    <Animated.View
      style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: "#1e40af", transform: [{ scale }], marginHorizontal: 4 }}
    />
  );
}

export default function App() {
  const [screen, setScreen] = useState("home");
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  async function pickImage() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission required", "Allow access to your photo library.");
      return;
    }
    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!picked.canceled) {
      setImage(picked.assets[0]);
      await analyze(picked.assets[0]);
    }
  }

  async function captureImage() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission required", "Allow camera access.");
      return;
    }
    const captured = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    if (!captured.canceled) {
      setImage(captured.assets[0]);
      await analyze(captured.assets[0]);
    }
  }

  async function analyze(asset) {
    setLoading(true);
    setResult(null);
    setScreen("result");
    try {
      const form = new FormData();
      form.append("file", { uri: asset.uri, name: "culture.jpg", type: "image/jpeg" });
      const res = await fetch(`${API_URL}/predict`, { method: "POST", body: form });
      if (!res.ok) throw new Error("Server error");
      setResult(await res.json());
    } catch {
      Alert.alert("Connection Error", "Could not reach the server.\n\nMake sure the backend is running:\n\npython3 -m uvicorn backend.main:app --port 8000");
      setScreen("home");
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setScreen("home");
    setImage(null);
    setResult(null);
    setLoading(false);
  }

  function confColor(c) {
    if (c >= 0.7) return "#16a34a";
    if (c >= 0.4) return "#d97706";
    return "#dc2626";
  }
  function confLabel(c) {
    if (c >= 0.7) return "High Confidence";
    if (c >= 0.4) return "Medium Confidence";
    return "Low Confidence";
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" />

      {/* ── HEADER ── */}
      <LinearGradient colors={["#1e3a8a", "#1e40af", "#2563eb"]} style={styles.header}>
        <View style={styles.headerInner}>
          <View>
            <Text style={styles.headerTitle}>ASTPredict</Text>
            <Text style={styles.headerSub}>Bacterial Culture Analysis · AI Powered</Text>
          </View>
          <View style={styles.headerBadge}>
            <Text style={styles.headerBadgeText}>YOLOv8</Text>
          </View>
        </View>
      </LinearGradient>

      {/* ── HOME SCREEN ── */}
      {screen === "home" && (
        <ScrollView contentContainerStyle={styles.homeScroll} showsVerticalScrollIndicator={false}>

          {/* Hero */}
          <FadeIn delay={0}>
            <LinearGradient colors={["#eff6ff", "#dbeafe"]} style={styles.heroCard}>
              <View style={styles.heroIconCircle}>
                <Text style={styles.heroIconText}>🔬</Text>
              </View>
              <Text style={styles.heroTitle}>Culture Plate Analysis</Text>
              <Text style={styles.heroDesc}>
                Upload or capture a bacterial culture plate image. Our YOLOv8 AI identifies species with bounding-box precision across 24 bacterial classes.
              </Text>
            </LinearGradient>
          </FadeIn>

          {/* Buttons */}
          <FadeIn delay={100}>
            <TouchableOpacity activeOpacity={0.85} onPress={pickImage}>
              <LinearGradient colors={["#1e40af", "#2563eb"]} style={styles.btnPrimary}>
                <Text style={styles.btnIcon}>📁</Text>
                <View>
                  <Text style={styles.btnTitle}>Upload from Gallery</Text>
                  <Text style={styles.btnSubtitle}>Select a saved culture image</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </FadeIn>

          <FadeIn delay={180}>
            <TouchableOpacity style={styles.btnSecondary} activeOpacity={0.85} onPress={captureImage}>
              <Text style={styles.btnIcon}>📷</Text>
              <View>
                <Text style={[styles.btnTitle, { color: "#1e40af" }]}>Capture with Camera</Text>
                <Text style={[styles.btnSubtitle, { color: "#60a5fa" }]}>Take a photo of a culture plate</Text>
              </View>
            </TouchableOpacity>
          </FadeIn>

          {/* Info chips */}
          <FadeIn delay={260} style={styles.chipRow}>
            <Chip icon="🧫" label="24 Species" sub="Bacterial classes" />
            <Chip icon="⚡" label="Real-time" sub="Instant results" />
            <Chip icon="🎯" label="YOLOv8" sub="AI detection" />
          </FadeIn>

          {/* Disclaimer */}
          <FadeIn delay={340}>
            <View style={styles.disclaimerCard}>
              <Text style={styles.disclaimerTitle}>⚕ Research Use Only</Text>
              <Text style={styles.disclaimerText}>
                This tool is intended for research and educational purposes only. Results should not be used as a substitute for professional clinical diagnosis. Always consult a qualified microbiologist.
              </Text>
            </View>
          </FadeIn>
        </ScrollView>
      )}

      {/* ── RESULT SCREEN ── */}
      {screen === "result" && (
        <ScrollView contentContainerStyle={styles.resultScroll} showsVerticalScrollIndicator={false}>

          {/* Image preview */}
          {image && (
            <FadeIn>
              <View style={styles.imageCard}>
                <Image source={{ uri: image.uri }} style={styles.preview} resizeMode="cover" />
                <LinearGradient
                  colors={["transparent", "rgba(30,58,138,0.7)"]}
                  style={styles.imageOverlay}
                >
                  <Text style={styles.imageLabel}>Culture Plate Image</Text>
                </LinearGradient>
              </View>
            </FadeIn>
          )}

          {/* Loading skeleton */}
          {loading && (
            <FadeIn>
              <View style={styles.loadingCard}>
                <View style={styles.dotsRow}>
                  <PulsingDot delay={0} />
                  <PulsingDot delay={200} />
                  <PulsingDot delay={400} />
                </View>
                <Text style={styles.loadingTitle}>Analyzing Culture Plate</Text>
                <Text style={styles.loadingSubText}>Running YOLOv8 object detection…</Text>
                <View style={{ marginTop: 24, gap: 10 }}>
                  <Skeleton height={14} width="80%" style={{ alignSelf: "center" }} />
                  <Skeleton height={14} width="60%" style={{ alignSelf: "center" }} />
                  <Skeleton height={80} radius={12} style={{ marginTop: 8 }} />
                  <Skeleton height={80} radius={12} />
                </View>
              </View>
            </FadeIn>
          )}

          {/* Results */}
          {!loading && result && (
            <>
              {/* Stats row */}
              <FadeIn delay={0} style={styles.statsRow}>
                <LinearGradient colors={["#1e3a8a", "#1e40af"]} style={styles.statCard}>
                  <Text style={styles.statValue}>{result.total_colonies}</Text>
                  <Text style={styles.statLabel}>Total Colonies</Text>
                </LinearGradient>
                <LinearGradient colors={["#0369a1", "#0284c7"]} style={styles.statCard}>
                  <Text style={styles.statValue}>{result.species_detected}</Text>
                  <Text style={styles.statLabel}>Species Detected</Text>
                </LinearGradient>
              </FadeIn>

              {/* No results state */}
              {result.summary.length === 0 && (
                <FadeIn delay={100}>
                  <View style={styles.emptyCard}>
                    <Text style={styles.emptyIcon}>🔍</Text>
                    <Text style={styles.emptyTitle}>No Colonies Detected</Text>
                    <Text style={styles.emptyDesc}>
                      The model found no bacterial colonies above the confidence threshold.
                      Try a clearer image or a different plate.
                    </Text>
                  </View>
                </FadeIn>
              )}

              {/* Species cards */}
              {result.summary.length > 0 && (
                <>
                  <FadeIn delay={80}>
                    <Text style={styles.sectionTitle}>Identified Species</Text>
                  </FadeIn>
                  {result.summary.map((item, i) => (
                    <FadeIn key={i} delay={120 + i * 80}>
                      <View style={[styles.speciesCard, i === 0 && styles.speciesCardTop]}>
                        {/* Top row */}
                        <View style={styles.speciesHeader}>
                          <View style={{ flex: 1 }}>
                            {i === 0 && (
                              <View style={styles.dominantBadge}>
                                <Text style={styles.dominantText}>● DOMINANT</Text>
                              </View>
                            )}
                            <Text style={styles.speciesName}>{item.species}</Text>
                          </View>
                          <View style={[styles.confCircle, { borderColor: confColor(item.max_confidence) }]}>
                            <Text style={[styles.confCircleVal, { color: confColor(item.max_confidence) }]}>
                              {(item.max_confidence * 100).toFixed(0)}%
                            </Text>
                          </View>
                        </View>

                        {/* Meta */}
                        <View style={styles.metaRow}>
                          <View style={styles.metaChip}>
                            <Text style={styles.metaText}>
                              🧫 {item.colony_count} {item.colony_count === 1 ? "colony" : "colonies"}
                            </Text>
                          </View>
                          <View style={[styles.metaChip, { backgroundColor: confColor(item.max_confidence) + "15" }]}>
                            <Text style={[styles.metaText, { color: confColor(item.max_confidence) }]}>
                              {confLabel(item.max_confidence)}
                            </Text>
                          </View>
                        </View>

                        {/* Confidence bar */}
                        <View style={styles.barTrack}>
                          <Animated.View
                            style={[
                              styles.barFill,
                              {
                                width: `${item.max_confidence * 100}%`,
                                backgroundColor: confColor(item.max_confidence),
                              },
                            ]}
                          />
                        </View>
                        <View style={styles.barLabels}>
                          <Text style={styles.barLabelText}>0%</Text>
                          <Text style={styles.barLabelText}>100%</Text>
                        </View>
                      </View>
                    </FadeIn>
                  ))}
                </>
              )}

              {/* Disclaimer */}
              <FadeIn delay={300}>
                <View style={styles.resultDisclaimer}>
                  <Text style={styles.disclaimerTitle}>⚕ Clinical Disclaimer</Text>
                  <Text style={styles.disclaimerText}>
                    These results are AI-generated predictions and are intended for research purposes only. Do not use for clinical diagnosis without laboratory confirmation.
                  </Text>
                </View>
              </FadeIn>

              {/* Reset button */}
              <FadeIn delay={360}>
                <TouchableOpacity style={styles.btnReset} onPress={reset} activeOpacity={0.85}>
                  <Text style={styles.btnResetText}>← Analyze Another Image</Text>
                </TouchableOpacity>
              </FadeIn>
            </>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function Chip({ icon, label, sub }) {
  return (
    <View style={styles.chip}>
      <Text style={styles.chipIcon}>{icon}</Text>
      <Text style={styles.chipLabel}>{label}</Text>
      <Text style={styles.chipSub}>{sub}</Text>
    </View>
  );
}

// ─── STYLES ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f0f4ff" },

  // Header
  header: { paddingTop: Platform.OS === "android" ? 36 : 0 },
  headerInner: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: { color: "#fff", fontSize: 22, fontWeight: "800", letterSpacing: 0.5 },
  headerSub: { color: "#93c5fd", fontSize: 11, marginTop: 2 },
  headerBadge: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  headerBadgeText: { color: "#fff", fontSize: 11, fontWeight: "700" },

  // Home screen
  homeScroll: { padding: 16, gap: 14 },

  heroCard: { borderRadius: 20, padding: 24, alignItems: "center" },
  heroIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    shadowColor: "#1e40af",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  heroIconText: { fontSize: 40 },
  heroTitle: { fontSize: 20, fontWeight: "800", color: "#1e3a8a", marginBottom: 10 },
  heroDesc: { fontSize: 13, color: "#475569", textAlign: "center", lineHeight: 20 },

  btnPrimary: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 22,
    gap: 14,
    shadowColor: "#1e40af",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  btnSecondary: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 22,
    gap: 14,
    borderWidth: 2,
    borderColor: "#bfdbfe",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  btnIcon: { fontSize: 26 },
  btnTitle: { color: "#fff", fontSize: 15, fontWeight: "700" },
  btnSubtitle: { color: "#bfdbfe", fontSize: 12, marginTop: 1 },

  chipRow: { flexDirection: "row", gap: 10 },
  chip: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#dbeafe",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  chipIcon: { fontSize: 20, marginBottom: 4 },
  chipLabel: { fontSize: 12, fontWeight: "700", color: "#1e3a8a" },
  chipSub: { fontSize: 10, color: "#94a3b8", marginTop: 1 },

  disclaimerCard: {
    backgroundColor: "#fefce8",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#fde68a",
  },
  disclaimerTitle: { fontSize: 12, fontWeight: "700", color: "#92400e", marginBottom: 6 },
  disclaimerText: { fontSize: 11, color: "#78350f", lineHeight: 17 },

  // Result screen
  resultScroll: { padding: 16, gap: 14 },

  imageCard: {
    borderRadius: 18,
    overflow: "hidden",
    height: 220,
    backgroundColor: "#000",
  },
  preview: { width: "100%", height: "100%" },
  imageOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 14,
  },
  imageLabel: { color: "#fff", fontSize: 13, fontWeight: "600" },

  loadingCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 28,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  dotsRow: { flexDirection: "row", marginBottom: 16 },
  loadingTitle: { fontSize: 16, fontWeight: "700", color: "#1e3a8a" },
  loadingSubText: { fontSize: 12, color: "#94a3b8", marginTop: 4 },

  statsRow: { flexDirection: "row", gap: 12 },
  statCard: {
    flex: 1,
    borderRadius: 16,
    padding: 18,
    alignItems: "center",
    shadowColor: "#1e40af",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  statValue: { color: "#fff", fontSize: 32, fontWeight: "900" },
  statLabel: { color: "#bfdbfe", fontSize: 11, marginTop: 2, textAlign: "center", fontWeight: "600" },

  emptyCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 32,
    alignItems: "center",
  },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: "#1e3a8a", marginBottom: 8 },
  emptyDesc: { fontSize: 13, color: "#64748b", textAlign: "center", lineHeight: 20 },

  sectionTitle: { fontSize: 13, fontWeight: "800", color: "#64748b", letterSpacing: 1, textTransform: "uppercase" },

  speciesCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  speciesCardTop: {
    borderWidth: 2,
    borderColor: "#1e40af",
    shadowColor: "#1e40af",
    shadowOpacity: 0.12,
    shadowRadius: 10,
  },
  speciesHeader: { flexDirection: "row", alignItems: "flex-start", marginBottom: 12 },
  dominantBadge: {
    backgroundColor: "#1e40af",
    borderRadius: 6,
    paddingVertical: 3,
    paddingHorizontal: 8,
    alignSelf: "flex-start",
    marginBottom: 6,
  },
  dominantText: { color: "#fff", fontSize: 9, fontWeight: "800", letterSpacing: 1 },
  speciesName: { fontSize: 15, fontWeight: "700", color: "#0f172a", lineHeight: 22, paddingRight: 8 },
  confCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2.5,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  confCircleVal: { fontSize: 13, fontWeight: "800" },

  metaRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
  metaChip: {
    backgroundColor: "#f1f5f9",
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  metaText: { fontSize: 12, color: "#475569", fontWeight: "600" },

  barTrack: { height: 8, backgroundColor: "#f1f5f9", borderRadius: 4, overflow: "hidden" },
  barFill: { height: 8, borderRadius: 4 },
  barLabels: { flexDirection: "row", justifyContent: "space-between", marginTop: 4 },
  barLabelText: { fontSize: 10, color: "#cbd5e1" },

  resultDisclaimer: {
    backgroundColor: "#fefce8",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#fde68a",
  },

  btnReset: {
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 2,
    borderColor: "#1e40af",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  btnResetText: { color: "#1e40af", fontSize: 15, fontWeight: "700" },
});

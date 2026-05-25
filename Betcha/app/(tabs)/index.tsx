import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";

export default function HomeScreen() {
  const [odds1, setOdds1] = useState("");
  const [odds2, setOdds2] = useState("");
  const [result, setResult] = useState("");
const API_KEY = process.env.EXPO_PUBLIC_ODDS_API_KEY;

  // Convert American odds to decimal
  const toDecimal = (odds: number) => {
    if (odds > 0) return 1 + odds / 100;
    return 1 + 100 / Math.abs(odds);
  };

  const calculateArb = () => {
    const o1 = parseFloat(odds1);
    const o2 = parseFloat(odds2);

    if (!o1 || !o2) {
      setResult("Enter both odds");
      return;
    }

    const d1 = toDecimal(o1);
    const d2 = toDecimal(o2);

    const check = 1 / d1 + 1 / d2;

    if (check < 1) {
      const total = 100;

      const bet1 = (total / d1) / check;
      const bet2 = (total / d2) / check;

      const payout = bet1 * d1;
      const profit = payout - total;

      setResult(
        `ARB FOUND ✅

Bet 1: $${bet1.toFixed(2)}
Bet 2: $${bet2.toFixed(2)}

Profit: $${profit.toFixed(2)}`
      );
    } else {
      setResult("No arbitrage ❌");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Betcha Arbitrage 💰</Text>

      <TextInput
        style={styles.input}
        placeholder="Odds 1 (e.g. +150)"
        placeholderTextColor="#aaa"
        value={odds1}
        onChangeText={setOdds1}
      />

      <TextInput
        style={styles.input}
        placeholder="Odds 2 (e.g. -130)"
        placeholderTextColor="#aaa"
        value={odds2}
        onChangeText={setOdds2}
      />

      <TouchableOpacity style={styles.button} onPress={calculateArb}>
        <Text style={styles.buttonText}>Check Arbitrage</Text>
      </TouchableOpacity>

      <Text style={styles.result}>{result}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
    padding: 20,
    justifyContent: "center",
  },
  title: {
    fontSize: 26,
    color: "#22c55e",
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    backgroundColor: "#1e293b",
    color: "#fff",
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  button: {
    backgroundColor: "#22c55e",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  result: {
    color: "#fff",
    marginTop: 20,
    textAlign: "center",
    fontSize: 16,
  },
});
import React, { useState } from "react";
import {
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";

export default function HomeScreen() {
  const [odds1, setOdds1] = useState("");
  const [odds2, setOdds2] = useState("");
  const [total, setTotal] = useState("");
  const [result, setResult] = useState("");

  const toDecimal = (odds: number) => {
    if (odds >= 0) {
      return odds / 100 + 1;
    }

    return 100 / Math.abs(odds) + 1;
  };

  const parseOdds = (value: string) => {
    const cleaned = value.trim().replace("+", "");
    return Number(cleaned);
  };

  const calculateArb = () => {
    const o1 = parseOdds(odds1);
    const o2 = parseOdds(odds2);
    const stake = Number(total);

    if (
      Number.isNaN(o1) ||
      Number.isNaN(o2) ||
      Number.isNaN(stake) ||
      stake <= 0
    ) {
      setResult("Please enter valid odds and a bet amount.");
      return;
    }

    const d1 = toDecimal(o1);
    const d2 = toDecimal(o2);

    const implied1 = 1 / d1;
    const implied2 = 1 / d2;
    const bookPercentage = implied1 + implied2;

    if (bookPercentage >= 1) {
      setResult(
        "No arbitrage found with these odds. Try different odds."
      );
      return;
    }

    const profitPercent = (1 / bookPercentage - 1) * 100;

    const stake1 = (stake * implied1) / bookPercentage;
    const stake2 = (stake * implied2) / bookPercentage;

    const payout = stake1 * d1;
    const profit = payout - stake;

    setResult(
      `🎉 ARBITRAGE FOUND!\n\n` +
        `Bet on Sportsbook 1: $${stake1.toFixed(2)}\n\n` +
        `Bet on Sportsbook 2: $${stake2.toFixed(2)}\n\n` +
        `Guaranteed Profit: $${profit.toFixed(2)}\n\n` +
        `Profit Percentage: ${profitPercent.toFixed(2)}%`
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      <Text style={styles.title}>Betcha Arbitrage 💰</Text>

      <TextInput
        style={styles.input}
        placeholder="Odds 1 (e.g. +150)"
        placeholderTextColor="#aaa"
        value={odds1}
        onChangeText={setOdds1}
        keyboardType="numbers-and-punctuation"
      />

      <TextInput
        style={styles.input}
        placeholder="Odds 2 (e.g. -120)"
        placeholderTextColor="#aaa"
        value={odds2}
        onChangeText={setOdds2}
        keyboardType="numbers-and-punctuation"
      />

      <TextInput
        style={styles.input}
        placeholder="Total Bet Amount (e.g. 100)"
        placeholderTextColor="#aaa"
        value={total}
        onChangeText={setTotal}
        keyboardType="numeric"
      />

      <TouchableOpacity
        style={styles.button}
        onPress={calculateArb}
      >
        <Text style={styles.buttonText}>Check Arbitrage</Text>
      </TouchableOpacity>

      {result !== "" && (
        <View style={styles.resultBox}>
          <Text style={styles.result}>{result}</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
  },

  contentContainer: {
    padding: 20,
    alignItems: "stretch",
  },

  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#22c55e",
    textAlign: "center",
    marginBottom: 30,
    marginTop: 20,
  },

  input: {
    backgroundColor: "#334155",
    color: "#ffffff",
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
  },

  button: {
    backgroundColor: "#00ff00",
    padding: 18,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },

  buttonText: {
    color: "#0f172a",
    fontSize: 18,
    fontWeight: "bold",
  },

  resultBox: {
    backgroundColor: "#172554",
    padding: 20,
    borderRadius: 12,
    marginTop: 25,
  },

  result: {
    color: "#ffffff",
    fontSize: 18,
    lineHeight: 28,
    textAlign: "center",
  },
});
"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/app/provider";
import { getUserTransactions, getUserJarBalances } from "@/services/accumulativeFinancialService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bar, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import SavingsChart from "./_components/SavingsChart";
import MoneyFlow from "./_components/MoneyFlow";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function AnalyticsPage() {
  const { user } = useUser();
  const [transactions, setTransactions] = useState([]);
  const [jarBalances, setJarBalances] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    setLoading(true);
    Promise.all([
      getUserTransactions(user.id, 1000),
      getUserJarBalances(user.id),
    ])
      .then(([txs, jars]) => {
        setTransactions(txs || []);
        setJarBalances(jars || []);
      })
      .finally(() => setLoading(false));
  }, [user?.id]);

  // Prepare data for income/outcome chart
  const monthlyData = {};
  transactions.forEach((tx) => {
    const month = tx.occurred_at?.slice(0, 7) || "Unknown";
    if (!monthlyData[month]) monthlyData[month] = { income: 0, outcome: 0 };
    if (tx.amount_cents > 0) monthlyData[month].income += tx.amount_cents;
    else monthlyData[month].outcome += Math.abs(tx.amount_cents);
  });
  const months = Object.keys(monthlyData).sort();
  const incomeData = months.map((m) => monthlyData[m].income);
  const outcomeData = months.map((m) => monthlyData[m].outcome);

  // Prepare data for jar balances over time (simple: show current balances by jar)
  const jarNames = jarBalances.map((jar) => jar.category_name || jar.category_id);
  const jarCurrentBalances = jarBalances.map((jar) => (jar.current_balance_cents || 0));

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Analytics</h1>
      <Card>
        <CardHeader>
          <CardTitle>Income vs Outcome by Month</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div>Loading chart...</div>
          ) : months.length === 0 ? (
            <div>No transaction data available.</div>
          ) : (
            <Bar
              data={{
                labels: months,
                datasets: [
                  {
                    label: "Income (VND)",
                    data: incomeData,
                    backgroundColor: "#22c55e",
                  },
                  {
                    label: "Outcome (VND)",
                    data: outcomeData,
                    backgroundColor: "#ef4444",
                  },
                ],
              }}
              options={{
                responsive: true,
                plugins: {
                  legend: { position: "top" },
                  title: { display: false },
                },
              }}
            />
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Current Jar Balances</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div>Loading chart...</div>
          ) : jarNames.length === 0 ? (
            <div>No jar data available.</div>
          ) : (
            <Bar
              data={{
                labels: jarNames,
                datasets: [
                  {
                    label: "Current Balance (VND)",
                    data: jarCurrentBalances,
                    backgroundColor: jarCurrentBalances.map(v => v >= 0 ? "#22c55e" : "#ef4444"),
                  },
                ],
              }}
              options={{
                responsive: true,
                plugins: {
                  legend: { position: "top" },
                  title: { display: false },
                },
              }}
            />
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Savings Jar Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <SavingsChart />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Total Balance Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <MoneyFlow />
        </CardContent>
      </Card>
    </div>
  );
}

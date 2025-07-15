"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/app/provider";
import { getUserTransactions, getUserJarBalances } from "@/services/accumulativeFinancialService";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function SavingsChart() {
  const { user } = useUser();
  const [dataPoints, setDataPoints] = useState([]);
  const [labels, setLabels] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    setLoading(true);
    // First, get the jar balances to find the Savings jar's category_id
    getUserJarBalances(user.id).then(jars => {
      const savingsJar = jars.find(jar => jar.category_name === "Savings");
      if (!savingsJar) {
        setLabels([]);
        setDataPoints([]);
        setLoading(false);
        return;
      }
      // Fetch all transactions for this user and jar
      getUserTransactions(user.id, 1000, 0, { jarCategoryId: savingsJar.category_id }).then(transactions => {
        // Group transactions by day and calculate cumulative balance
        const daily = {};
        let runningBalance = 0;
        transactions
          .sort((a, b) => new Date(a.occurred_at) - new Date(b.occurred_at))
          .forEach(tx => {
            const day = tx.occurred_at?.slice(0, 10) || "Unknown";
            runningBalance += tx.amount_cents || 0;
            daily[day] = runningBalance;
          });
        const sortedDays = Object.keys(daily).sort();
        setLabels(sortedDays);
        setDataPoints(sortedDays.map(d => daily[d]));
        setLoading(false);
      });
    });
  }, [user?.id]);

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Savings Jar Balance Over Time</h2>
      {loading ? (
        <div>Loading savings chart...</div>
      ) : labels.length === 0 ? (
        <div>No savings data available.</div>
      ) : (
        <Line
          data={{
            labels,
            datasets: [
              {
                label: "Savings Balance (VND)",
                data: dataPoints,
                borderColor: "#10b981",
                backgroundColor: "#d1fae5",
                tension: 0.3,
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
    </div>
  );
}

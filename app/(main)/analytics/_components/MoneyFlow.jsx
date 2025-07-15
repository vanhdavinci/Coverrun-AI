"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/app/provider";
import { getUserTransactions } from "@/services/accumulativeFinancialService";
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

export default function MoneyFlow() {
  const { user } = useUser();
  const [labels, setLabels] = useState([]);
  const [dataPoints, setDataPoints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    setLoading(true);
    getUserTransactions(user.id, 1000).then(transactions => {
      // Sort by date ascending
      const sorted = [...transactions].sort((a, b) => new Date(a.occurred_at) - new Date(b.occurred_at));
      // Group by day and calculate cumulative balance
      const daily = {};
      let runningBalance = 0;
      sorted.forEach(tx => {
        const day = tx.occurred_at?.slice(0, 10) || "Unknown";
        runningBalance += tx.amount_cents || 0;
        daily[day] = runningBalance;
      });
      const sortedDays = Object.keys(daily).sort();
      setLabels(sortedDays);
      setDataPoints(sortedDays.map(d => daily[d]));
      setLoading(false);
    });
  }, [user?.id]);

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Total Balance Over Time</h2>
      {loading ? (
        <div>Loading money flow chart...</div>
      ) : labels.length === 0 ? (
        <div>No balance data available.</div>
      ) : (
        <Line
          data={{
            labels,
            datasets: [
              {
                label: "Total Balance (VND)",
                data: dataPoints,
                borderColor: "#6366f1",
                backgroundColor: "#e0e7ff",
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

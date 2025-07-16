"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/app/provider";
import { useDataRefresh } from "@/context/DataRefreshContext";
import { getUserTransactions } from "@/services/accumulativeFinancialService";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  TimeScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import "chartjs-adapter-date-fns";
import axios from "axios";

ChartJS.register(
  TimeScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function MoneyFlow() {
  const { user } = useUser();
  const { refreshTrigger } = useDataRefresh();
  const [labels, setLabels] = useState([]);
  const [dataPoints, setDataPoints] = useState([]);
  const [forecastLabels, setForecastLabels] = useState([]);
  const [forecastPoints, setForecastPoints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [forecastLoading, setForecastLoading] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    setLoading(true);
    getUserTransactions(user.id, 1000).then(async transactions => {
      // Sort by date ascending
      const sorted = [...transactions].sort((a, b) => new Date(a.occurred_at) - new Date(b.occurred_at));
      // Group by day and calculate cumulative balance
      const daily = {};
      let runningBalance = 0;
      sorted.forEach(tx => {
        const day = tx.occurred_at?.slice(0, 10) || "Unknown";
        runningBalance += tx.amount_cents || 0;
        daily[day] = runningBalance; // convert to VND units
      });
      const sortedDays = Object.keys(daily).sort();
      const balances = sortedDays.map(d => daily[d]);
      setLabels(sortedDays);
      setDataPoints(balances);
      setLoading(false);

      // Prepare data for forecast API
      if (sortedDays.length > 0) {
        setForecastLoading(true);
        // Use last day of each month for monthly frequency
        const monthlyData = [];
        let lastMonth = null;
        let lastDate = null;
        let lastBalance = null;
        sortedDays.forEach((date, idx) => {
          const month = date.slice(0, 7);
          if (month !== lastMonth) {
            if (lastDate && lastBalance !== null) {
              monthlyData.push({ date: lastDate, balance: lastBalance });
            }
            lastMonth = month;
          }
          lastDate = date;
          lastBalance = balances[idx];
        });
        // Push the last one
        if (lastDate && lastBalance !== null) {
          monthlyData.push({ date: lastDate, balance: lastBalance });
        }
        // Call the forecast API
        try {
          const response = await axios.post("http://localhost:8000/forecast", {
            data: monthlyData,
            periods: 6,
            freq: "M",
            target: 10000.0,
            lags: 12
          });
          console.log(monthlyData)
          const forecast = response.data.forecast || [];
          
          // Filter forecast to only include dates after the last actual date
          const lastActualDate = new Date(sortedDays[sortedDays.length - 1]);
          const filteredForecast = forecast.filter(f => {
            const forecastDate = new Date(f.date);
            return forecastDate > lastActualDate;
          });
          
          setForecastLabels(filteredForecast.map(f => f.date));
          setForecastPoints(filteredForecast.map(f => f.yhat));
        } catch (err) {
          // eslint-disable-next-line no-console
          console.error("Forecast API error", err);
          setForecastLabels([]);
          setForecastPoints([]);
        } finally {
          setForecastLoading(false);
        }
      }
    });
  }, [user?.id, refreshTrigger]);

  // Build the two datasets with {x,y} points for proper time-based charting
  const actualDataset = {
    label: "Total Balance (VND)",
    data: labels.map((d, i) => ({ x: d, y: dataPoints[i] })),
    borderColor: "#6366f1",
    backgroundColor: "#e0e7ff",
    tension: 0.3,
    spanGaps: true,
  };

  const forecastDataset = {
    label: "Forecast (VND)",
    data: labels.length && forecastLabels.length
      ? [
          // Start from the last actual point for smooth connection
          { x: labels[labels.length - 1], y: dataPoints[dataPoints.length - 1] },
          // Then add all forecast points (filtered to be future-only)
          ...forecastLabels.map((d, i) => ({ x: d, y: forecastPoints[i] }))
        ]
      : [],
    borderColor: "#f59e42",
    borderDash: [8, 4],
    backgroundColor: "rgba(245, 158, 66, 0.1)",
    tension: 0.3,
    spanGaps: true,
    pointRadius: (context) => {
      // Hide the first point (connection point) to avoid overlap
      return context.dataIndex === 0 ? 0 : 3;
    },
    showLine: true,
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Total Balance Over Time</h2>
      {loading ? (
        <div>Loading money flow chart...</div>
      ) : labels.length === 0 ? (
        <div>No balance data available.</div>
      ) : (
        <Line
          data={{ datasets: [actualDataset, forecastDataset] }}
          options={{
            responsive: true,
            plugins: {
              legend: { position: "top" },
              title: { display: false },
            },
            scales: {
              x: {
                type: "time",
                time: { unit: "month" },
                title: { display: true, text: "Date" }
              },
              y: {
                beginAtZero: true,
                title: { display: true, text: "Balance (VND)" }
              }
            }
          }}
        />
      )}
      {forecastLoading && <div>Loading forecast...</div>}
    </div>
  );
}
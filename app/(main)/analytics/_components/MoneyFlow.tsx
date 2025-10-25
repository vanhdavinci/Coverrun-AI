"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/app/provider";
import { useDataRefresh } from "@/context/DataRefreshContext";
import { getUserTransactions } from "@/services/accumulativeFinancialService";
import { Line } from "react-chartjs-2";
import { TrendingUp } from "lucide-react";
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
      const sorted = [...transactions].sort((a, b) => new Date(a.occurred_at).getTime() - new Date(b.occurred_at).getTime());
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
        let lastMonth = null, lastDate = null, lastBalance = null;
        sortedDays.forEach((date, idx) => {
          const month = date.slice(0, 7);
          if (month !== lastMonth && lastDate) {
            monthlyData.push({ date: lastDate, balance: lastBalance });
            lastMonth = month;
          }
          lastDate = date;
          lastBalance = balances[idx];
        });
        if (lastDate) {
          monthlyData.push({ date: lastDate, balance: lastBalance });
        }
        console.log(monthlyData)
        // Call the forecast API
        try {
          const response = await axios.post(process.env.NEXT_PUBLIC_FORECAST_API_URL, {
            data: monthlyData,
            periods: 6,
            freq: "M",
            target: 10000.0,
            lags: 12
          });
          
          // Fix: Use response.data instead of response.body
          const parsed = typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
          const forecast = parsed.forecast;
          
          // Filter forecast to only include dates after the last actual date
          const lastActualDate = new Date(sortedDays[sortedDays.length - 1]);
          const filteredForecast = forecast.filter(f => {
            const forecastDate = new Date(f.date);
            return forecastDate > lastActualDate;
          });
          
          console.log("Forecast data:", filteredForecast);
          setForecastLabels(filteredForecast.map(f => f.date));
          setForecastPoints(filteredForecast.map(f => f.yhat));
        } catch (err) {
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
    data: forecastLabels.length > 0
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

  // Debug logging
  console.log("MoneyFlow Debug:", {
    labels: labels.length,
    dataPoints: dataPoints.length,
    forecastLabels: forecastLabels.length,
    forecastPoints: forecastPoints.length,
    forecastDataset: forecastDataset.data.length
  });

  return (
    <div className="w-full h-full">
      {loading ? (
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : labels.length === 0 ? (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600">No balance data available</p>
          </div>
        </div>
      ) : (
        <Line
          data={{ datasets: [actualDataset, forecastDataset] }}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
              intersect: false,
              mode: 'index'
            },
            plugins: {
              legend: { 
                position: "top",
                labels: {
                  usePointStyle: true,
                  padding: 20
                }
              },
              title: { display: false },
              tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                titleColor: 'white',
                bodyColor: 'white',
                borderColor: 'rgba(255, 255, 255, 0.1)',
                borderWidth: 1
              }
            },
            scales: {
              x: {
                type: "time",
                time: { 
                  unit: "month",
                  displayFormats: {
                    month: 'MMM yyyy'
                  }
                },
                title: { 
                  display: true, 
                  text: "Date",
                  font: { size: 12 }
                },
                grid: { 
                  color: "#f3f4f6"
                },
                ticks: {
                  maxTicksLimit: 6
                }
              },
              y: {
                beginAtZero: true,
                title: { 
                  display: true, 
                  text: "Balance (VND)",
                  font: { size: 12 }
                },
                grid: { 
                  color: "#f3f4f6"
                },
                ticks: {
                  callback: function(value: number) {
                    return new Intl.NumberFormat('vi-VN', {
                      style: 'currency',
                      currency: 'VND',
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    }).format(value);
                  }
                }
              }
            },
            elements: {
              point: {
                radius: 4,
                hoverRadius: 6
              },
              line: {
                borderWidth: 2
              }
            }
          }}
        />
      )}
      {forecastLoading && (
        <div className="flex items-center justify-center mt-4">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600 mr-2"></div>
          <span className="text-sm text-gray-600">Loading forecast...</span>
        </div>
      )}
    </div>
  );
}
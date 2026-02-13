import { useMemo } from "react";

export function useLibraryCharts({ userStats, adminStats }) {
  const userTrendChart = useMemo(() => {
    if (!userStats) {
      return null;
    }
    return {
      data: {
        labels: userStats.rentalTrend.map((row) => row.month),
        datasets: [
          {
            label: "Rentals",
            data: userStats.rentalTrend.map((row) => row.count),
            borderColor: "#ff6b35",
            backgroundColor: "rgba(255, 107, 53, 0.2)",
            tension: 0.35,
            fill: true,
          },
        ],
      },
      options: { responsive: true, maintainAspectRatio: false },
    };
  }, [userStats]);

  const userCategoryChart = useMemo(() => {
    if (!userStats) {
      return null;
    }
    return {
      data: {
        labels: userStats.categoryBreakdown.map((row) => row.category),
        datasets: [
          {
            label: "Rentals",
            data: userStats.categoryBreakdown.map((row) => row.count),
            backgroundColor: "rgba(17, 24, 39, 0.6)",
          },
        ],
      },
      options: { responsive: true, maintainAspectRatio: false },
    };
  }, [userStats]);

  const adminCharts = useMemo(() => {
    if (!adminStats) {
      return [];
    }
    return [
      { key: "users", label: "Users", color: "#111827", data: adminStats.usersByMonth },
      { key: "books", label: "Books", color: "#ff6b35", data: adminStats.booksByMonth },
      { key: "rentals", label: "Rentals", color: "#556b2f", data: adminStats.rentalsByMonth },
    ].map((chart) => ({
      ...chart,
      chartData: {
        labels: chart.data.map((row) => row.month),
        datasets: [
          {
            label: chart.label,
            data: chart.data.map((row) => row.count),
            borderColor: chart.color,
            backgroundColor: "rgba(0,0,0,0.05)",
            tension: 0.35,
          },
        ],
      },
    }));
  }, [adminStats]);

  return { userTrendChart, userCategoryChart, adminCharts };
}

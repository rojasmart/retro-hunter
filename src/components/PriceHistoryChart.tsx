"use client";

import React from "react";
import dynamic from "next/dynamic";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface PriceHistoryData {
  date: Date;
  newPrice?: number;
  loosePrice?: number;
  gradedPrice?: number;
  completePrice?: number;
}

interface PriceHistoryChartProps {
  priceHistory?: PriceHistoryData[];
  currentPrices: {
    newPrice?: number;
    loosePrice?: number;
    gradedPrice?: number;
    completePrice?: number;
  };
  addedAt: Date;
}

export default function PriceHistoryChart({ priceHistory, currentPrices, addedAt }: PriceHistoryChartProps) {
  // If no price history, create initial data point with current prices
  const historyData = priceHistory && priceHistory.length > 0 ? priceHistory : [{ date: new Date(addedAt), ...currentPrices }];

  // Prepare series data
  const series = [
    {
      name: "New",
      data: historyData.map((item) => ({
        x: new Date(item.date).getTime(),
        y: item.newPrice || 0,
      })),
    },
    {
      name: "Loose",
      data: historyData.map((item) => ({
        x: new Date(item.date).getTime(),
        y: item.loosePrice || 0,
      })),
    },
    {
      name: "Graded",
      data: historyData.map((item) => ({
        x: new Date(item.date).getTime(),
        y: item.gradedPrice || 0,
      })),
    },
    {
      name: "Complete",
      data: historyData.map((item) => ({
        x: new Date(item.date).getTime(),
        y: item.completePrice || 0,
      })),
    },
  ].filter((s) => s.data.some((d) => d.y > 0)); // Only show series with data

  const options: any = {
    chart: {
      type: "area",
      height: 180,
      toolbar: {
        show: false,
      },
      zoom: {
        enabled: false,
      },
      background: "transparent",
      animations: {
        enabled: true,
        speed: 800,
      },
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      curve: "smooth",
      width: 2,
    },
    colors: ["#10b981", "#ef4444", "#3b82f6", "#eab308"],
    fill: {
      type: "gradient",
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.4,
        opacityTo: 0.1,
        stops: [0, 90, 100],
      },
    },
    xaxis: {
      type: "datetime",
      labels: {
        style: {
          colors: "#67e8f9",
          fontSize: "10px",
        },
        datetimeFormatter: {
          year: "yyyy",
          month: "MMM 'yy",
          day: "dd MMM",
          hour: "HH:mm",
        },
      },
      axisBorder: {
        show: true,
        color: "#22d3ee",
        height: 1,
      },
      axisTicks: {
        show: true,
        color: "#22d3ee",
      },
    },
    yaxis: {
      labels: {
        style: {
          colors: "#67e8f9",
          fontSize: "10px",
        },
        formatter: (value: any) => `$${value.toFixed(0)}`,
      },
    },
    grid: {
      borderColor: "#1e293b",
      strokeDashArray: 4,
      xaxis: {
        lines: {
          show: true,
        },
      },
      yaxis: {
        lines: {
          show: true,
        },
      },
    },
    legend: {
      show: true,
      position: "top",
      horizontalAlign: "center",
      fontSize: "10px",
      labels: {
        colors: "#67e8f9",
      },
      markers: {
        size: 4,
      },
      itemMargin: {
        horizontal: 8,
        vertical: 0,
      },
    },
    tooltip: {
      theme: "dark",
      x: {
        format: "dd MMM yyyy",
      },
      y: {
        formatter: (value: any) => `$${value.toFixed(2)}`,
      },
      style: {
        fontSize: "11px",
      },
    },
  };

  if (series.length === 0) {
    return <div className="h-[180px] flex items-center justify-center text-cyan-400/60 text-xs">No price data available</div>;
  }

  return (
    <div className="w-full">
      <Chart options={options} series={series} type="area" height={180} />
    </div>
  );
}

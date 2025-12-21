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

  // Calculate price changes (current vs initial/first)
  const getPriceChange = (priceType: keyof typeof currentPrices) => {
    if (!historyData || historyData.length < 2) return null;

    // Compare current (last) with initial (first)
    const current = historyData[historyData.length - 1][priceType];
    const initial = historyData[0][priceType];

    console.log(`${priceType}: Initial=${initial}, Current=${current}`);

    if (!current || !initial) return null;

    const change = current - initial;
    const percentChange = ((change / initial) * 100).toFixed(1);

    console.log(`${priceType}: Change=${change}, Percent=${percentChange}%, Direction=${change > 0 ? "up" : change < 0 ? "down" : "neutral"}`);

    return {
      change,
      percentChange,
      direction: change > 0 ? "up" : change < 0 ? "down" : "neutral",
    };
  };

  const newChange = getPriceChange("newPrice");
  const looseChange = getPriceChange("loosePrice");
  const gradedChange = getPriceChange("gradedPrice");
  const completeChange = getPriceChange("completePrice");

  // Render price change indicator
  const renderPriceIndicator = (change: any, price?: number) => {
    if (!price) return null;

    if (!change) {
      return <span className="text-blue-400 text-[9px] ml-1">—</span>;
    }

    const { direction, percentChange, change: changeValue } = change;

    if (direction === "up") {
      return (
        <span className="inline-flex items-center text-green-400 text-[9px] ml-1" title={`Aumentou ${percentChange}%`}>
          ▲ +{percentChange}%
        </span>
      );
    } else if (direction === "down") {
      return (
        <span className="inline-flex items-center text-red-400 text-[9px] ml-1" title={`Diminuiu ${Math.abs(parseFloat(percentChange))}%`}>
          ▼ {percentChange}%
        </span>
      );
    } else {
      // neutral (sem mudança)
      return (
        <span className="text-blue-400 text-[9px] ml-1" title="Sem alteração">
          — 0%
        </span>
      );
    }
  };

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
      {/* Price Labels with Indicators */}
      <div className="flex items-center justify-around text-xs mb-4">
        {currentPrices.newPrice && (
          <div className="text-center">
            <div className="text-green-400/60 text-[10px] mb-1">New</div>
            <div className="text-green-400 font-bold flex items-center justify-center">
              $ {currentPrices.newPrice.toFixed(2)}
              {renderPriceIndicator(newChange, currentPrices.newPrice)}
            </div>
          </div>
        )}
        {currentPrices.loosePrice && (
          <div className="text-center">
            <div className="text-red-400/60 text-[10px] mb-1">Loose</div>
            <div className="text-red-400 font-bold flex items-center justify-center">
              $ {currentPrices.loosePrice.toFixed(2)}
              {renderPriceIndicator(looseChange, currentPrices.loosePrice)}
            </div>
          </div>
        )}
        {currentPrices.gradedPrice && (
          <div className="text-center">
            <div className="text-blue-400/60 text-[10px] mb-1">Graded</div>
            <div className="text-blue-400 font-bold flex items-center justify-center">
              $ {currentPrices.gradedPrice.toFixed(2)}
              {renderPriceIndicator(gradedChange, currentPrices.gradedPrice)}
            </div>
          </div>
        )}
        {currentPrices.completePrice && (
          <div className="text-center">
            <div className="text-yellow-400/60 text-[10px] mb-1">Complete</div>
            <div className="text-yellow-400 font-bold flex items-center justify-center">
              $ {currentPrices.completePrice.toFixed(2)}
              {renderPriceIndicator(completeChange, currentPrices.completePrice)}
            </div>
          </div>
        )}
      </div>

      {/* Chart */}
      <div className="pt-3 border-t border-blue-400/20">
        <Chart options={options} series={series} type="area" height={180} />
      </div>
    </div>
  );
}

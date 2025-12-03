"use client";

import { useMemo } from 'react';

interface BarChartProps {
  data: Array<{ label: string; value: number }>;
  title?: string;
  color?: string;
  horizontal?: boolean;
  showValues?: boolean;
  formatValue?: (value: number) => string;
}

export function BarChart({ 
  data, 
  title, 
  color = '#9DC65D', 
  horizontal = false,
  showValues = true,
  formatValue = (val) => val.toString()
}: BarChartProps) {
  const maxValue = useMemo(() => 
    Math.max(...data.map(item => item.value), 1), 
    [data]
  );

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-tierra-media">
        No hay datos para mostrar
      </div>
    );
  }

  if (horizontal) {
    return (
      <div className="space-y-3">
        {title && <h4 className="font-medium text-azul-profundo mb-4">{title}</h4>}
        <div className="space-y-3">
          {data.map((item, index) => (
            <div key={index} className="flex items-center space-x-3">
              <div className="w-32 text-sm truncate font-medium" title={item.label}>
                {item.label}
              </div>
              <div className="flex-1 bg-gray-200 rounded-full h-8 relative overflow-hidden">
                <div 
                  className="h-8 rounded-full transition-all duration-500 ease-out flex items-center justify-end pr-2"
                  style={{ 
                    width: `${(item.value / maxValue) * 100}%`,
                    backgroundColor: color,
                    minWidth: showValues ? '40px' : '0'
                  }}
                >
                  {showValues && (
                    <span className="text-xs font-bold text-white drop-shadow">
                      {formatValue(item.value)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Vertical bar chart
  return (
    <div className="space-y-3">
      {title && <h4 className="font-medium text-azul-profundo mb-4">{title}</h4>}
      <div className="flex items-end justify-between space-x-2 h-64">
        {data.map((item, index) => (
          <div key={index} className="flex-1 flex flex-col items-center space-y-2">
            <div className="relative w-full h-full flex flex-col justify-end">
              {showValues && item.value > 0 && (
                <div className="text-xs font-bold text-center mb-1 text-azul-profundo">
                  {formatValue(item.value)}
                </div>
              )}
              <div 
                className="w-full rounded-t-lg transition-all duration-500 ease-out hover:opacity-80 cursor-pointer"
                style={{ 
                  height: `${(item.value / maxValue) * 100}%`,
                  backgroundColor: color,
                  minHeight: item.value > 0 ? '20px' : '0'
                }}
                title={`${item.label}: ${formatValue(item.value)}`}
              />
            </div>
            <div className="text-xs text-tierra-media text-center truncate w-full px-1" title={item.label}>
              {item.label.length > 10 ? `${item.label.substring(0, 8)}...` : item.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


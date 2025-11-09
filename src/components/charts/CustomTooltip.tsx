interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
}

export const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (!active || !payload || payload.length === 0) return null;
  
  return (
    <div className="bg-legasi-card/95 border-2 border-legasi-orange rounded-lg p-3 shadow-xl backdrop-blur-sm">
      <p className="text-foreground font-semibold mb-2">{label}</p>
      {payload.map((entry, index) => (
        <p key={index} className="text-sm flex justify-between gap-4">
          <span style={{ color: entry.color }}>{entry.name}:</span>
          <span className="font-bold" style={{ color: entry.color }}>
            {typeof entry.value === 'number' 
              ? entry.name.includes('LTV') || entry.name.includes('%')
                ? `${entry.value.toFixed(2)}%`
                : `$${entry.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              : entry.value
            }
          </span>
        </p>
      ))}
    </div>
  );
};

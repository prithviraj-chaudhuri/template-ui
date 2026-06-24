interface NumberSliderProps {
  id: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  showValue?: boolean;
}

export function NumberSlider({
  id,
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  disabled = false,
  showValue = true,
}: NumberSliderProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <input
          id={id}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(Number(e.target.value))}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={value}
          className="flex-1 h-2 rounded-full appearance-none bg-secondary accent-primary disabled:opacity-50"
        />
        {showValue && (
          <span className="text-sm font-medium text-foreground tabular-nums w-10 text-right">
            {value}
          </span>
        )}
      </div>
    </div>
  );
}

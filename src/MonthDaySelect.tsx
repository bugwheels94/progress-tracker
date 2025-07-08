import React from "react";

type Props = {
  value: number | undefined;
  onChange: (val: number) => void;
};

const getLabel = (num: number): string => {
  if (num > 0) {
    if (num === 1) return "First day";
    return `${num}${getOrdinalSuffix(num)} day`;
  } else {
    const abs = Math.abs(num);
    if (abs === 1) return "Last day";
    return `${abs}${getOrdinalSuffix(abs)} last day`;
  }
};

const getOrdinalSuffix = (n: number): string => {
  if (n >= 11 && n <= 13) return "th";
  const last = n % 10;
  if (last === 1) return "st";
  if (last === 2) return "nd";
  if (last === 3) return "rd";
  return "th";
};

export const MonthDaySelect: React.FC<Props> = ({ value, onChange }) => {
  const options = [
    ...Array.from({ length: 30 }, (_, i) => i + 1),
    ...Array.from({ length: 30 }, (_, i) => -(i + 1)),
  ];

  return (
    <select
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="border border-gray-300 rounded px-3 py-1"
    >
      <option value="">Select day of Month</option>
      {options.map((num) => (
        <option key={num} value={num}>
          {getLabel(num)}
        </option>
      ))}
    </select>
  );
};

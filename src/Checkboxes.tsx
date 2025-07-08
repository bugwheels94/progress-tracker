import React from "react";

const days = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

type Props = {
  value: number[];
  onChange: (val: number[]) => void;
  selectAll?: boolean;
};

export const Checkboxes: React.FC<Props> = ({
  value,
  onChange,
  selectAll = true,
}) => {
  const toggleDay = (index: number) => {
    const newValue = value.includes(index)
      ? value.filter((i) => i !== index)
      : [...value, index].sort((a, b) => a - b);
    onChange(newValue);
  };

  const toggleAll = () => {
    if (value.length === 7) {
      onChange([]);
    } else {
      onChange([0, 1, 2, 3, 4, 5, 6]);
    }
  };

  return (
    <div className=" flex items-center justify-between items-center">
      <span className="pr-5">Select Day of Week</span>
      {selectAll && (
        <label className="inline-flex items-center mr-2">
          <input
            type="checkbox"
            checked={value.length === 7}
            onChange={toggleAll}
            className="mr-2"
          />
          Select All
        </label>
      )}
      {days.map((day, index) => (
        <label key={index} className="inline-flex items-center mr-2">
          <input
            type="checkbox"
            checked={value.includes(index)}
            onChange={() => toggleDay(index)}
            className="mr-2"
          />
          {day}
        </label>
      ))}
    </div>
  );
};

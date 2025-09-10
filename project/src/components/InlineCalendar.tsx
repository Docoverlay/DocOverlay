import React, { useState } from 'react';

export interface InlineCalendarProps {
  selected: string[];
  onDayClick: (dateYMD: string, opts: { shift: boolean }) => void;
  className?: string;
  disabled?: boolean;
}

const WEEK_LABELS = ['lu','ma','me','je','ve','sa','di'];

const pad = (n: number) => String(n).padStart(2, '0');
const toYMD = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const InlineCalendar: React.FC<InlineCalendarProps> = ({ selected, onDayClick, className = '', disabled = false }) => {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const firstOfMonth = new Date(viewYear, viewMonth, 1);
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const offset = (firstOfMonth.getDay() + 6) % 7;

  const isSelected = (d: number) => selected.includes(toYMD(new Date(viewYear, viewMonth, d)));
  const gotoPrev = () => { if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); } else setViewMonth(m => m - 1); };
  const gotoNext = () => { if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); } else setViewMonth(m => m + 1); };

  const monthLabel = new Date(viewYear, viewMonth, 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

  const cells: (number | null)[] = [
    ...Array.from({ length: offset }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <div className={`border rounded-md p-2 bg-white ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <button onClick={gotoPrev} className="px-2 py-1 rounded hover:bg-gray-100" type="button" disabled={disabled}>‹</button>
        <div className="text-sm font-medium capitalize">{monthLabel}</div>
        <button onClick={gotoNext} className="px-2 py-1 rounded hover:bg-gray-100" type="button" disabled={disabled}>›</button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-[11px] text-gray-500 mb-1">
        {WEEK_LABELS.map(w => <div key={w} className="text-center uppercase">{w}</div>)}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((d, idx) => {
          if (d === null) return <div key={`e${idx}`} />;
          const dateObj = new Date(viewYear, viewMonth, d);
          const ymd = toYMD(dateObj);
          const selectedDay = isSelected(d);
          const isToday = toYMD(today) === ymd;
          return (
            <button
              key={ymd}
              type="button"
              onMouseDown={(ev: React.MouseEvent<HTMLButtonElement>) => { if (disabled) return; ev.preventDefault(); onDayClick(ymd, { shift: ev.shiftKey }); }}
              className={`h-8 rounded text-sm border transition-colors ${selectedDay ? 'bg-pink-500 text-white border-pink-600' : 'bg-white hover:bg-gray-50 border-gray-300'} ${isToday && !selectedDay ? 'ring-1 ring-pink-300' : ''} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              title={dateObj.toLocaleDateString('fr-FR')}
              disabled={disabled}
            >
              {d}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default InlineCalendar;

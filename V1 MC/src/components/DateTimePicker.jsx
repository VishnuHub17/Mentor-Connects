import React, { useEffect, useRef, useState } from 'react';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

function pad2(n) {
  return String(n).padStart(2, '0');
}

function parseDateValue(dateValue) {
  if (!dateValue) return null;
  const [y, m, d] = dateValue.split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

function parseTimeValue(timeValue) {
  if (!timeValue) return null;
  const [h, m] = timeValue.split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return { hour24: h, minute: m };
}

function formatDisplay(dateValue, timeValue) {
  const date = parseDateValue(dateValue);
  const time = parseTimeValue(timeValue);

  const dateStr = date
    ? `${pad2(date.getDate())}/${pad2(date.getMonth() + 1)}/${date.getFullYear()}`
    : 'Select date';

  if (!time) return dateStr;

  const hour12 = ((time.hour24 + 11) % 12) + 1;
  const ampm = time.hour24 >= 12 ? 'PM' : 'AM';
  return `${dateStr}, ${pad2(hour12)}:${pad2(time.minute)} ${ampm}`;
}

function buildCalendarGrid(viewMonth) {
  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const startOffset = firstOfMonth.getDay();
  const gridStart = new Date(year, month, 1 - startOffset);

  const days = [];
  for (let i = 0; i < 42; i++) {
    const day = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i);
    days.push(day);
  }
  return days;
}

export default function DateTimePicker({ dateValue, timeValue, onDateChange, onTimeChange, required }) {
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState('date');
  const [viewMonth, setViewMonth] = useState(() => parseDateValue(dateValue) || new Date());
  const containerRef = useRef(null);

  useEffect(() => {
    const parsed = parseDateValue(dateValue);
    if (parsed) setViewMonth(parsed);
  }, [dateValue]);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const openPicker = () => {
    setView(dateValue ? (timeValue ? 'date' : 'date') : 'date');
    setIsOpen(true);
  };

  const handlePickDay = (day) => {
    const newDateValue = `${day.getFullYear()}-${pad2(day.getMonth() + 1)}-${pad2(day.getDate())}`;
    onDateChange(newDateValue);
    setView('time');
  };

  const selectedDate = parseDateValue(dateValue);
  const selectedTime = parseTimeValue(timeValue) || { hour24: 13, minute: 0 };
  const selectedHour12 = ((selectedTime.hour24 + 11) % 12) + 1;
  const selectedAmPm = selectedTime.hour24 >= 12 ? 'PM' : 'AM';

  const commitTime = (hour12, minute, ampm) => {
    let hour24 = hour12 % 12;
    if (ampm === 'PM') hour24 += 12;
    onTimeChange(`${pad2(hour24)}:${pad2(minute)}`);
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const days = buildCalendarGrid(viewMonth);

  return (
    <div className="relative" ref={containerRef}>
      <div className="relative flex items-center">
        <span className="material-symbols-outlined absolute ml-4 text-outline-variant pointer-events-none">
          {view === 'time' ? 'schedule' : 'event'}
        </span>
        <input
          required={required}
          readOnly
          onClick={openPicker}
          value={formatDisplay(dateValue, timeValue)}
          placeholder="Select date & time"
          className="w-full bg-surface-container-highest border-none rounded-lg pl-12 pr-4 py-3 text-on-surface focus:ring-2 focus:ring-primary/40 transition-all font-body text-base cursor-pointer"
        />
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-2 w-[300px] bg-surface-container-lowest rounded-xl shadow-2xl border border-outline-variant/20 p-4">
          {view === 'date' ? (
            <>
              <div className="flex items-center justify-between mb-3">
                <button
                  type="button"
                  onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1))}
                  className="p-1.5 rounded-md hover:bg-surface-container text-on-surface-variant"
                >
                  <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                </button>
                <span className="text-sm font-bold text-on-surface">
                  {MONTH_NAMES[viewMonth.getMonth()]} {viewMonth.getFullYear()}
                </span>
                <button
                  type="button"
                  onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1))}
                  className="p-1.5 rounded-md hover:bg-surface-container text-on-surface-variant"
                >
                  <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                </button>
              </div>

              <div className="grid grid-cols-7 gap-1 text-center mb-1">
                {WEEKDAYS.map((wd) => (
                  <span key={wd} className="text-[10px] font-bold uppercase text-on-surface-variant/70 py-1">{wd}</span>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1 text-center">
                {days.map((day) => {
                  const isCurrentMonth = day.getMonth() === viewMonth.getMonth();
                  const isToday = day.getTime() === today.getTime();
                  const isSelected = selectedDate && day.getTime() === selectedDate.getTime();

                  return (
                    <button
                      type="button"
                      key={day.toISOString()}
                      onClick={() => handlePickDay(day)}
                      className={[
                        'text-sm py-1.5 rounded-md transition-colors',
                        isSelected ? 'bg-primary text-on-primary font-bold' : '',
                        !isSelected && isToday ? 'border border-primary text-primary font-bold' : '',
                        !isSelected && !isToday && isCurrentMonth ? 'text-on-surface hover:bg-surface-container' : '',
                        !isSelected && !isToday && !isCurrentMonth ? 'text-outline-variant hover:bg-surface-container' : ''
                      ].join(' ')}
                    >
                      {day.getDate()}
                    </button>
                  );
                })}
              </div>

              <div className="flex justify-end mt-3 pt-3 border-t border-outline-variant/15">
                <button
                  type="button"
                  onClick={() => setView('time')}
                  className="flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
                >
                  <span className="material-symbols-outlined text-[16px]">schedule</span>
                  Set time
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm font-bold text-on-surface mb-4">Select time</p>
              <div className="flex items-center justify-center gap-2 mb-4">
                <select
                  value={selectedHour12}
                  onChange={(e) => commitTime(Number(e.target.value), selectedTime.minute, selectedAmPm)}
                  className="bg-surface-container-highest border-none rounded-lg px-3 py-2 text-on-surface font-bold text-lg focus:ring-2 focus:ring-primary/40"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
                    <option key={h} value={h}>{pad2(h)}</option>
                  ))}
                </select>
                <span className="text-lg font-bold text-on-surface">:</span>
                <select
                  value={selectedTime.minute}
                  onChange={(e) => commitTime(selectedHour12, Number(e.target.value), selectedAmPm)}
                  className="bg-surface-container-highest border-none rounded-lg px-3 py-2 text-on-surface font-bold text-lg focus:ring-2 focus:ring-primary/40"
                >
                  {Array.from({ length: 12 }, (_, i) => i * 5).map((m) => (
                    <option key={m} value={m}>{pad2(m)}</option>
                  ))}
                </select>
                <select
                  value={selectedAmPm}
                  onChange={(e) => commitTime(selectedHour12, selectedTime.minute, e.target.value)}
                  className="bg-surface-container-highest border-none rounded-lg px-3 py-2 text-on-surface font-bold text-lg focus:ring-2 focus:ring-primary/40"
                >
                  <option value="AM">AM</option>
                  <option value="PM">PM</option>
                </select>
              </div>

              <div className="flex justify-between items-center mt-3 pt-3 border-t border-outline-variant/15">
                <button
                  type="button"
                  onClick={() => setView('date')}
                  className="flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
                >
                  <span className="material-symbols-outlined text-[16px]">event</span>
                  Change date
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-3 py-1.5 rounded-md bg-primary text-on-primary text-xs font-bold"
                >
                  Done
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

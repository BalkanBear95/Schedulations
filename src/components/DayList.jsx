import "./DayList.css";

function DayList({
  years,
  selectedYear,
  onSelectYear,
  months,
  selectedMonth,
  onSelectMonth,
  days,
  selectedDay,
  onSelectDay,
}) {
  const weekdayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const firstDate = new Date(selectedYear, selectedMonth, 1);
  const firstDayIndex = (firstDate.getDay() + 6) % 7;
  const getMonthSeasonData = (monthIndex) => {
    if (monthIndex === 11 || monthIndex === 0 || monthIndex === 1) {
      return {
        emoji: "❄️",
        seasonClassName: "day-list-month-button-winter",
      };
    }

    if (monthIndex >= 2 && monthIndex <= 4) {
      return {
        emoji: "🌸",
        seasonClassName: "day-list-month-button-spring",
      };
    }

    if (monthIndex >= 5 && monthIndex <= 7) {
      return {
        emoji: "☀️",
        seasonClassName: "day-list-month-button-summer",
      };
    }

    return {
      emoji: "🍂",
      seasonClassName: "day-list-month-button-autumn",
    };
  };
  const calendarCells = [
    ...Array.from({ length: firstDayIndex }, (_, index) => ({
      key: `empty-${index}`,
      isEmpty: true,
    })),
    ...days.map((day) => {
      const date = new Date(selectedYear, selectedMonth, day);
      const dayOfWeek = date.getDay();

      return {
        key: day,
        day,
        isEmpty: false,
        isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
      };
    }),
  ];

  return (
    <div className="day-list">
      <h2 className="day-list-title">Select date</h2>

      <div className="day-list-section">
        <label className="day-list-year-label">
          <span className="day-list-section-label">Year</span>
          <select
            value={selectedYear}
            onChange={(event) => onSelectYear(event.target.value)}
            className="day-list-year-select"
          >
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="day-list-main-grid">
        <div className="day-list-section day-list-month-panel">
          <p className="day-list-section-label">Select month</p>
          <div className="day-list-months">
            {months.map((month, index) => {
              const seasonData = getMonthSeasonData(index);

              return (
                <button
                  key={month}
                  type="button"
                  onClick={() => onSelectMonth(index)}
                  className={`day-list-month-button ${
                    seasonData.seasonClassName
                  } ${
                    selectedMonth === index
                      ? "day-list-month-button-selected"
                      : ""
                  }`}
                >
                  <span className="day-list-month-emoji">{seasonData.emoji}</span>
                  <span className="day-list-month-name">{month}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="day-list-section day-list-calendar-panel">
          <p className="day-list-section-label">Select day</p>
          <div className="day-list-calendar">
            <div className="day-list-weekdays">
              {weekdayLabels.map((weekdayLabel) => (
                <div key={weekdayLabel} className="day-list-weekday-cell">
                  {weekdayLabel}
                </div>
              ))}
            </div>

            <div className="day-list-calendar-grid">
              {calendarCells.map((cell) =>
                cell.isEmpty ? (
                  <div
                    key={cell.key}
                    className="day-list-day-cell day-list-day-cell-empty"
                    aria-hidden="true"
                  />
                ) : (
                  <button
                    key={cell.key}
                    type="button"
                    onClick={() => onSelectDay(cell.day)}
                    className={`day-list-day-cell ${
                      selectedDay === cell.day
                        ? "day-list-day-cell-selected"
                        : ""
                    } ${
                      cell.isWeekend ? "day-list-day-cell-weekend" : ""
                    }`}
                  >
                    <span className="day-list-day-number">{cell.day}</span>
                  </button>
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DayList;

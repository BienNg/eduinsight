// src/features/courses/CourseDetail/components/CourseCalendar/CalendarGrid.jsx
import React, { useRef } from 'react';
import CalendarDay from './CalendarDay';

// In CalendarGrid.jsx

const CalendarGrid = ({
  activeTab,
  previousTab,
  isAnimating,
  direction,
  monthTabs,
  generateCalendarData,
  handleAnimationEnd,
  weekdayPattern,
  onToggleWeekday,
  isUpdating // Add this parameter
}) => {
  const gridRef = useRef(null);

  if (!isAnimating) {
    // When not animating, just show the active month
    const activeTabData = monthTabs[activeTab];
    const calendarData = generateCalendarData(activeTabData.month, activeTabData.year);

    return (
      <div className="calendar-grid-wrapper">
        <div className="calendar-grid active">
          <CalendarDaysHeader
            weekdayPattern={weekdayPattern}
            onToggleWeekday={onToggleWeekday}
            isUpdating={isUpdating} // Pass the updating state
          />
          {calendarData.map((week, weekIndex) => (
            <div key={`week-${weekIndex}`} className="calendar-week">
              {week.map((day, dayIndex) => (
                <div key={`day-${weekIndex}-${dayIndex}`}>
                  <CalendarDay day={day} />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // During animation, show both previous and new grids with appropriate animations
  const previousTabData = monthTabs[previousTab];
  const activeTabData = monthTabs[activeTab];

  const previousCalendarData = generateCalendarData(previousTabData.month, previousTabData.year);
  const activeCalendarData = generateCalendarData(activeTabData.month, activeTabData.year);

  return (
    <div className="calendar-grid-wrapper" ref={gridRef}>
      {/* Previous month grid */}
      <div
        className={`calendar-grid ${direction === 'left' ? 'slide-out-left' : 'slide-out-right'}`}
        onAnimationEnd={handleAnimationEnd}
      >
        <CalendarDaysHeader
          weekdayPattern={weekdayPattern}
          onToggleWeekday={onToggleWeekday}
        />
        {previousCalendarData.map((week, weekIndex) => (
          <div key={`prev-week-${weekIndex}`} className="calendar-week">
            {week.map((day, dayIndex) => (
              <div key={`prev-day-${weekIndex}-${dayIndex}`}>
                <CalendarDay day={day} />
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Active month grid */}
      <div
        className={`calendar-grid ${direction === 'left' ? 'slide-in-right' : 'slide-in-left'}`}
      >
        <CalendarDaysHeader
          weekdayPattern={weekdayPattern}
          onToggleWeekday={onToggleWeekday}
        />
        {activeCalendarData.map((week, weekIndex) => (
          <div key={`active-week-${weekIndex}`} className="calendar-week">
            {week.map((day, dayIndex) => (
              <div key={`active-day-${weekIndex}-${dayIndex}`}>
                <CalendarDay day={day} />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

const CalendarDaysHeader = ({
  weekdayPattern = [],
  onToggleWeekday,
  isUpdating
}) => {
  // Full weekday names in order (Monday-first format)
  const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  // Short labels for display
  const weekdayLabels = ['M', 'D', 'M', 'D', 'F', 'S', 'S'];

  // Check if a day is in the pattern
  const isDayHighlighted = (index) => {
    return weekdayPattern.includes(weekdays[index]);
  };

  // Handle click on a weekday header
  const handleDayClick = (index) => {
    console.log(`Clicked on ${weekdays[index]}`); // Debug log
    if (onToggleWeekday) {
      onToggleWeekday(weekdays[index]);
    } else {
      console.error('onToggleWeekday is not defined or not passed properly');
    }
  };

  return (
    <div className="calendar-days-header">
      {weekdayLabels.map((label, index) => (
        <div
          key={`day-header-${index}`}
          className={`day-header ${isDayHighlighted(index) ? 'highlighted-day' : ''} ${isUpdating ? 'updating' : ''}`}
          onClick={() => handleDayClick(index)}
          style={{ cursor: 'pointer' }} // Add explicit cursor style
        >
          {label}
        </div>
      ))}
    </div>
  );
};
export default CalendarGrid;
// src/features/courses/CourseDetail/components/CourseCalendar/CalendarGrid.jsx
import React, { useRef } from 'react';
import CalendarDay from './CalendarDay';

const CalendarGrid = ({ 
  activeTab, 
  previousTab, 
  isAnimating, 
  direction, 
  monthTabs, 
  generateCalendarData, 
  handleAnimationEnd 
}) => {
  const gridRef = useRef(null);
  
  if (!isAnimating) {
    // When not animating, just show the active month
    const activeTabData = monthTabs[activeTab];
    const calendarData = generateCalendarData(activeTabData.month, activeTabData.year);
    
    return (
      <div className="calendar-grid-wrapper">
        <div className="calendar-grid active">
          <CalendarDaysHeader />
          
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
        <CalendarDaysHeader />
        
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
        <CalendarDaysHeader />
        
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

const CalendarDaysHeader = () => (
  <div className="calendar-days-header">
    <div className="day-header">M</div>
    <div className="day-header">D</div>
    <div className="day-header">M</div>
    <div className="day-header">D</div>
    <div className="day-header">F</div>
    <div className="day-header">S</div>
    <div className="day-header">S</div>
  </div>
);

export default CalendarGrid;
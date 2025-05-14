// src/features/courses/CourseDetail/components/CourseCalendar.jsx
import React, { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import '../../../styles/CourseCalendar.css';

const CourseCalendar = ({ course, sessions = [] }) => {
  // State for animations and tab management
  const [activeTab, setActiveTab] = useState(0);
  const [previousTab, setPreviousTab] = useState(0);
  const [direction, setDirection] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const gridRef = useRef(null);

  // Parse a date string in DD.MM.YYYY format to a Date object
  const parseDate = (dateStr) => {
    if (!dateStr || dateStr === "N/A") return null;
    const [day, month, year] = dateStr.split('.').map(Number);
    return new Date(year, month - 1, day);
  };

  // Sort sessions by date
  const sortedSessions = [...sessions].sort((a, b) => {
    const dateA = parseDate(a.date);
    const dateB = parseDate(b.date);
    
    if (!dateA) return 1;
    if (!dateB) return -1;
    
    return dateA - dateB;
  });
  
  // Get the first session date and last session date
  const firstSession = sortedSessions.length > 0 ? sortedSessions[0] : null;
  const lastSession = sortedSessions.length > 0 ? sortedSessions[sortedSessions.length - 1] : null;
  
  const startDateStr = firstSession?.date || "N/A";
  const endDateStr = lastSession?.date || "N/A";
  
  const startDate = parseDate(startDateStr);
  const endDate = parseDate(endDateStr);
  
  // Get the last completed session
  const lastCompletedSession = [...sortedSessions]
    .filter(session => session.status === "completed" || session.status === "complete")
    .pop();
  
  const lastCompletedDate = lastCompletedSession?.date || "N/A";

  // Generate month tabs between start date and end date
  const generateMonthTabs = () => {
    if (!startDate || !endDate) {
      // If we don't have valid dates, return the current month
      const now = new Date();
      return [{
        id: 0,
        label: new Date(now.getFullYear(), now.getMonth(), 1).toLocaleString('default', { month: 'long' }),
        month: now.getMonth(),
        year: now.getFullYear()
      }];
    }
    
    const tabs = [];
    const currentDate = new Date(startDate);
    
    // Set the date to the first day of the month for proper comparison
    currentDate.setDate(1);
    const endMonthDate = new Date(endDate);
    endMonthDate.setDate(1);
    
    // Generate a tab for each month from start to end
    let tabId = 0;
    while (currentDate <= endMonthDate) {
      const monthName = currentDate.toLocaleString('default', { month: 'long' });
      const monthYear = currentDate.getFullYear();
      
      tabs.push({
        id: tabId++,
        label: monthName,
        month: currentDate.getMonth(),
        year: monthYear
      });
      
      // Move to the next month
      currentDate.setMonth(currentDate.getMonth() + 1);
    }
    
    return tabs;
  };
  
  const monthTabs = generateMonthTabs();

  // Set initial activeTab to the current month if possible
  useEffect(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // Check if there's a tab for the current month
    const currentMonthTab = monthTabs.findIndex(tab => 
      tab.month === currentMonth && tab.year === currentYear
    );
    
    if (currentMonthTab >= 0) {
      setActiveTab(currentMonthTab);
      setPreviousTab(currentMonthTab);
    }
  }, [monthTabs]);
  
  // Format for display (DD.MM)
  const formatShortDate = (dateStr) => {
    if (!dateStr || dateStr === "N/A") return "N/A";
    const parts = dateStr.split('.');
    if (parts.length < 2) return dateStr;
    return `${parts[0]}.${parts[1]}`;
  };
  
  // Generate calendar data for a specific month
  const generateCalendarData = (month, year) => {
    const weeks = [];
    
    // Create a date object for the first day of the month
    const firstDayOfMonth = new Date(year, month, 1);
    
    // Get the day of the week (0 = Sunday, 6 = Saturday)
    // Convert to Monday-first format (0 = Monday, 6 = Sunday)
    let startDayOfWeek = firstDayOfMonth.getDay() - 1;
    if (startDayOfWeek < 0) startDayOfWeek = 6; // If Sunday, set to 6
    
    // Get the number of days in the month
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    // Create a map of dates with sessions
    const sessionDays = new Map();
    
    // Map sessions to their corresponding days
    sortedSessions.forEach(session => {
      if (!session.date) return;
      
      const sessionDate = parseDate(session.date);
      if (sessionDate && sessionDate.getMonth() === month && sessionDate.getFullYear() === year) {
        // Store the day and the session information
        const day = sessionDate.getDate();
        
        if (!sessionDays.has(day)) {
          sessionDays.set(day, []);
        }
        
        sessionDays.get(day).push(session);
      }
    });
    
    // Get today's date
    const today = new Date();
    const isCurrentMonth = today.getMonth() === month && today.getFullYear() === year;
    const todayDate = today.getDate();
    
    // Initialize the first week with empty cells for days from previous month
    let currentWeek = Array(startDayOfWeek).fill(null);
    
    // Add days of the current month
    for (let day = 1; day <= daysInMonth; day++) {
      const sessionsOnDay = sessionDays.get(day) || [];
      
      currentWeek.push({
        day,
        hasSession: sessionsOnDay.length > 0,
        sessions: sessionsOnDay,
        isToday: isCurrentMonth && day === todayDate
      });
      
      // If we've reached Sunday (end of the week) or the last day of the month
      if (currentWeek.length === 7 || day === daysInMonth) {
        // Fill the rest of the week with null for days in the next month
        while (currentWeek.length < 7) {
          currentWeek.push(null);
        }
        
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }
    
    return weeks;
  };

  // Handle tab navigation
  const handlePrevTab = () => {
    if (activeTab > 0 && !isAnimating) {
      setDirection('right');
      setPreviousTab(activeTab);
      setIsAnimating(true);
      setActiveTab(activeTab - 1);
    }
  };
  
  const handleNextTab = () => {
    if (activeTab < monthTabs.length - 1 && !isAnimating) {
      setDirection('left');
      setPreviousTab(activeTab);
      setIsAnimating(true);
      setActiveTab(activeTab + 1);
    }
  };

  const handleTabClick = (tabIndex) => {
    if (tabIndex === activeTab || isAnimating) return;
    
    setDirection(tabIndex > activeTab ? 'left' : 'right');
    setPreviousTab(activeTab);
    setIsAnimating(true);
    setActiveTab(tabIndex);
  };

  const handleAnimationEnd = () => {
    if (isAnimating) {
      setIsAnimating(false);
      setPreviousTab(activeTab);
    }
  };

  // Render a single calendar day
  const renderCalendarDay = (day) => {
    if (!day) return <div className="calendar-day"></div>;
    
    const hasSessionClass = day.hasSession ? 'has-session' : 'no-session';
    const todayClass = day.isToday ? 'today' : '';
    
    return (
      <div className={`calendar-day ${hasSessionClass} ${todayClass}`}>
        {day.day}
      </div>
    );
  };

  // Render calendar grid with animation
  const renderCalendarGrid = () => {
    if (!isAnimating) {
      // When not animating, just show the active month
      const activeTabData = monthTabs[activeTab];
      const calendarData = generateCalendarData(activeTabData.month, activeTabData.year);
      
      return (
        <div className="calendar-grid-wrapper">
          <div className="calendar-grid active">
            <div className="calendar-days-header">
              <div className="day-header">M</div>
              <div className="day-header">D</div>
              <div className="day-header">M</div>
              <div className="day-header">D</div>
              <div className="day-header">F</div>
              <div className="day-header">S</div>
              <div className="day-header">S</div>
            </div>
            
            {calendarData.map((week, weekIndex) => (
              <div key={`week-${weekIndex}`} className="calendar-week">
                {week.map((day, dayIndex) => (
                  <div key={`day-${weekIndex}-${dayIndex}`}>
                    {renderCalendarDay(day)}
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
          <div className="calendar-days-header">
            <div className="day-header">M</div>
            <div className="day-header">D</div>
            <div className="day-header">M</div>
            <div className="day-header">D</div>
            <div className="day-header">F</div>
            <div className="day-header">S</div>
            <div className="day-header">S</div>
          </div>
          
          {previousCalendarData.map((week, weekIndex) => (
            <div key={`prev-week-${weekIndex}`} className="calendar-week">
              {week.map((day, dayIndex) => (
                <div key={`prev-day-${weekIndex}-${dayIndex}`}>
                  {renderCalendarDay(day)}
                </div>
              ))}
            </div>
          ))}
        </div>
        
        {/* Active month grid */}
        <div 
          className={`calendar-grid ${direction === 'left' ? 'slide-in-right' : 'slide-in-left'}`}
        >
          <div className="calendar-days-header">
            <div className="day-header">M</div>
            <div className="day-header">D</div>
            <div className="day-header">M</div>
            <div className="day-header">D</div>
            <div className="day-header">F</div>
            <div className="day-header">S</div>
            <div className="day-header">S</div>
          </div>
          
          {activeCalendarData.map((week, weekIndex) => (
            <div key={`active-week-${weekIndex}`} className="calendar-week">
              {week.map((day, dayIndex) => (
                <div key={`active-day-${weekIndex}-${dayIndex}`}>
                  {renderCalendarDay(day)}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Calculate the total number of sessions
  const totalSessions = sortedSessions.length;
  
  // Calculate the number of completed sessions
  const completedSessions = sortedSessions.filter(
    session => session.status === "completed" || session.status === "complete"
  ).length;

  return (
    <div className="course-calendar overview-panel animate-card">
      <div className="calendar-header">
        <div className="calendar-title-section">
          <h2 className="calendar-title">Kurs Kalender</h2>
          <span className="calendar-date-range">
            {startDateStr !== "N/A" && endDateStr !== "N/A" 
              ? `From ${formatShortDate(startDateStr)} - ${formatShortDate(endDateStr)}, ${startDate ? startDate.getFullYear() : new Date().getFullYear()}`
              : startDateStr !== "N/A" ? `From ${formatShortDate(startDateStr)}` : "No sessions scheduled"}
          </span>
        </div>
        <button className="kurs-start-button">Kurs Start</button>
      </div>
      
      <div className="calendar-summary">
        <div className="calendar-metric">
          <div className="metric-value">{formatShortDate(startDateStr)}</div>
          <div className="metric-label">Start</div>
        </div>
        <div className="calendar-metric">
          <div className="metric-value">{formatShortDate(lastCompletedDate)}</div>
          <div className="metric-label">Laufend</div>
        </div>
        <div className="calendar-metric">
          <div className="metric-value">{`${completedSessions}/${totalSessions}`}</div>
          <div className="metric-label">Sessions</div>
        </div>
        <div className="status-indicator">
          <div className="status-circle"></div>
        </div>
      </div>
      
      {/* Custom tab navigation, styled like TabCard */}
      <div className="calendar-tab-navigation">
        <div className="panel-header">
          <h3 className="panel-title">
            {monthTabs[activeTab]?.label || "Calendar"}
          </h3>
          
          <div className="tab-card-navigation">
            <button 
              className={`tab-nav-button ${activeTab === 0 || isAnimating ? 'disabled' : ''}`}
              onClick={handlePrevTab}
              disabled={activeTab === 0 || isAnimating}
            >
              <FontAwesomeIcon icon={faChevronLeft} />
            </button>
            
            <div className="tab-indicators">
              {monthTabs.map((tab, index) => (
                <div 
                  key={tab.id}
                  className={`tab-indicator ${activeTab === index ? 'active' : ''}`}
                  onClick={() => handleTabClick(index)}
                />
              ))}
            </div>
            
            <button 
              className={`tab-nav-button ${activeTab === monthTabs.length - 1 || isAnimating ? 'disabled' : ''}`}
              onClick={handleNextTab}
              disabled={activeTab === monthTabs.length - 1 || isAnimating}
            >
              <FontAwesomeIcon icon={faChevronRight} />
            </button>
          </div>
        </div>
      </div>
      
      {/* Calendar grid with animations */}
      <div className="calendar-content">
        {renderCalendarGrid()}
      </div>
    </div>
  );
};

export default CourseCalendar;
// src/features/courses/CourseDetail/components/CourseCalendar/hooks/useCalendarData.js
import { useState, useEffect, useRef } from 'react';

export const useCalendarData = (sessions = []) => {
  // State for animations and tab management
  const [activeTab, setActiveTab] = useState(0);
  const [previousTab, setPreviousTab] = useState(0);
  const [direction, setDirection] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const animationEndedRef = useRef(false);
  
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
  
  // Generate month tabs ONLY for months with sessions
  const generateMonthTabs = () => {
    if (sortedSessions.length === 0) {
      // If we don't have any sessions, return the current month
      const now = new Date();
      return [{
        id: 0,
        label: `${new Date(now.getFullYear(), now.getMonth(), 1).toLocaleString('default', { month: 'long' })} ${now.getFullYear()}`,
        month: now.getMonth(),
        year: now.getFullYear()
      }];
    }
    
    // Create a Set to track unique month/year combinations
    const monthYearSet = new Set();
    
    // Add each month that has sessions
    sortedSessions.forEach(session => {
      if (!session.date) return;
      
      const sessionDate = parseDate(session.date);
      if (sessionDate) {
        const month = sessionDate.getMonth();
        const year = sessionDate.getFullYear();
        monthYearSet.add(`${month}-${year}`);
      }
    });
    
    // Convert the Set to an array of objects and sort chronologically
    const monthsWithSessions = Array.from(monthYearSet).map(monthYear => {
      const [month, year] = monthYear.split('-').map(Number);
      return { month, year };
    }).sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.month - b.month;
    });
    
    // Create the tabs with proper labels including year
    return monthsWithSessions.map((item, index) => ({
      id: index,
      label: `${new Date(item.year, item.month, 1).toLocaleString('default', { month: 'long' })} ${item.year}`,
      month: item.month,
      year: item.year
    }));
  };
  
  const monthTabs = generateMonthTabs();
  
  // Set initial activeTab to the current month if possible, otherwise to the latest month with sessions
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
    } else if (monthTabs.length > 0) {
      // If current month not found, default to the last month with sessions
      setActiveTab(monthTabs.length - 1);
      setPreviousTab(monthTabs.length - 1);
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
      animationEndedRef.current = false; // Reset animation completion flag
      setDirection('right');
      setPreviousTab(activeTab);
      setIsAnimating(true);
      setActiveTab(prevActiveTab => prevActiveTab - 1);
    }
  };
  
  const handleNextTab = () => {
    if (activeTab < monthTabs.length - 1 && !isAnimating) {
      animationEndedRef.current = false; // Reset animation completion flag
      setDirection('left');
      setPreviousTab(activeTab);
      setIsAnimating(true);
      setActiveTab(prevActiveTab => prevActiveTab + 1);
    }
  };
  
  const handleTabClick = (tabIndex) => {
    if (tabIndex === activeTab || isAnimating) return;
    
    animationEndedRef.current = false; // Reset animation completion flag
    setDirection(tabIndex > activeTab ? 'left' : 'right');
    setPreviousTab(activeTab);
    setIsAnimating(true);
    setActiveTab(tabIndex);
  };
  
  const handleAnimationEnd = () => {
    // Prevent duplicate calls by checking our ref
    if (isAnimating && !animationEndedRef.current) {
      animationEndedRef.current = true;
      setIsAnimating(false);
    }
  };
  
  // Calculate the total number of sessions
  const totalSessions = sortedSessions.length;
  
  // Calculate the number of completed sessions
  const completedSessions = sortedSessions.filter(
    session => session.status === "completed" || session.status === "complete"
  ).length;
  
  return {
    monthTabs,
    activeTab,
    previousTab,
    direction,
    isAnimating,
    setActiveTab,
    handlePrevTab,
    handleNextTab,
    handleTabClick,
    handleAnimationEnd,
    startDateStr,
    endDateStr,
    lastCompletedDate,
    completedSessions,
    totalSessions,
    generateCalendarData,
    formatShortDate,
    startDate,
    endDate
  };
};
// src/features/teachers/utils/teacherDetailUtils.js
export const prepareChartData = (sessions) => {
    const monthlyHours = {};
    const monthNames = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
  
    sessions.forEach(session => {
      if (session.date) {
        const dateParts = session.date.split('.');
        if (dateParts.length === 3) {
          const monthNum = parseInt(dateParts[1]) - 1;
          const fullYear = dateParts[2];
          const shortYear = fullYear.slice(2);
          const monthKey = `${dateParts[1]}.${fullYear}`;
          const displayMonth = `${monthNames[monthNum]} ${shortYear}`;
  
          const sessionHours = session.isLongSession === true ? 2 : 1.5;
  
          if (!monthlyHours[monthKey]) {
            monthlyHours[monthKey] = {
              month: displayMonth,
              hours: 0,
              sortKey: monthKey
            };
          }
          monthlyHours[monthKey].hours += sessionHours;
        }
      }
    });
  
    return Object.values(monthlyHours)
      .sort((a, b) => {
        const [monthA, yearA] = a.sortKey.split('.');
        const [monthB, yearB] = b.sortKey.split('.');
        return (yearA - yearB) || (monthA - monthB);
      });
  };
  
  export const getTotalSessionsByLevel = (level) => {
    switch (level) {
      case 'A1.1': return 18;
      case 'A1.2': return 20;
      case 'A2.1': return 20;
      case 'A2.2': return 20;
      case 'B1.1': return 20;
      case 'B1.2': return 20;
      default: return 0;
    }
  };
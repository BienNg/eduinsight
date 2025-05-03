// Helper functions for month overview tab
export const getMonthName = (monthId) => {
    if (!monthId) return '';
    
    const [year, month] = monthId.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    const monthNames = [
      'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
      'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
    ];
    return `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
  };
  
  export const prepareLevelData = (courses) => {
    const levelCounts = {};
    courses.forEach(course => {
      const level = course.level || 'Unbekannt';
      levelCounts[level] = (levelCounts[level] || 0) + 1;
    });
    return Object.entries(levelCounts).map(([level, count]) => ({
      name: level,
      value: count
    }));
  };
  
  export const prepareChartData = (currentDate, monthDetails) => {
    const last4Months = Array.from({ length: 4 }, (_, i) => {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - (3 - i), 1);
      return {
        year: date.getFullYear(),
        month: date.getMonth() + 1
      };
    });
    
    const monthNames = [
      'Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun',
      'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'
    ];
    
    return last4Months.map(({ year, month }) => {
      const monthId = `${year}-${month.toString().padStart(2, '0')}`;
      const details = monthDetails[monthId];
      return {
        month: monthNames[month - 1].substring(0, 3),
        courses: details ? details.courseCount : 0
      };
    });
  };
  
  export const groupCoursesByGroup = (courses, getGroupName) => {
    const courseGroups = {};
    courses.forEach(course => {
      const groupName = getGroupName(course.groupId);
      if (!courseGroups[groupName]) {
        courseGroups[groupName] = [];
      }
      courseGroups[groupName].push(course);
    });
    return courseGroups;
  };
  
  export const CHART_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];
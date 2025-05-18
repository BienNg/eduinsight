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
    // Define the specific levels we want to display, in the correct order
    const validLevels = ['A1.1', 'A1.2', 'A2.1', 'A2.2', 'B1.1', 'B1.2'];

    // Filter courses to only include those with valid levels
    const filteredCourses = courses.filter(course => validLevels.includes(course.level));

    // Initialize counts for each level (starting at 0)
    const levelCounts = {};
    validLevels.forEach(level => {
        levelCounts[level] = 0;
    });

    // Count occurrences of each level
    filteredCourses.forEach(course => {
        levelCounts[course.level]++;
    });

    // Convert to the required format for the chart, maintaining order
    return validLevels.map(level => ({
        name: level,
        value: levelCounts[level]
    }));
};

export const prepareChartData = (currentDate, monthDetails, teacherMonthData = null) => {
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

        // If no teacher filter is applied, show all courses
        if (!teacherMonthData) {
            return {
                month: monthNames[month - 1].substring(0, 3),
                courses: details ? details.courseCount : 0
            };
        }

        // If teacher filter is applied, count only courses taught by this teacher
        const teacherCourses = teacherMonthData && teacherMonthData[monthId]
            ? teacherMonthData[monthId].length
            : 0;

        return {
            month: monthNames[month - 1].substring(0, 3),
            courses: teacherCourses
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

export const CHART_COLORS = ['#579BFE', '#0088FE', '#8884d8', '#7366BD', '#FE9A65', '#FF8131'];
// src/features/import/services/dataProcessing.js
import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';
import {
    findColumnIndex, excelDateToJSDate, formatDate, formatTime,
    isGreenColor, isRedColor, parseDate
} from './excelUtils';
import {
    createTeacherRecord, createOrUpdateStudentRecord, getOrCreateMonthRecord, findExistingCourse,
    getOrCreateGroupRecord
} from './firebaseService';
import { createRecord, updateRecord, getRecordById } from '../../firebase/database';
import { ref, get, update } from "firebase/database";
import { database } from "../../firebase/config";
import { validateExcelFile as validateExcelFileFunction } from './excelUtils';
import { isLongSession } from '../../utils/sessionUtils';


const COURSE_COLORS = [
    '#911DD2', // Purple Base
    '#7310A8', // Purple Dark
    '#FF5F68', // Coral Red Base
    '#D94D54', // Coral Dark
    '#4DBEFF', // Sky Blue Base
    '#3A9BD4', // Sky Dark
    '#18BF69', // Emerald Green Base
    '#139954', // Emerald Dark
    '#FBC14E', // Golden Yellow Base
    '#D9A53F', // Golden Dark
    '#D21D91', // Purple Complement
    '#5FFFC8', // Coral Complement
    '#FF944D', // Sky Complement
    '#BF181D', // Emerald Complement
    '#4E9CFB'  // Golden Complement
];


const getNextCourseColor = async () => {
    try {
        // Get all existing courses
        const coursesRef = ref(database, 'courses');
        const coursesSnapshot = await get(coursesRef);
        const courses = [];

        if (coursesSnapshot.exists()) {
            const coursesData = coursesSnapshot.val();
            Object.keys(coursesData).forEach(key => {
                courses.push({
                    id: key,
                    ...coursesData[key]
                });
            });
        }

        // Count color usage
        const colorUsage = {};
        COURSE_COLORS.forEach(color => {
            colorUsage[color] = 0;
        });

        // Count how many times each color is used
        courses.forEach(course => {
            if (course.color && colorUsage[course.color] !== undefined) {
                colorUsage[course.color]++;
            }
        });

        // Find the minimum usage count
        let minUsage = Number.MAX_SAFE_INTEGER;
        Object.values(colorUsage).forEach(count => {
            if (count < minUsage) {
                minUsage = count;
            }
        });

        // Get all colors with minimum usage
        const candidateColors = COURSE_COLORS.filter(color =>
            colorUsage[color] === minUsage
        );

        // Select a random color from candidates
        const randomIndex = Math.floor(Math.random() * candidateColors.length);
        return candidateColors[randomIndex];

    } catch (error) {
        console.error("Error selecting course color:", error);
        // Fallback to a random color if there's an error
        const randomIndex = Math.floor(Math.random() * COURSE_COLORS.length);
        return COURSE_COLORS[randomIndex];
    }
};
export const validateExcelFile = validateExcelFileFunction;

export const processB1CourseFileWithColors = async (arrayBuffer, filename, options) => {

    const { ignoreMissingTimeColumns } = options;
    let sessionOrderCounter = 0;
    // Use XLSX and ExcelJS to parse the file
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    const excelWorkbook = new ExcelJS.Workbook();
    await excelWorkbook.xlsx.load(arrayBuffer);
    const excelWorksheet = excelWorkbook.worksheets[0];
    // Extract course level and group from filename
    const levelMatch = filename.match(/[AB][0-9]\.[0-9]/i);
    const level = levelMatch ? levelMatch[0] : '';
    const groupMatch = filename.match(/([GAMP]\d+)/i);
    const groupName = groupMatch ? groupMatch[1] : '';
    const courseName = `${groupName} ${level}`;
    // Extract online/offline status
    const onlineMatch = filename.match(/_online/i);
    const offlineMatch = filename.match(/_offline/i);
    const mode = onlineMatch ? 'Online' : (offlineMatch ? 'Offline' : 'Unknown');
    let isFirstSession = true;




    // Find the header row with "Folien"

    let headerRowIndex = -1;
    for (let i = 0; i < jsonData.length; i++) {
        if (jsonData[i][0] === "Folien") {
            headerRowIndex = i;
            break;
        }
    }

    if (headerRowIndex === -1) {
        console.error("Could not find header row with 'Folien'");
        headerRowIndex = 3; // Fallback
    }

    // Get the header row
    const headerRow = jsonData[headerRowIndex];

    // Map column indices for crucial data
    const columnIndices = {
        folien: findColumnIndex(headerRow, ["Folien", "Canva"]),
        inhalt: findColumnIndex(headerRow, ["Inhalt"]),
        notizen: findColumnIndex(headerRow, ["Notizen"]),
        date: findColumnIndex(headerRow, ["Datum", "Date", "Unterrichtstag"]),
        startTime: findColumnIndex(headerRow, ["von"]),
        endTime: findColumnIndex(headerRow, ["bis"]),
        teacher: findColumnIndex(headerRow, ["Lehrer"]),
        message: findColumnIndex(headerRow, ["Nachrichten"])
    };

    // Extract student information
    const students = [];
    const studentNames = []; // Add this to collect student names first

    // Students typically start from column K (index 10)
    for (let j = 10; j < headerRow.length; j++) {
        const studentName = headerRow[j];
        if (studentName && typeof studentName === 'string' && studentName.trim() !== '') {
            // Skip column headers
            if (studentName === "Anwesenheitsliste" ||
                studentName === "Nachrichten von/ für NaNu NaNa") {
                continue;
            }

            // Just collect the names and column indices for now
            studentNames.push({
                name: studentName,
                columnIndex: j
            });
        }
    }
    // Create or get the group record
    const groupRecord = await getOrCreateGroupRecord(groupName, mode);

    if (!groupRecord || !groupRecord.id) {
        console.error("Failed to create or retrieve a valid group record with ID");
        throw new Error("Failed to process file: Could not create group record");
    }

    // Create the course record first
    const existingCourse = await findExistingCourse(groupName, level);

    if (existingCourse) {
        const latestSessionInfo = existingCourse.latestSessionDate
            ? `The latest session recorded is on the ${existingCourse.latestSessionDate}`
            : 'No sessions have been recorded yet';

        const errorMessage = `The Course ${existingCourse.name} already exists. ${latestSessionInfo}.`;

        // Also show a toast notification (this happens in ImportContext.jsx when catching the error)
        throw new Error(errorMessage);
    }

    const courseColor = await getNextCourseColor();

    // Create the course record first
    const courseRecord = await createRecord('courses', {
        name: courseName,
        level: level,
        groupId: groupRecord.id,
        startDate: '',
        endDate: '',
        sessionIds: [],
        studentIds: [],
        teacherIds: [],
        status: 'ongoing'
    });

    const updatedGroupCourseIds = [...(groupRecord.courseIds || []), courseRecord.id];
    await updateRecord('groups', groupRecord.id, {
        courseIds: updatedGroupCourseIds
    });

    // Now create/update student records with the course ID available
    for (const studentInfo of studentNames) {
        // Create student record in Firebase now that we have courseRecord.id and groupId
        const studentRecord = await createOrUpdateStudentRecord(studentInfo.name, '', courseRecord.id, groupRecord.id);
        students.push({
            id: studentRecord.id,
            name: studentRecord.name,
            columnIndex: studentInfo.columnIndex
        });
    }

    // Update the course with the student IDs
    await updateRecord('courses', courseRecord.id, {
        studentIds: students.map(s => s.id)
    });

    // Process sessions - start from the row after the header
    const sessions = [];
    let currentSessionTitle = null;
    let currentSession = null;
    let teacherIds = new Set();
    let monthIds = new Set();
    let firstSessionDate = null;
    let lastSessionDate = null;
    let lastKnownDate = null;

    // Get current date for comparison with session dates
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1; // JavaScript months are 0-indexed
    const currentYear = currentDate.getFullYear();

    for (let i = headerRowIndex + 1; i < jsonData.length; i++) {
        const row = jsonData[i];

        // Skip empty rows
        if (!row || row.length === 0 || (row.length === 1 && !row[0])) {
            continue;
        }

        // Extract values using our column mapping
        const getValue = (index) => index !== -1 && index < row.length ? row[index] : null;

        const folienTitle = getValue(columnIndices.folien);
        const contentValue = getValue(columnIndices.inhalt);
        const notesValue = getValue(columnIndices.notizen);
        const checkedValue = getValue(columnIndices.checked);
        const completedValue = getValue(columnIndices.gemacht);
        const dateValue = getValue(columnIndices.date);
        const startTimeValue = getValue(columnIndices.startTime);
        const endTimeValue = getValue(columnIndices.endTime);
        const teacherValue = getValue(columnIndices.teacher);
        const messageValue = getValue(columnIndices.message);

        // If we have a value in column A (Folien), this could be a new session
        // If we have a value in folien column, this could be a new session
        if (folienTitle && folienTitle.toString().trim() !== '') {
            // If it's a new session title or different from current one, start a new session
            if (folienTitle !== currentSessionTitle) {
                // Save previous session if we have one
                if (currentSession) {
                    if (isFirstSession && currentSession.startTime && currentSession.endTime) {
                        // Check if it's a long session using the utility function
                        currentSession.isLongSession = isLongSession(currentSession.startTime, currentSession.endTime);
                        isFirstSession = false;
                    }
                    const sessionRecord = await createRecord('sessions', currentSession);

                    // Add to course's sessionIds
                    courseRecord.sessionIds.push(sessionRecord.id);

                    // After creating a session record, update the month's statistics
                    if (currentSession.monthId) {
                        const monthRef = ref(database, `months/${currentSession.monthId}`);
                        const monthSnapshot = await get(monthRef);

                        if (monthSnapshot.exists()) {
                            const monthData = monthSnapshot.val();

                            // Initialize courseIds array if it doesn't exist
                            if (!monthData.courseIds) {
                                monthData.courseIds = [];
                            }

                            // Update month course IDs if not already there
                            if (!monthData.courseIds.includes(courseRecord.id)) {
                                monthData.courseIds.push(courseRecord.id);
                            }

                            // Increment session count
                            monthData.sessionCount = (monthData.sessionCount || 0) + 1;

                            // Update the month record
                            await update(monthRef, {
                                courseIds: monthData.courseIds,
                                sessionCount: monthData.sessionCount
                            });
                        }
                    }

                    sessions.push(sessionRecord);
                }

                // Format date and times
                let formattedDate = '';
                let isOngoingSession = false;
                const dateValue = getValue(columnIndices.date);

                if (dateValue) {
                    if (typeof dateValue === 'string' && dateValue.includes('.')) {
                        // Handle string dates in DD.MM.YYYY format
                        formattedDate = dateValue;
                    } else if (typeof dateValue === 'number') {
                        // Handle Excel serial date
                        const jsDate = excelDateToJSDate(dateValue);
                        if (jsDate) {
                            const day = jsDate.getDate().toString().padStart(2, '0');
                            const month = (jsDate.getMonth() + 1).toString().padStart(2, '0');
                            const year = jsDate.getFullYear();
                            formattedDate = `${day}.${month}.${year}`;
                        }
                    }

                    // Get or create month record first
                    let monthId = null;
                    if (formattedDate) {
                        try {
                            const monthRecord = await getOrCreateMonthRecord(formattedDate);
                            if (monthRecord) {
                                monthId = monthRecord.id;
                                monthIds.add(monthId);
                            }
                        } catch (error) {
                            console.error(`Error getting/creating month record for date ${formattedDate}:`, error);
                        }
                    }
                }

                // Only mark as ongoing if the date is in the current month or future
                if (formattedDate) {
                    const [day, month, year] = formattedDate.split('.').map(Number);
                    const sessionDate = new Date(year, month - 1, day);
                    const today = new Date();

                    // Set to beginning of the day for accurate comparison
                    today.setHours(0, 0, 0, 0);

                    // Only ongoing if it's today or in the future
                    isOngoingSession = sessionDate >= today;
                }

                // Format times
                let formattedStartTime = formatTime(startTimeValue);
                let formattedEndTime = formatTime(endTimeValue);

                // Create or get teacher record
                let teacherId = '';
                if (teacherValue) {
                    const teacherRecord = await createTeacherRecord(teacherValue);
                    teacherId = teacherRecord.id;
                    teacherIds.add(teacherRecord.id);

                    // If this is the first teacher we've found, set it as the course's teacher
                    if (!courseRecord.teacherId) {
                        courseRecord.teacherId = teacherId;
                    }
                }

                // Get or create month record
                let monthId = null;
                if (formattedDate) {
                    try {
                        const monthRecord = await getOrCreateMonthRecord(formattedDate);
                        if (monthRecord) {
                            monthId = monthRecord.id;
                            // Track the month in our set of months used in this course
                            monthIds.add(monthId);
                        }
                    } catch (error) {
                        console.error(`Error associating session with month for date ${formattedDate}:`, error);
                    }
                }

                // Create new session object
                currentSessionTitle = folienTitle;
                let isFutureDate = false;

                if (dateValue) {
                    // Format date normally first
                    if (typeof dateValue === 'string' && dateValue.includes('.')) {
                        // Handle string dates in DD.MM.YYYY format
                        formattedDate = dateValue;
                    } else if (typeof dateValue === 'number') {
                        // Handle Excel serial date
                        const jsDate = excelDateToJSDate(dateValue);
                        if (jsDate) {
                            const day = jsDate.getDate().toString().padStart(2, '0');
                            const month = (jsDate.getMonth() + 1).toString().padStart(2, '0');
                            const year = jsDate.getFullYear();
                            formattedDate = `${day}.${month}.${year}`;
                        }
                    }

                    // Check if date is in the future
                    if (formattedDate) {
                        const [day, month, year] = formattedDate.split('.').map(Number);
                        const sessionDate = new Date(year, month - 1, day);
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);

                        isFutureDate = sessionDate > today;
                    }
                }


                currentSession = {
                    courseId: courseRecord.id,
                    title: folienTitle,
                    content: contentValue || '',
                    notes: notesValue || '',
                    date: isFutureDate ? '' : (formattedDate || ''), // Leave date empty if future date
                    startTime: columnIndices.startTime !== -1 ? (isFutureDate ? '' : formatTime(startTimeValue)) : '',
                    endTime: columnIndices.endTime !== -1 ? (isFutureDate ? '' : formatTime(endTimeValue)) : '',
                    teacherId: teacherId || '',
                    contentItems: [],
                    attendance: {},
                    monthId: isFutureDate ? null : monthId, // Don't associate with a month if future date
                    sessionOrder: sessionOrderCounter++,
                    status: (() => {
                        if (!formattedDate) return 'ongoing';

                        const [day, month, year] = formattedDate.split('.').map(Number);
                        // Create date objects with consistent timezone handling
                        const sessionDate = new Date(Date.UTC(year, month - 1, day));
                        const today = new Date();
                        // Convert today to UTC midnight
                        const todayUTC = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));

                        return sessionDate >= todayUTC ? 'ongoing' : 'completed';
                    })()
                };

                // Update lastKnownDate if we have a valid date
                if (formattedDate) {
                    lastKnownDate = formattedDate;

                    // Update first/last session dates for the course
                    if (!firstSessionDate || formattedDate < firstSessionDate) {
                        firstSessionDate = formattedDate;
                    }
                    if (!lastSessionDate || formattedDate > lastSessionDate) {
                        lastSessionDate = formattedDate;
                    }
                }
            }
            // If it's the same title but a new row with content, we might need to update the current session
            else if (contentValue && contentValue.trim() !== '') {
                // Update current session with new content
                if (!currentSession.contentItems) {
                    currentSession.contentItems = [];
                }
                currentSession.contentItems.push({
                    content: contentValue,
                    notes: notesValue || '',
                });
            }
        } else if (currentSession && contentValue) {
            // This is additional content for the current session
            currentSession.contentItems.push({
                content: contentValue,
                notes: notesValue || '',
            });
        }

        // Process attendance for this row if we have a current session
        if (currentSession && students.length > 0) {
            // Get the Excel row for color information
            const excelRow = excelWorksheet.getRow(i + 1); // +1 because ExcelJS is 1-based

            for (const student of students) {
                const columnIndex = student.columnIndex;
                const cellValue = row[columnIndex];
                const excelCell = excelRow.getCell(columnIndex + 1); // +1 because ExcelJS is 1-based

                if (cellValue !== undefined && cellValue !== null || excelCell.fill) {
                    let attendanceValue = 'unknown';
                    let comment = '';

                    // Try to get cell comment if any
                    if (excelCell.note) {
                        comment = excelCell.note.texts.map(t => t.text).join('');
                    } else if (typeof cellValue === 'string' && cellValue.trim() !== '') {
                        comment = cellValue;
                    }

                    // Color-based detection
                    if (excelCell.fill && excelCell.fill.type === 'pattern' && excelCell.fill.fgColor) {
                        const color = excelCell.fill.fgColor.argb || '';

                        // Green -> present, Red/Pink -> absent
                        if (isGreenColor(color)) {
                            attendanceValue = 'present';
                        }
                        else if (isRedColor(color)) {
                            attendanceValue = 'absent';
                        }
                    }

                    // If we couldn't determine from color, try text values
                    if (attendanceValue === 'unknown' && cellValue) {
                        const cellText = cellValue.toString().toLowerCase();
                        if (cellText === 'true' || cellText === 'anwesend' || cellText === 'present') {
                            attendanceValue = 'present';
                        } else if (cellText === 'false' || cellText === 'abwesend' || cellText === 'absent') {
                            attendanceValue = 'absent';
                        } else if (cellText.includes('krank') || cellText.includes('sick')) {
                            attendanceValue = 'sick';
                        } else if (cellText.includes('kamera aus') || cellText.includes('mic aus')) {
                            attendanceValue = 'technical_issues';
                        }
                    }

                    // Non-empty cell means student has joined by this session date
                    if (attendanceValue !== 'unknown' || comment) {
                        // Record attendance with comment
                        currentSession.attendance[student.id] = {
                            status: attendanceValue,
                            comment: comment || ''
                        };

                        // Mark this session's date as the student's join date if we haven't recorded one yet
                        // or if this date is earlier than the previously recorded one
                        if (currentSession.date) {
                            // Update student join date if this is the first record of them in this course
                            await get(ref(database, `students/${student.id}`)).then(snapshot => {
                                if (snapshot.exists()) {
                                    const studentData = snapshot.val();
                                    const joinDates = studentData.joinDates || {};

                                    // If no join date for this course yet, or if this date is earlier
                                    if (!joinDates[courseRecord.id] ||
                                        parseDate(currentSession.date) < parseDate(joinDates[courseRecord.id])) {
                                        joinDates[courseRecord.id] = currentSession.date;
                                        update(ref(database, `students/${student.id}`), { joinDates });
                                    }
                                }
                            });
                        }
                    }
                }
            }
        }
    }

    // Add the last session if we have one
    if (currentSession) {
        const sessionRecord = await createRecord('sessions', currentSession);
        courseRecord.sessionIds.push(sessionRecord.id);

        // After creating a session record, update the month's statistics
        if (currentSession.monthId) { // This will be null for future dates
            const monthRef = ref(database, `months/${currentSession.monthId}`);
            const monthSnapshot = await get(monthRef);

            if (monthSnapshot.exists()) {
                const monthData = monthSnapshot.val();

                // Initialize courseIds array if it doesn't exist
                if (!monthData.courseIds) {
                    monthData.courseIds = [];
                }

                // Update month course IDs if not already there
                if (!monthData.courseIds.includes(courseRecord.id)) {
                    monthData.courseIds.push(courseRecord.id);
                }

                // Increment session count
                monthData.sessionCount = (monthData.sessionCount || 0) + 1;

                // Update the month record
                await update(monthRef, {
                    courseIds: monthData.courseIds,
                    sessionCount: monthData.sessionCount
                });
            }
        }

        sessions.push(sessionRecord);
    }
    // Determine course status based on ANY ongoing sessions
    let courseStatus = 'ongoing';

    // If there are ANY sessions with status 'ongoing', the course should be ongoing
    const hasAnyOngoingSessions = sessions.some(session =>
        session.status === 'ongoing'
    );

    if (hasAnyOngoingSessions) {
        courseStatus = 'ongoing';
    } else {
        // Only if ALL sessions are completed, mark the course as completed
        const allSessionsCompleted = sessions.every(session =>
            session.status === 'completed'
        );

        if (allSessionsCompleted && sessions.length > 0) {
            courseStatus = 'completed';
        }
    }

    // Empty date fallback - if no sessions or no valid dates, course is ongoing
    if (sessions.length === 0 || !lastSessionDate) {
        courseStatus = 'ongoing';
    }

    // Update course with session dates and teacher
    await updateRecord('courses', courseRecord.id, {
        startDate: firstSessionDate || '',
        endDate: lastSessionDate || '',
        sessionIds: courseRecord.sessionIds,
        teacherIds: Array.from(teacherIds),
        status: courseStatus
    });

    // Update teacher records with this course
    for (const teacherId of teacherIds) {
        const teacher = await getRecordById('teachers', teacherId);
        if (teacher) {
            const courseIds = teacher.courseIds || [];
            if (!courseIds.includes(courseRecord.id)) {
                courseIds.push(courseRecord.id);
                await updateRecord('teachers', teacherId, { courseIds });
            }
        }
    }

    // Update month records with teachers
    for (const monthId of monthIds) {
        const monthRecord = await getRecordById('months', monthId);
        if (monthRecord) {
            const teacherIdsArray = Array.from(teacherIds);
            const updatedTeacherIds = [...new Set([...(monthRecord.teacherIds || []), ...teacherIdsArray])];
            await updateRecord('months', monthId, {
                teacherIds: updatedTeacherIds
            });
        }
    }

    return {
        ...courseRecord,
        sessionCount: sessions.length
    };
};
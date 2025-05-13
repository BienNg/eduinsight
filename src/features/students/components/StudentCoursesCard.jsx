// src/features/students/components/StudentCoursesCard.jsx
import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBrain, faHistory } from '@fortawesome/free-solid-svg-icons';
import { safelyRenderValue } from '../utils/studentDataUtils';
import { updateRecord, getRecordById } from '../../firebase/database';
import { generateFeedbackFromComments } from '../../utils/openaiUtils';
import './StudentCoursesCard.css';

const StudentCoursesCard = ({ student, sessions, courses }) => {
    // Group sessions by courseId
    const sessionsByCourse = {};
    const [feedbacks, setFeedbacks] = useState({});
    const [isGenerating, setIsGenerating] = useState({});
    const [studentData, setStudentData] = useState(student);
    const [addressForm, setAddressForm] = useState('em'); // Default to 'em'
    const addressOptions = [
        { value: 'em', label: 'Em' },
        { value: 'anh', label: 'Anh' },
        { value: 'chị', label: 'Chị' },
        { value: 'co', label: 'Co' },
        { value: 'chú', label: 'Chú' }
    ];

    // Fetch the latest student data to ensure we have current feedback
    const refreshStudentData = async () => {
        try {
            const freshStudentData = await getRecordById('students', student.id);
            if (freshStudentData) {
                setStudentData(freshStudentData);
                // Update feedbacks state from the latest database data
                setFeedbacks(freshStudentData.feedback || {});
            }
        } catch (error) {
            console.error("Error fetching student data:", error);
        }
    };

    useEffect(() => {
        // Initial fetch of student data to get feedback
        refreshStudentData();
    }, [student.id]);

    if (sessions && sessions.length > 0) {
        sessions.forEach(session => {
            if (session.courseId) {
                if (!sessionsByCourse[session.courseId]) {
                    sessionsByCourse[session.courseId] = [];
                }
                sessionsByCourse[session.courseId].push(session);
            }
        });
    }

    // Get student's courses
    const studentCourses = courses.filter(course =>
        student.courseIds && student.courseIds.includes(course.id)
    );

    // Get attendance status and comment for this student in a session
    const getAttendanceInfo = (session) => {
        if (!session.attendance || !session.attendance[student.id]) {
            return { status: 'unknown', comment: '' };
        }

        const attendanceData = session.attendance[student.id];
        if (typeof attendanceData === 'object') {
            return {
                status: attendanceData.status || 'unknown',
                comment: attendanceData.comment || ''
            };
        }

        return { status: attendanceData, comment: '' };
    };

    // Generate feedback for a course using OpenAI API
    const handleGenerateFeedback = async (courseId) => {
        setIsGenerating(prev => ({ ...prev, [courseId]: true }));
        try {
            const course = courses.find(c => c.id === courseId);

            // Get teacher names for this course
            let teacherNames = "Không rõ giáo viên"; // "Unknown teacher" in Vietnamese
            if (course && course.teacherIds && course.teacherIds.length > 0) {
                const teacherPromises = course.teacherIds.map(id => getRecordById('teachers', id));
                const teachers = await Promise.all(teacherPromises);
                teacherNames = teachers.filter(Boolean).map(t => t.name).join(', ');
            }

            // Collect all comments from sessions for this course
            const courseSessionComments = [];
            if (sessionsByCourse[courseId]) {
                sessionsByCourse[courseId].forEach(session => {
                    const { comment } = getAttendanceInfo(session);
                    if (comment && comment.trim()) {
                        courseSessionComments.push(`${session.date || 'Không rõ ngày'} - ${session.title || 'Buổi học không tên'}: ${comment}`);
                    }
                });
            }

            // Find previous feedback from other courses
            const previousFeedback = [];
            if (studentData.feedback) {
                // Filter out the current course
                Object.entries(studentData.feedback).forEach(([feedbackCourseId, feedbackText]) => {
                    if (feedbackCourseId !== courseId && feedbackText.trim()) {
                        // Find course name for this feedback
                        const feedbackCourse = courses.find(c => c.id === feedbackCourseId);
                        const courseName = feedbackCourse ? feedbackCourse.name : 'Khóa học khác';

                        previousFeedback.push({
                            courseName,
                            feedbackText,
                            courseId: feedbackCourseId
                        });
                    }
                });
            }

            // Sort previous feedback by course ID (assuming newer courses have higher IDs)
            // This is a simple way to get the most recent feedback first
            previousFeedback.sort((a, b) => b.courseId.localeCompare(a.courseId));

            // Take only the most recent feedback for context (to avoid overwhelming the API)
            const recentPreviousFeedback = previousFeedback.length > 0 ? previousFeedback[0] : null;

            // Generate feedback using OpenAI with both current session data and previous feedback
            const feedbackText = await generateFeedbackFromComments(
                student.name,
                course ? course.name : 'khóa học này',
                teacherNames,
                courseSessionComments,
                addressForm,
                recentPreviousFeedback, // Add the previous feedback as a new parameter
                "gpt-4o-mini"
            );

            // Create new feedbacks object by copying the existing feedback from the database
            const newFeedbacks = {
                ...(studentData.feedback || {}),
                [courseId]: feedbackText
            };

            // Update database first
            await updateRecord('students', student.id, {
                feedback: newFeedbacks
            });

            // Then refresh student data from database to get the latest state
            await refreshStudentData();

        } catch (error) {
            console.error("Error generating feedback:", error);
        } finally {
            setIsGenerating(prev => ({ ...prev, [courseId]: false }));
        }
    };

    // Handle changes to the feedback text
    const handleFeedbackChange = async (courseId, value) => {
        try {
            // Update directly in the database
            const newFeedbacks = {
                ...(studentData.feedback || {}),
                [courseId]: value
            };

            await updateRecord('students', student.id, {
                feedback: newFeedbacks
            });

            // Refresh from database to ensure we display what's in the database
            await refreshStudentData();
        } catch (error) {
            console.error("Error updating feedback:", error);
        }
    };

    return (
        <div className="overview-panel">
            <div className="panel-header">
                <h3 className="panel-title">Course Sessions</h3>
            </div>
            <div className="panel-content">
                <div className="course-sessions-grid">
                    {studentCourses.length > 0 ? (
                        studentCourses.map(course => (
                            <div className="course-sessions-container">
                                <div className="course-sessions-column">
                                    <h4 className="course-name">{safelyRenderValue(course.name)}</h4>

                                    {sessionsByCourse[course.id] && sessionsByCourse[course.id].length > 0 ? (
                                        <div className="sessions-table-container">
                                            <table className="sessions-table">
                                                <thead>
                                                    <tr>
                                                        <th>Session Name</th>
                                                        <th>Date</th>
                                                        <th>Status</th>
                                                        <th>Comment</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {sessionsByCourse[course.id].map(session => {
                                                        const { status, comment } = getAttendanceInfo(session);
                                                        return (
                                                            <tr key={session.id}>
                                                                <td>{safelyRenderValue(session.title)}</td>
                                                                <td>{safelyRenderValue(session.date)}</td>
                                                                <td className={`status-${status}`}>
                                                                    {status}
                                                                </td>
                                                                <td>{comment}</td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <div className="empty-message">No sessions found for this course.</div>
                                    )}
                                </div>

                                <div className="course-notes-column">
                                    <div className="feedback-header">
                                        <div className="address-form-selector">
                                            <select
                                                value={addressForm}
                                                onChange={(e) => setAddressForm(e.target.value)}
                                                className="address-form-select"
                                            >
                                                {addressOptions.map(option => (
                                                    <option key={option.value} value={option.value}>
                                                        {option.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <button
                                            className="generate-feedback-btn"
                                            onClick={() => handleGenerateFeedback(course.id)}
                                            disabled={isGenerating[course.id]}
                                        >
                                            <FontAwesomeIcon icon={faBrain} />
                                            {isGenerating[course.id] ? 'Đang tạo...' : 'Tạo tin nhắn phản hồi'}
                                        </button>
                                    </div>
                                    <textarea
                                        className="course-notes-textarea"
                                        placeholder="Add your notes about the student's progress in this course..."
                                        value={(studentData.feedback && studentData.feedback[course.id]) || ''}
                                        onChange={(e) => handleFeedbackChange(course.id, e.target.value)}
                                    />
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="empty-message">No courses found for this student.</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StudentCoursesCard;
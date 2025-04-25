import { getRecordById, deleteRecord, updateRecord, getAllRecords } from '../firebase/database';

export const handleDeleteCourse = async (courseId, courseName, setDeletingCourseId, setCourses, setError, event) => {
    if (event) event.stopPropagation();

    const confirmDelete = window.confirm(
        `Sind Sie sicher, dass Sie "${courseName}" löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.`
    );

    if (!confirmDelete) return;

    try {
        setDeletingCourseId && setDeletingCourseId(courseId);

        const course = await getRecordById('courses', courseId);

        if (course) {
            const affectedStudentIds = [...(course.studentIds || [])];
            const affectedTeacherIds = course.teacherId ? [course.teacherId] : [];
            const affectedMonthIds = new Set();

            // Delete related sessions and collect affected months
            if (course.sessionIds && course.sessionIds.length > 0) {
                for (const sessionId of course.sessionIds) {
                    const session = await getRecordById('sessions', sessionId);
                    if (session && session.monthId) {
                        affectedMonthIds.add(session.monthId);
                    }
                    await deleteRecord('sessions', sessionId);
                }
            }

            // Remove course from student records and check for cleanup
            if (affectedStudentIds.length > 0) {
                for (const studentId of affectedStudentIds) {
                    const student = await getRecordById('students', studentId);
                    if (student && student.courseIds) {
                        const updatedCourseIds = student.courseIds.filter(id => id !== courseId);

                        if (updatedCourseIds.length === 0) {
                            await deleteRecord('students', studentId);
                        } else {
                            await updateRecord('students', studentId, { courseIds: updatedCourseIds });
                        }
                    }
                }
            }

            // Remove course from teacher record and check for cleanup
            if (affectedTeacherIds.length > 0) {
                for (const teacherId of affectedTeacherIds) {
                    const teacher = await getRecordById('teachers', teacherId);
                    if (teacher && teacher.courseIds) {
                        const updatedCourseIds = teacher.courseIds.filter(id => id !== courseId);

                        if (updatedCourseIds.length === 0) {
                            await deleteRecord('teachers', teacherId);
                        } else {
                            await updateRecord('teachers', teacherId, { courseIds: updatedCourseIds });
                        }
                    }
                }
            }

            // Clean up affected months
            if (affectedMonthIds.size > 0) {
                for (const monthId of affectedMonthIds) {
                    const month = await getRecordById('months', monthId);
                    if (month) {
                        const updatedCourseIds = month.courseIds
                            ? month.courseIds.filter(id => id !== courseId)
                            : [];

                        const remainingSessions = await getAllRecords('sessions');
                        const remainingSessionCount = remainingSessions.filter(
                            session => session.monthId === monthId
                        ).length;

                        if (updatedCourseIds.length === 0 && remainingSessionCount === 0) {
                            await deleteRecord('months', monthId);
                        } else {
                            const updatedMonth = {
                                courseIds: updatedCourseIds,
                                sessionCount: remainingSessionCount,
                            };
                            await updateRecord('months', monthId, updatedMonth);
                        }
                    }
                }
            }

            // Delete the course itself
            await deleteRecord('courses', courseId);

            // Update the courses list if provided
            setCourses && setCourses(prevCourses => prevCourses.filter(course => course.id !== courseId));
        }
    } catch (err) {
        setError && setError(`Failed to delete course: ${err.message}`);
        console.error("Error deleting course:", err);
    } finally {
        setDeletingCourseId && setDeletingCourseId(null);
    }
};
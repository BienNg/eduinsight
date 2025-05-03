// src/features/database/components/TabsContainer.jsx
import React, { useState } from 'react';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import CoursesTab from '../tabs/CoursesTab';
import GroupsTab from '../tabs/GroupsTab';
import MonthsTab from '../tabs/MonthsTab';
import SessionsTab from '../tabs/SessionsTab';
import TeachersTab from '../tabs/TeachersTab';
import StudentsTab from '../tabs/StudentsTab';
import '../../styles/MonthTabs.css';

const TabsContainer = ({ data }) => {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const { courses, groups, months, sessions, teachers, students } = data;

    return (
        <Tabs
            selectedIndex={selectedIndex}
            onSelect={(index) => setSelectedIndex(index)}
            className="month-tabs"
        >
            <TabList className="month-tab-list">
                <Tab className={`month-tab ${selectedIndex === 0 ? 'active' : ''}`}>
                    Courses ({courses.length})
                </Tab>
                <Tab className={`month-tab ${selectedIndex === 1 ? 'active' : ''}`}>
                    Groups ({groups.length})
                </Tab>
                <Tab className={`month-tab ${selectedIndex === 2 ? 'active' : ''}`}>
                    Months ({months.length})
                </Tab>
                <Tab className={`month-tab ${selectedIndex === 3 ? 'active' : ''}`}>
                    Sessions ({sessions.length})
                </Tab>
                <Tab className={`month-tab ${selectedIndex === 4 ? 'active' : ''}`}>
                    Teachers ({teachers.length})
                </Tab>
                <Tab className={`month-tab ${selectedIndex === 5 ? 'active' : ''}`}>
                    Students ({students.length})
                </Tab>
            </TabList>

            <TabPanel className="month-tab-panel">
                <CoursesTab courses={courses} />
            </TabPanel>

            <TabPanel className="month-tab-panel">
                <GroupsTab groups={groups} />
            </TabPanel>

            <TabPanel className="month-tab-panel">
                <MonthsTab months={months} />
            </TabPanel>

            <TabPanel className="month-tab-panel">
                <SessionsTab
                    sessions={sessions}
                    teachers={teachers}
                    courses={courses}
                    months={months}
                />
            </TabPanel>

            <TabPanel className="month-tab-panel">
                <TeachersTab teachers={teachers} />
            </TabPanel>

            <TabPanel className="month-tab-panel">
                <StudentsTab students={students} courses={courses} />
            </TabPanel>
        </Tabs>
    );
};

export default TabsContainer;
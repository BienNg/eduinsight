// src/features/dashboard/LehrerContent.jsx
import { useState } from 'react';
import '../styles/Content.css';
import { useNavigate } from 'react-router-dom';
import TabComponent from '../common/TabComponent';
import TeacherOverview from './tabs/TeacherOverviewTab';
import TeacherList from './tabs/TeacherListTab';

const LehrerContent = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  const handleViewDetails = (teacherId) => {
    navigate(`/teachers/${teacherId}`);
  };

  // Define the tabs
  const tabs = [
    { id: 'overview', label: 'Übersicht' },
    { id: 'allTeachers', label: 'Alle Lehrer' }
  ];

  return (
    <div className="lehrer-content">
      <TabComponent 
        tabs={tabs} 
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
      >
        {activeTab === 'overview' && <TeacherOverview />}
        {activeTab === 'allTeachers' && <TeacherList />}
      </TabComponent>
    </div>
  );
};

export default LehrerContent;
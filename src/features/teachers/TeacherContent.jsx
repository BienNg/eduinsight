// src/features/dashboard/LehrerContent.jsx (completely simplified)
import '../styles/Content.css';
import { useNavigate } from 'react-router-dom';
import TeacherOverview from './tabs/TeacherOverviewTab';

const LehrerContent = () => {
  const navigate = useNavigate();

  const handleViewDetails = (teacherId) => {
    navigate(`/teachers/${teacherId}`);
  };

  return (
    <div className="lehrer-content">
      <TeacherOverview />
    </div>
  );
};

export default LehrerContent;
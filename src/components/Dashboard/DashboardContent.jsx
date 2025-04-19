// src/components/Dashboard/DashboardContent.jsx
import './Content.css';

const DashboardContent = () => {
  return (
    <div className="dashboard-content">
      <h2>Lehrer Dashboard</h2>
      <div className="stats-container">
        <div className="stat-card">
          <h3>Aktive Klassen</h3>
          <div className="stat-value">12</div>
        </div>
        <div className="stat-card">
          <h3>Schüler insgesamt</h3>
          <div className="stat-value">156</div>
        </div>
        <div className="stat-card">
          <h3>Durchschnittliche Anwesenheit</h3>
          <div className="stat-value">87%</div>
        </div>
      </div>
    </div>
  );
};

export default DashboardContent;
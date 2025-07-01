// src/features/database/DatabaseView.jsx
import React from 'react';
import useDataFetching from './hooks/useDataFetching';
import TabsContainer from './components/TabsContainer';
import LoadingIndicator from './components/common/LoadingIndicator';
import ErrorMessage from './components/common/ErrorMessage';
import '../styles/Content.css';

const DatabaseView = () => {
  const { data, loading, error, refreshTeachers } = useDataFetching();

  if (loading) {
    return <LoadingIndicator />;
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  return (
    <div className="database-content">
      <h2>Database Overview</h2>
      <TabsContainer data={data} refreshTeachers={refreshTeachers} />
    </div>
  );
};

export default DatabaseView;
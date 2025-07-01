  return (
    <div className="activity-feed">
      {/* Remove the active users section */}
      {/* <div className="active-users">
        <span>{stats.activeUsers} users active now</span>
        <span>Join thousands importing their data</span>
      </div> */}
      <h2>Live Activity</h2>
      <ul>
        {processingQueue.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
    </div>
  ); 
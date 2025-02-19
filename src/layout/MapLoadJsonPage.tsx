import React, { useState, Suspense } from 'react';
import { MapFileState } from '../types';

const loadData = async () => {
  const { default: data } = await import('../data/maps/Ceremony.json');
  return data;
};

function MyComponent() {
  const [data, setData] = useState<MapFileState>(null!);
  const [loading, setLoading] = useState(false);

  const handleLoadData = async () => {
    setLoading(true);
    const loadedData = await loadData();
    setData(loadedData);
    setLoading(false);
  };

  return (
    <div>
      <button onClick={handleLoadData} disabled={loading || data !== null}>
        {loading ? 'Loading...' : 'Load Data'}
      </button>
      {data && (
        <Suspense fallback={<div>Loading Content...</div>}>
          <DataDisplay data={data} />
        </Suspense>
      )}
    </div>
  );
}


function DataDisplay({ data }) {
  return (
    <ul>
      {data.map((item, index) => (
        <li key={index}>{item.name}</li>
      ))}
    </ul>
  );
}

export default MyComponent;
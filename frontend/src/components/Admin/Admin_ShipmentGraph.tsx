import React from 'react';

const Admin_ShipmentGraph: React.FC = () => {
  const data = {
    labels: ['2025-04-01', '2025-04-02', '2025-04-03'], // Example shipment dates
    datasets: [
      {
        label: 'Shipments Processed',
        data: [50, 75, 100], // Example shipment progress percentages
        fill: false,
        borderColor: 'rgba(75,192,192,1)',
        tension: 0.1,
      },
    ],
  };

  return (
    <div>
     
    </div>
  );
};

export default Admin_ShipmentGraph;

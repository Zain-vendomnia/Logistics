import React from 'react';

import Admin_VehicleMap from './Admin_VehicleMap';
import Admin_ShipmentGraph from './Admin_ShipmentGraph';
import Card from './Card';
import '../Admin/css/Admin_dashboard.css';

const Admin_dashboard: React.FC = () => {
  return (
    <div className="dashboard">
      <h1>Admin Dashboard</h1>
      <div className="card-container">
        <Card
          title="Vehicles On the Roads"
          description="Vehicles On the Roads."
         // icon={require('../../../src/assets/images/truck.jpg')}  
          bgColor="#e76f51"
          width="300px"  
          height="200px" 
        />
        <Card
          title="Total Orders"
          description="Manage Orders"
         // icon={require('../../../src/assets/images/vehicle-icon.png')}
          bgColor="#f4a261"
          width="300px"  // Set custom width
          height="200px" // Set custom height
        />
        <Card
          title="Delivery Status"
          description="Delivery status."
          icon={require('../../../src/assets/images/truck.jpg')}
          bgColor="#2a9d8f"
          width="300px"  // Set custom width
          height="200px" // Set custom height
        />
      </div>
    </div>
  );
};


export default Admin_dashboard;

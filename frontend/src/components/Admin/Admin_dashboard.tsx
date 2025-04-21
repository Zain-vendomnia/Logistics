import React from 'react';
import Admin_VehicleMap from './Admin_VehicleMap';
import Admin_ShipmentGraph from './Admin_ShipmentGraph';
import Card from './Card';
import '../Admin/css/Admin_dashboard.css';
import '../Admin/Admin_Shipmenttable';
import Admin_Shipmenttable from '../Admin/Admin_Shipmenttable';

const Admin_dashboard: React.FC = () => {
  return (
    <div className="dashboard">
      <div className="card-container">
        {/* Existing Cards */}
        <Card
          title="Vehicles On the Roads"
          description="Vehicles On the Roads."
          bgColor="#e76f51"
          width="200px"
          height="200px"
        />
        <Card
          title="Total Orders"
          description="Manage Orders"
          bgColor="#f4a261"
          width="200px"
          height="200px"
        />
        <Card
          title="Delivery Status"
          description="Delivery status."
          icon={require('../../../src/assets/images/truck.jpg')}
          bgColor="#2a9d8f"
          width="200px"
          height="200px"
        />
        <Card
          title="Fleet Efficiency"
          description=""
          bgColor="#bb9ec1"
          width="200px"
          height="200px"
        />
      </div>

      {/* New Card for Shipments Overview */}
      <Card
        title="Shipments Overview"
        description="Manage and track shipments."
        bgColor=""
        width="100%"  // Make this card full width
        height="auto" // Let the height adjust automatically
      >
      <Admin_Shipmenttable />
      </Card>
    </div>
  );
};

export default Admin_dashboard;

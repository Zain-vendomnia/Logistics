import React from 'react';
import vehicleIcon from '../../assets/images/truck.jpg'; // Example vehicle icon

const Admin_VehicleMap: React.FC = () => {
  return (
    <div className="vehicle-map-container">
      <img src={vehicleIcon} alt="Vehicle on the road" className="vehicle-icon" />
      <p>Vehicle is on the way to deliver orders.</p>
    </div>
  );
};

export default Admin_VehicleMap;

import React, { useState, useEffect } from "react";
import { getAdminBoard } from "../services/user.service";
import EventBus from "../common/EventBus";
import Admin_MapComponent from "./Admin/Admin_MapComponent";

const BoardAdmin: React.FC = () => {
  return (
    <div className="container">
      <header className="jumbotron">
        <h3>Admin Dashboard</h3>
        <p>Welcome to the Admin Dashboard</p>
          <Admin_MapComponent />
        {/* <GmapRouteComponent/> */}
      </header>
    </div>
  );
};

export default BoardAdmin;






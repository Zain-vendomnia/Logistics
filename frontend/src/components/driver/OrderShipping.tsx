import React, { useState } from "react";
import Card from "@mui/material/Card";
import { GoogleMap, LoadScript } from "@react-google-maps/api";

const OrderShipping = () => {
  const [isTripStarted, setTripStarted] = useState(false);

  

  const containerStyle = {
    width: "100%",
    height: "100%",
    borderRadius: "8px",
  };

  const center = {
    lat: -3.745,
    lng: -38.523,
  };

  return (
    <div className="d-flex " style={{ height: "100vh" }}>
      <Card
        sx={{
          minWidth: 160,
          maxWidth: "25%",
          height: "70vh",
          p: "20px",
          borderRadius: "8px",
        }}
        variant="outlined"
      >
        <div className="d-flex flex-column">
          <h3>Customer Details</h3>
          <h6>Customer Name</h6>
          <div className="mt-4">
            <p>Contact: +00 1234 5678</p>
            <p>Address: Around Dubai</p>
          </div>
        </div>
        <div className="mt-auto">
           
        </div>
      </Card>

      <div
        className={"flex-1, mx-3"}
        style={{ width: "75%", height: "70vh", borderRadius: "8px" }}
      >
        <p style={{ position: "absolute", zIndex: 9999, padding: "50px" }}>
          {" "}
          Order Shipping Module{" "}
        </p>
        <LoadScript googleMapsApiKey="YOUR_GOOGLE_MAPS_API_KEY">
          <GoogleMap
            mapContainerStyle={containerStyle}
            center={center}
            zoom={10}
          >
            {/* Child components, such as markers, info windows, etc. */}
          </GoogleMap>
        </LoadScript>
      </div>
    </div>
  );
};

export default OrderShipping;

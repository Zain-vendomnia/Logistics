import { Box, Card, Stack } from "@mui/material";
import { GoogleMap, LoadScript } from "@react-google-maps/api";

const Dashboard = () => {
  const containerStyle = {
    width: "100%",
    height: "100%",
  };

  const center = {
    lat: -3.745,
    lng: -38.523,
  };

  return (
    <Box display={"flex"} width={"100%"} height={"72vh"} mt={1}>
      <Stack direction="row" spacing={1} width={"50%"}>
        {/* 1st Stack */}
        <Stack
          spacing={1}
          width={"50%"}          
          p={"20px"}
          border="0.5px solid #e0e0e0"
          borderRadius={"8px"}
        >
          <Card
            variant="outlined"
            sx={{
              height: 200,
              p: "20px",
              border: "2px solid #f7941d",
              borderRadius: "10px",
            }}
          >
            <div className="d-flex flex-column">
              <h3>Order Details</h3>
              <h6>Order ID: 123456</h6>
              <div className="mt-4">
                <p>Order Date: 12/12/2021</p>
                <p>Order Status: In Progress</p>
              </div>
            </div>
            <div className="mt-auto"></div>
          </Card>
          <Card
            variant="outlined"
            sx={{
              height: 200,
              p: "20px",
              border: "2px solid #f7941d",
              borderRadius: "10px",
            }}
          >
            <div className="d-flex flex-column">
              <h3>Order Details</h3>
              <h6>Order ID: 123456</h6>
              <div className="mt-4">
                <p>Order Date: 12/12/2021</p>
                <p>Order Status: In Progress</p>
              </div>
            </div>
            <div className="mt-auto"></div>
          </Card>
        </Stack>
        {/* 2nd Stack */}
        <Stack
          spacing={1}
          width={"50%"}
          p={"20px"}
          border="0.5px solid #e0e0e0"
          borderRadius={"8px"}
        >
        
          <Card
            variant="outlined"
            sx={{
              height: 200,
              p: "20px",
              border: "2px solid #f7941d",
              borderRadius: "10px",
            }}
          >
            <div className="d-flex flex-column">
              <h3>Order Details</h3>
              <h6>Order ID: 123456</h6>
              <div className="mt-4">
                <p>Order Date: 12/12/2021</p>
                <p>Order Status: In Progress</p>
              </div>
            </div>
            <div className="mt-auto"></div>
          </Card>
        </Stack>
        
      </Stack>

      {/* Google Map */}
      <Box flexGrow={1} width={"50%"} mx={0}>
        <LoadScript googleMapsApiKey="AIzaSyBP2Ij-7iyGs46fzSnRVipyg1_QMaznZJU">
          <GoogleMap
            mapContainerStyle={containerStyle}
            center={center}
            zoom={10}
          >
            {/* Child components, such as markers, info windows, etc. */}
          </GoogleMap>
        </LoadScript>
      </Box>
    </Box>
  );
};

export default Dashboard;

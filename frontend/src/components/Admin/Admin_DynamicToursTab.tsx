import React, { useState } from "react";

import { Box, Tabs, Tab } from "@mui/material";

import FleetPanel from "./FleetPanel";
import DynamicTourList from "./Admin_DynamicTourList";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function a11yProps(index: number) {
  return {
    id: `tours-tab-${index}`,
    "aria-controls": `simple-tabpanel-${index}`,
  };
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <Box
      width="100%"
      role="tabpanel"
      hidden={value !== index}
      id={`tours-tabpanel-${index}`}
      aria-labelledby={`tours-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </Box>
  );
}

const DynamicToursTab = () => {
  const [value, setValue] = useState(0);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  return (
    <Box sx={{ width: "100%" }}>
      <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Tabs
          value={value}
          onChange={handleChange}
          aria-label="basic tabs example"
        >
          <Tab label="Dynamic Tours" {...a11yProps(0)} />
          <Tab label="Fleet Control" {...a11yProps(1)} />
        </Tabs>
      </Box>
      <TabPanel value={value} index={0}>
        <DynamicTourList />
      </TabPanel>
      <TabPanel value={value} index={1}>
        <FleetPanel />
      </TabPanel>
    </Box>
  );
};

export default DynamicToursTab;

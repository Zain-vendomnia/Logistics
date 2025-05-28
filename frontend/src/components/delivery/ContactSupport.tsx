import React from "react";

import { Box, Button, IconButton, Typography } from "@mui/material";
import SupportAgentIcon from "@mui/icons-material/SupportAgent";

const ContactSupport = () => {
  return (
    <Box display='flex' width='100%' height='65px'>
    <Button
      sx={{ display: "flex", bgcolor: "#999", width:'100%' }}
      onClick={() => {
        console.log("Support button hit!");
      }}
    >
      <Typography color={"#fff"} variant="h6">
        Contact Support
      </Typography>
      <IconButton onClick={() => {}} sx={{ ml: "auto", p: 0 }}>
        <SupportAgentIcon />
      </IconButton>
    </Button>
    </Box>
  );
};

export default ContactSupport;

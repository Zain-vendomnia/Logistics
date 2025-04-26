import React, { useState } from "react";
import clsx from "clsx";

import { Box, SwipeableDrawer, Typography, useTheme } from "@mui/material";
import { makeStyles } from "@mui/styles";
import InsertEmoticonIcon from "@mui/icons-material/InsertEmoticon";
import SentimentVeryDissatisfiedIcon from "@mui/icons-material/SentimentVeryDissatisfied";
import SupervisedUserCircleIcon from "@mui/icons-material/SupervisedUserCircle";
import NoAccountsIcon from "@mui/icons-material/NoAccounts";

import { useDeliveryStore } from "../../store/useDeliveryStore";
import { DeliveryScenario } from "../common/delieryScenarios";

const useStyles = makeStyles({
  scenarioBox: {
    cursor: "pointer",
    padding: "16px",
    borderRadius: "8px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    transition: "background-color 0.3s",
  },
  active: {
    backgroundColor: "#000", // Default placeholder, will be overridden dynamically
    color: "#fff",
  },
});

interface Props {
  open: boolean;
  onClose: () => void;
  onOpen?: () => void;
  onScenarioSelected?: (scenario: string) => void;
}

const DeliveryDrawer = ({
  open,
  onClose,
  onOpen,
  onScenarioSelected,
}: Props) => {
  const { deliveryId, setScenario } = useDeliveryStore();

  const theme = useTheme();
  const classes = useStyles();

  const iconSize: number = 64;
  const [activeScenario, setActiveScenario] = useState<string | null>(null);

  const scenarios = [
    {
      label: "Customer Found",
      icon: <InsertEmoticonIcon style={{ fontSize: iconSize }} />,
      color: theme.palette.success.main,
      value: DeliveryScenario.foundCustomer,
    },
    {
      label: "Customer Not Found",
      icon: <NoAccountsIcon style={{ fontSize: iconSize }} />,
      color: theme.palette.info.main,
      value: DeliveryScenario.customerNotFound,
    },
    {
      label: "Neighbor Accepts",
      icon: <SupervisedUserCircleIcon style={{ fontSize: iconSize }} />,
      color: theme.palette.warning.light,
      value: DeliveryScenario.neighborAccepts,
    },
    {
      label: "No Acceptance",
      icon: <SentimentVeryDissatisfiedIcon style={{ fontSize: iconSize }} />,
      color: theme.palette.error.main,
      value: DeliveryScenario.noAcceptance,
    },
  ];

  const handleClick = (scenario: any) => {
    console.log("Delivery Scenario: ", scenario.value);

    setTimeout(() => {
      setScenario(deliveryId, scenario.value);
    }, 500);
    onScenarioSelected?.(scenario.value);
    setActiveScenario(scenario.value);
    onClose();
  };

  return (
    <SwipeableDrawer
      anchor="right"
      open={open}
      onClose={onClose}
      onOpen={onOpen ?? (() => {})}
    >
      <Box width={250}>
        <Box
          display="flex"
          alignItems={"center"}
          justifyContent={"center"}
          height={"50px"}
          mb={3}
          bgcolor={"primary.main"}
        >
          <Typography variant="h5" fontWeight={"bold"} color="#fff">
            Delivery
          </Typography>
        </Box>
        <Box
          display={"flex"}
          flexDirection={"column"}
          alignItems="center"
          gap={2}
        >
          {scenarios.map((s) => (
            <Box
              width={"220px"}
              key={s.label}
              className={clsx(classes.scenarioBox, {
                [classes.active]: activeScenario === s.value,
              })}
              style={
                activeScenario === s.value
                  ? { backgroundColor: s.color, color: "#fff" }
                  : undefined
              }
              onClick={() => handleClick(s)}
            >
              {React.cloneElement(s.icon, {
                htmlColor: activeScenario === s.value ? "#fff" : s.color,
              })}
              <Typography
                variant="h6"
                style={{
                  color: activeScenario === s.value ? "#fff" : undefined,
                }}
              >
                {s.label}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>
    </SwipeableDrawer>
  );
};

export default DeliveryDrawer;

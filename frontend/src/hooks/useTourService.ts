import { useEffect, useRef, useState } from "react";
import { useTheme, Theme } from "@mui/material/styles";
import { SelectChangeEvent } from "@mui/material";

import adminApiService from "../services/adminApiService";
import { CreateTour, Driver, WarehouseDetails, UpdateTourOrders } from "../types/dto.type";
import { getAvailableDrivers } from "../services/driverService";
import useTourStore from "../store/useTourStore";
import {
  NotificationSeverity,
  useNotificationStore,
} from "../store/useNotificationStore";
import { getCurrentUser } from "../services/auth.service";
import { Order } from "../types/order.type";


export const useTourService = () => {
  const { showNotification } = useNotificationStore();
  const {
    toursList,
    setToursList,
    updateToursList,
  } = useTourStore();






}
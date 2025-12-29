import { Request, Response } from "express";
import { ApiResponse } from "../../types/apiResponse.type";
import {
  fetchOrderDetailsAsync,
  fetchOrderHistoryAsync,
} from "../../services/logisticOrder.service";
import { OrderHistory } from "../../types/order.types";

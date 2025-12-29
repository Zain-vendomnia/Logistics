import axios from "axios";
import authHeader from "./auth-header";

const API_URL = "http://localhost:8080/api/admin/cancels";

// ✅ Get all cancel orders (without items) - Fast
export const getAllCancelOrders = async () => {
  const res = await axios.get(`${API_URL}/orders`, { headers: authHeader() });
  return res.data;
};

// ✅ Get items for specific order - Lazy loading
export const getCancelOrderItems = async (orderNumber: string) => {
  const res = await axios.get(`${API_URL}/orders/${orderNumber}/items`, {
    headers: authHeader(),
  });
  return res.data;
};

// ✅ Search cancel orders by order number
export const searchCancelByOrderNumber = async (orderNumber: string) => {
  const res = await axios.get(`${API_URL}/search`, {
    params: { orderNumber },
    headers: authHeader(),
  });
  return res.data;
};

// ✅ Update cancel item quantity
export const updateCancel = async (
  id: number,
  payload: { cancel_quantity: number }
) => {
  const res = await axios.put(`${API_URL}/update/${id}`, payload, {
    headers: authHeader(),
  });
  return res.data;
};

// ✅ Delete cancel item
export const deleteCancel = async (id: number) => {
  const res = await axios.delete(`${API_URL}/delete/${id}`, {
    headers: authHeader(),
  });
  return res.data;
};

// ✅ Delete all cancels
export const deleteAllCancels = async () => {
  const res = await axios.delete(`${API_URL}/delete-all`, {
    headers: authHeader(),
  });
  return res.data;
};

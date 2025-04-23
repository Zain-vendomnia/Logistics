import axios from "axios";
import authHeader from "./auth-header";

const API_URL = "http://localhost:8080/api/test/";

export const getPublicContent = () => {
  return axios.get(API_URL + "all");
};

 export const getSuperAdmin = () => {
  return axios.get(API_URL + "super_admin", { headers: authHeader() });
}; 

export const getDriverBoard = () => {
  return Promise.resolve({data: 'success'}); 
};

export const getAdminBoard = () => {
  return axios.get(API_URL + "admin", { headers: authHeader() });
};

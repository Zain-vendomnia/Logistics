import axios from "axios";

const API_URL = "http://localhost:8080/api/auth/";

export const register = (username: string, email: string, password: string) => {
  return axios.post(API_URL + "signup", {
    username,
    email,
    password,
  });
};

export const login = (email: string, password: string) => {
  return axios
    .post(API_URL + "login", {
      email,
      password,
    })
    .then((response) => {
      if (response.data.accessToken) {
        localStorage.setItem("user", JSON.stringify(response.data));
      }

      return response.data;
    });
};

export const logout = () => {
  // Server call to end User session > Pending
  localStorage.removeItem("user");
};

export const getCurrentUser = () => {
  const userStr = localStorage.getItem("user");
  if (userStr) return JSON.parse(userStr);

  return null;
};

export const setProfileImage = (imgSrc: string): void => {
  localStorage.setItem("profileImage", JSON.stringify(imgSrc));
};

export const getProfileImage = (): string => {
  const imgSrc = localStorage.getItem("profileImage");
  return imgSrc ? JSON.parse(imgSrc) : "./client_image.png";
};

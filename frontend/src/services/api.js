import axios from "axios";

const API = axios.create({
  baseURL: "https://evermind-backend-vbu8.onrender.com/api",
  withCredentials: true, // Send cookies with every request
});

// Handle auth errors (redirect to login on 401)
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Cookie will be cleared by backend, just redirect
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

export default API;

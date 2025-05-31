import axios from "axios";
axios.defaults.withCredentials = true;

const Axios = axios.create({
  baseURL: "http://localhost:8080/api/api",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
  // Add timeout and better error handling
  timeout: 10000,
  timeoutErrorMessage: "Request timed out",
});

// Add response interceptor for better error handling
Axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      window.location.href = "/";
    }
    return Promise.reject(error);
  }
);

export default Axios;
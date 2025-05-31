import axios from "axios";
axios.defaults.withCredentials = true;

const Axios = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
  timeoutErrorMessage: "Request timed out",
});

export default Axios;

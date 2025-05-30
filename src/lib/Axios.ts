import axios from "axios";
axios.defaults.withCredentials = true;

const Axios = axios.create({
  baseURL: "http://localhost:8080/api/api",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

export default Axios;

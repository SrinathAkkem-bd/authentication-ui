import Axios from "./Axios";
import { logger } from "../utils/logger";

const useToken = async () => {
  try {
    logger.info("Executing useToken()");
    const response = await Axios.get("/auth/user_info");
    return response.data;
  } catch (error) {
    logger.error("Error getting user:", error);
    throw error;
  }
};

export default useToken;
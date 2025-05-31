import Axios from "./Axios";
import { logger } from "../utils/logger";

export type UserData = {
  name: string;
  // Add other user fields as needed
};

const useToken = async (): Promise<UserData> => {
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
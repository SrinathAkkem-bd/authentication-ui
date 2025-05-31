import Axios from "./Axios";
import { UseNavigateResult } from "@tanstack/react-router";
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

export const isAuthenticated = async (navigate: UseNavigateResult<string>) => {
  try {
    await useToken();
  } catch (error) {
    // If there is no session
    navigate({ to: "/" });
    logger.error("Error getting session:", error);
  }
};

export const isNotAuthenticated = async (
  navigate: UseNavigateResult<string>
) => {
  try {
    // If there is session
    await useToken();
    navigate({ to: "/profile" });
  } catch (error) {
    logger.error("Error getting session:", error);
  }
};

export default useToken;
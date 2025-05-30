import Axios from "./Axios";
import { UseNavigateResult } from "@tanstack/react-router";

const useToken = async () => {
  try {
    const response = await Axios.get("/auth/user_info");

    return response.data;
  } catch (error) {
    console.error("Error getting user:", error);
    throw error;
  }
};

export const isAuthenticated = async (navigate: UseNavigateResult<string>) => {
  try {
    await useToken();
  } catch (error) {
    // If there is no session
    navigate({ to: "/" });
    console.error("Error getting session:", error);
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
    console.error("Error getting session:", error);
  }
};

export default useToken;

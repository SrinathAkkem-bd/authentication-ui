import Axios from "./Axios";
import { BaseComponent } from "../utils/logger";

export type UserData = {
  name: string;
  // Add other user fields as needed
};

class TokenService extends BaseComponent {
  constructor() {
    super('TokenService');
  }

  async getToken(): Promise<UserData> {
    try {
      this.log.info("Executing getToken()");
      const response = await Axios.get("/auth/user_info");
      return response.data;
    } catch (error) {
      this.log.error("Error getting user:", error);
      throw error;
    }
  }
}

const tokenService = new TokenService();
export default tokenService.getToken.bind(tokenService);
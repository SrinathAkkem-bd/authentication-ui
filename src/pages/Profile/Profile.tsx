import { useNavigate } from "@tanstack/react-router";
import Layout from "../../components/Layout/Layout";
import Button from "../../components/Buttons/Button";
import Axios from "../../lib/Axios";
import { BaseComponent } from "../../utils/logger";
import { sessionStore } from "../../routes/__root";

class ProfileComponent extends BaseComponent {
  constructor() {
    super('Profile');
  }

  async handleLogout(navigate: ReturnType<typeof useNavigate>) {
    try {
      await Axios.get("/auth/logout");
      sessionStore.clearSession();
      this.log.success("User logged out successfully");
      navigate({ to: "/" });
    } catch (error) {
      this.log.error("Error logging out:", error);
    }
  }

  debugProfileData(sessionData: any) {
    if (sessionData) {
      this.log.debug("Profile Data:", sessionData);
    } else {
      this.log.warn("No session data found");
    }
  }
}

const profileComponent = new ProfileComponent();

const Profile = () => {
  const navigate = useNavigate();
  const logout = () => profileComponent.handleLogout(navigate);

  const sessionData = sessionStore.getSession();
  profileComponent.debugProfileData(sessionData);

  return (
    <Layout>
      <div className="flex justify-between items-center max-w-[700px] w-full bg-[#131313] p-4 rounded-[16px]">
        <div className="flex flex-col gap-[20px]">
          <h1 className="text-[24px] text-gray-100">Profile</h1>

          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <h2 className="text-[20px] text-gray-100">Name:</h2>
              <p className="text-gray-300">{sessionData?.name}</p>
            </div>

            <div className="grid gap-3">
              <Button onClick={logout}>Logout</Button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Profile;
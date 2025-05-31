import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import Axios from "../../lib/Axios";
import Layout from "../../components/Layout/Layout";
import Button from "../../components/Buttons/Button";
import useToken from "../../lib/useToken";
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
}

const profileComponent = new ProfileComponent();

const Profile = () => {
  const navigate = useNavigate();
  const logout = () => profileComponent.handleLogout(navigate);
  
  const { data: datas } = useQuery({
    queryKey: ["token"],
    queryFn: useToken,
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: false,
    suspense: true,
  });

  profileComponent.log.debug("Profile data loaded:", datas);
  return (
    <Layout>
      <div className="flex justify-between items-center max-w-[700px] w-full bg-[#131313] p-4 rounded-[16px]">
        <div className="flex flex-col gap-[20px]">
          <h1 className="text-[24px] text-gray-100">Profile</h1>

          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <h2 className="text-[20px] text-gray-100">Name:</h2>
              <p className="text-gray-300">{datas.name}</p>
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
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";

import Loading from "./Loading";
import Axios from "../../lib/Axios";
import Layout from "../../components/Layout/Layout";
import Button from "../../components/Buttons/Button";
import useToken from "../../lib/useToken";
import { logger } from "../../utils/logger";

const Profile = () => {
  const navigate = useNavigate();

  const logout = async () => {
    try {
      await Axios.get("/auth/logout");
      logger.success("User logged out successfully");
      navigate({ to: "/" });
    } catch (error) {
      logger.error("Error logging out:", error);
    }
  };

  const {
    isLoading,
    error,
    data: datas,
  } = useQuery({
    queryKey: ["token"],
    queryFn: async () => {
      logger.info("Fetching user token");
      return useToken();
    },
    staleTime: 300000,
    refetchOnWindowFocus: false,
    retry: false
  });

  if (isLoading) {
    logger.debug("Loading user profile");
    return <Loading />;
  }

  if (error) {
    logger.error("Error fetching session:", error);
    return (
      <Layout>
        <p className="text-red-500">An error occurred while loading your profile. Please try logging in again.</p>
      </Layout>
    );
  }

  logger.debug("Profile data loaded:", datas);
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
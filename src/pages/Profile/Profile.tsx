import Layout from "../../components/Layout/Layout";
import Button from "../../components/Buttons/Button";
import LoadingOverlay from "../../components/Loading/LoadingOverlay";
import ErrorMessage from "../../components/Error/ErrorMessage";
import { useAuth, useLogout } from "../../hooks/useAuth";
import { BaseComponent } from "../../utils/logger";

class ProfileComponent extends BaseComponent {
  constructor() {
    super('Profile');
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
  const { data: userData, isLoading, error, refetch } = useAuth();
  const logoutMutation = useLogout();

  profileComponent.debugProfileData(userData);

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  if (error) {
    return (
      <Layout>
        <div className="max-w-[700px] w-full">
          <ErrorMessage 
            message="Failed to load profile data. Please try again."
            onRetry={() => refetch()}
          />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <LoadingOverlay 
        isLoading={isLoading} 
        message="Loading profile..."
        overlay={false}
      >
        <div className="flex justify-between items-center max-w-[700px] w-full bg-[#131313] p-4 rounded-[16px]">
          <div className="flex flex-col gap-[20px] w-full">
            <h1 className="text-[24px] text-gray-100">Profile</h1>

            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <h2 className="text-[20px] text-gray-100">Name:</h2>
                <p className="text-gray-300">{userData?.name || 'Loading...'}</p>
              </div>

              <div className="grid gap-3">
                <Button 
                  onClick={handleLogout}
                  loading={logoutMutation.isPending}
                  disabled={logoutMutation.isPending}
                >
                  {logoutMutation.isPending ? 'Logging out...' : 'Logout'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </LoadingOverlay>
    </Layout>
  );
};

export default Profile;
import Layout from "../../components/Layout/Layout";
import Button from "../../components/Buttons/Button";
import LoadingOverlay from "../../components/Loading/LoadingOverlay";
import { useAuth, useLogout, useSessionRefresh } from "../../hooks/useAuth";
import { sessionStore } from "../../routes/__root";
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
  const { data: userData, isLoading, error } = useAuth();
  const logoutMutation = useLogout();
  const refreshMutation = useSessionRefresh();

  profileComponent.debugProfileData(userData);

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const handleRefreshSession = () => {
    refreshMutation.mutate();
  };

  const sessionInfo = sessionStore.getSessionInfo();

  return (
    <Layout>
      <LoadingOverlay 
        isLoading={isLoading} 
        message="Loading profile..."
        overlay={false}
      >
        <div className="flex justify-between items-center max-w-[700px] w-full bg-[#131313] p-4 rounded-[16px]">
          <div className="flex flex-col gap-[20px] w-full">
            <div className="flex justify-between items-center">
              <h1 className="text-[24px] text-gray-100">Profile</h1>
              {!navigator.onLine && (
                <div className="bg-yellow-600 text-white px-3 py-1 rounded text-sm">
                  Offline
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <h2 className="text-[20px] text-gray-100">Name:</h2>
                <p className="text-gray-300">{userData?.name || 'Loading...'}</p>
              </div>

              {/* Session Status */}
              {sessionInfo && import.meta.env.DEV && (
                <div className="bg-gray-800 p-3 rounded text-sm">
                  <h3 className="text-gray-100 font-semibold mb-2">Session Status</h3>
                  <div className="space-y-1 text-gray-300">
                    <div>Status: <span className={sessionInfo.isValid ? 'text-green-400' : 'text-red-400'}>
                      {sessionInfo.isValid ? 'Valid' : 'Invalid'}
                    </span></div>
                    <div>Time Remaining: {Math.floor(sessionInfo.timeRemaining / 1000 / 60)} minutes</div>
                    {sessionInfo.isRenewing && <div className="text-yellow-400">Renewing session...</div>}
                  </div>
                </div>
              )}

              {/* Error Display */}
              {error && (
                <div className="bg-red-900/20 border border-red-500/30 p-3 rounded text-sm">
                  <p className="text-red-400">
                    Connection issue detected. Your session will be restored automatically when connection is available.
                  </p>
                </div>
              )}

              <div className="grid gap-3">
                <Button 
                  onClick={handleRefreshSession}
                  loading={refreshMutation.isPending}
                  disabled={refreshMutation.isPending || !navigator.onLine}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {refreshMutation.isPending ? 'Refreshing...' : 'Refresh Session'}
                </Button>

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
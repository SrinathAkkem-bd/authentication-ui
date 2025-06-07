import Layout from "../../components/Layout/Layout";
import Button from "../../components/Buttons/Button";
import LoadingOverlay from "../../components/Loading/LoadingOverlay";
import { useAuth, useLogout, useFetchOrg } from "../../hooks/useAuth";
import { useNavigate } from "@tanstack/react-router";
import { sessionStore } from "../../routes/__root";
import { BaseComponent } from "../../utils/logger";
import { useEffect } from "react";

class InstallOrgComponent extends BaseComponent {
  constructor() {
    super('InstallOrg');
  }

  debugInstallOrgData(orgData: any) {
    if (orgData) {
      this.log.debug("Install Org Data:", orgData);
    } else {
      this.log.warn("No organization data found");
    }
  }
}

const installOrgComponent = new InstallOrgComponent();

const InstallOrg = () => {
  const { data: userData, isLoading: authLoading } = useAuth();
  const { data: orgData, isLoading: orgLoading, refetch: refetchOrg } = useFetchOrg();
  const logoutMutation = useLogout();
  const navigate = useNavigate();

  installOrgComponent.debugInstallOrgData(orgData);

  // Check org data and redirect accordingly
  useEffect(() => {
    if (orgData && !orgLoading) {
      if (orgData.total > 0) {
        // Has organization data, redirect to wizard
        installOrgComponent.log.info('Organization data found, redirecting to wizard');
        navigate({ to: '/wizard' });
      } else {
        // No organization data, stay on install org page
        installOrgComponent.log.info('No organization data found, staying on install org page');
      }
    }
  }, [orgData, orgLoading, navigate]);

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const handleInstallOrg = async () => {
    installOrgComponent.log.info('Installing organization...');
    // Here you would implement the organization installation logic
    // For now, we'll just refetch the org data
    await refetchOrg();
  };

  const handleRefetchOrg = () => {
    refetchOrg();
  };

  const isLoading = authLoading || orgLoading;

  return (
    <Layout>
      <LoadingOverlay 
        isLoading={isLoading} 
        message="Loading organization setup..."
        overlay={false}
      >
        <div className="flex justify-between items-center max-w-[700px] w-full bg-[#131313] p-4 rounded-[16px]">
          <div className="flex flex-col gap-[20px] w-full">
            <div className="flex justify-between items-center">
              <h1 className="text-[24px] text-gray-100">Install Organization</h1>
              {/* Only show offline indicator, no error messages */}
              {!navigator.onLine && (
                <div className="bg-gray-600 text-white px-3 py-1 rounded text-sm">
                  Offline
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <h2 className="text-[20px] text-gray-100">User:</h2>
                <p className="text-gray-300">{userData?.name || 'Loading...'}</p>
              </div>

              {/* Organization Status */}
              <div className="bg-gray-800 p-3 rounded text-sm">
                <h3 className="text-gray-100 font-semibold mb-2">Organization Status</h3>
                <div className="space-y-1 text-gray-300">
                  {orgData ? (
                    <>
                      <div>Total Organizations: <span className="text-blue-400">{orgData.total || 0}</span></div>
                      {orgData.total === 0 ? (
                        <div className="text-yellow-400">No organization found. Please install one.</div>
                      ) : (
                        <div className="text-green-400">Organization(s) found. Redirecting to wizard...</div>
                      )}
                    </>
                  ) : (
                    <div className="text-gray-400">Loading organization data...</div>
                  )}
                </div>
              </div>

              <div className="grid gap-3">
                {orgData && orgData.total === 0 && (
                  <Button 
                    onClick={handleInstallOrg}
                    disabled={!navigator.onLine}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Install Organization
                  </Button>
                )}

                <Button 
                  onClick={handleRefetchOrg}
                  loading={orgLoading}
                  disabled={orgLoading || !navigator.onLine}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {orgLoading ? 'Checking...' : 'Check Organization Status'}
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

export default InstallOrg;
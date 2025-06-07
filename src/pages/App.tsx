import { useAuth } from "../hooks/useAuth";
import Layout from "../components/Layout/Layout";
import GithubLogin from "./Auth/GithubLogin";
import PageLoader from "../components/Loading/PageLoader";
import ErrorMessage from "../components/Error/ErrorMessage";

const App = () => {
  const { isLoading, error, refetch } = useAuth();

  // Show loading state while checking authentication
  if (isLoading) {
    return <PageLoader message="Checking authentication..." />;
  }

  // Show error state if authentication check failed
  if (error && !error.message?.includes('401')) {
    return (
      <Layout>
        <div className="max-w-md w-full">
          <ErrorMessage 
            message="Failed to check authentication status. Please try again."
            onRetry={() => refetch()}
          />
        </div>
      </Layout>
    );
  }

  // Show login form if not authenticated
  return (
    <Layout>
      <div className="items-center flex-col flex bg-[#131313] p-5 rounded-lg">
        <div className="grid gap-2 w-full">
          <GithubLogin />
        </div>
      </div>
    </Layout>
  );
};

export default App;
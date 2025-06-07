import { useAuth } from "../hooks/useAuth";
import Layout from "../components/Layout/Layout";
import GithubLogin from "./Auth/GithubLogin";
import PageLoader from "../components/Loading/PageLoader";

const App = () => {
  const { isLoading, data: userData } = useAuth();

  // Show loading state only briefly while checking authentication
  if (isLoading) {
    return <PageLoader message="Authenticating..." />;
  }

  // If user is authenticated, redirect will happen automatically
  // This component only shows when user needs to login
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
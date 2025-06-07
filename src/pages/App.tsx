import { useAuth } from "../hooks/useAuth";
import Layout from "../components/Layout/Layout";
import GithubLogin from "./Auth/GithubLogin";
import PageLoader from "../components/Loading/PageLoader";

const App = () => {
  const { isLoading } = useAuth();

  // Show loading state while checking authentication
  if (isLoading) {
    return <PageLoader message="Checking authentication..." />;
  }

  // Always show login form - errors are handled silently
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
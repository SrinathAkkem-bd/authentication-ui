import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";

import Layout from "../components/Layout/Layout";
import GithubLogin from "../components/Auth/GithubLogin";
import { isNotAuthenticated } from "../lib/useToken";

const App = () => {
  const navigate = useNavigate();

  useEffect(() => {
    isNotAuthenticated(navigate);
  }, []);

  return (
    <Layout>
      <div className="items-center flex-col flex bg-[#131313] p-5 rounded-lg">
        <img src="AuthLogo.png" className="h-[200px]" alt="Auth Logo" />
        <div className="grid gap-2 w-full">
          <GithubLogin />
        </div>
      </div>
    </Layout>
  );
};

export default App;
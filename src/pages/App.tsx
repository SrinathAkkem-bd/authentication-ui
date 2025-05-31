import Layout from "../components/Layout/Layout";
import GithubLogin from "./Auth/GithubLogin";

const App = () => {
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
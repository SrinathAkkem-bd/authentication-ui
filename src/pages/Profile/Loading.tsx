import Layout from "../../components/Layout/Layout";

const Loading = () => {
  return (
    <Layout>
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-gray-200"></div>
      </div>
    </Layout>
  );
};

export default Loading;

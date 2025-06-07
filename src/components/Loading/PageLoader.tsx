import Layout from '../Layout/Layout';
import LoadingSpinner from './LoadingSpinner';

const PageLoader = ({ message = 'Loading...' }: { message?: string }) => {
  return (
    <Layout>
      <div className="flex flex-col items-center justify-center gap-4 bg-[#131313] p-8 rounded-lg">
        <LoadingSpinner size="xl" />
        <p className="text-gray-300 text-lg font-medium">{message}</p>
      </div>
    </Layout>
  );
};

export default PageLoader;
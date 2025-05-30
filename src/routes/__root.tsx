import { createRoute } from "@tanstack/react-router";
import { createRootRoute, Outlet } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import App from "../pages/App";
import Profile from "../pages/Profile/Profile";

const queryClient = new QueryClient();

export const rootRoute = createRootRoute({
  component: () => (
    <QueryClientProvider client={queryClient}>
      <Outlet />
    </QueryClientProvider>
  ),
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: App,
});

const ProfileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/profile",
  component: Profile,
});

// Add GitHub callback route
const GitHubCallbackRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/auth/github/callback",
  component: () => {
    const navigate = useNavigate();
    
    useEffect(() => {
      // The session will be automatically set by the backend
      // Redirect to profile page
      navigate({ to: "/profile" });
    }, []);

    return (
      <Layout>
        <div className="text-white">Authenticating...</div>
      </Layout>
    );
  },
});

const routeTree = rootRoute.addChildren([indexRoute, ProfileRoute, GitHubCallbackRoute]);

export default routeTree;
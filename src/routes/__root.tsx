import { createRoute, redirect } from "@tanstack/react-router";
import { createRootRoute, Outlet } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Suspense } from "react";

import App from "../pages/App";
import Profile from "../pages/Profile/Profile";
import PageLoader from "../components/Loading/PageLoader";
import ErrorBoundary from "../components/Error/ErrorBoundary";
import useToken from "../lib/useToken";
import { logger } from "../utils/logger";
import SessionStore from "../lib/sessionStore";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: any) => {
        // Don't retry on 401 errors
        if (error?.response?.status === 401) {
          return false;
        }
        return failureCount < 2;
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      refetchOnMount: true,
    },
  },
});

export const sessionStore = new SessionStore(queryClient);

export const rootRoute = createRootRoute({
  component: () => (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <Suspense fallback={<PageLoader message="Loading application..." />}>
          <Outlet />
        </Suspense>
      </QueryClientProvider>
    </ErrorBoundary>
  ),
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  beforeLoad: async () => {
    try {
      logger.info("Route", "Checking authentication status for index route");
      
      if (sessionStore.hasActiveSession()) {
        const sessionData = sessionStore.getSession()!;
        logger.info("Route", "Active session found, redirecting to profile");
        return redirect({
          to: "/profile",
          search: {
            user: sessionData.name,
          },
        });
      }

      logger.info("Route", "No active session, attempting server authentication");
      const userData = await useToken();
      sessionStore.setSession(userData);
      logger.info("Route", "User authenticated, creating session and redirecting to profile");
      
      return redirect({
        to: "/profile",
        search: {
          user: userData.name,
        },
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes("401")) {
        logger.info("Route", "No active session, staying on login page");
        return {};
      }
      if (error instanceof Error && error.name === "RedirectError") {
        throw error;
      }
      logger.error("Route", `Unexpected error during authentication check: ${error}`);
      return {};
    }
  },
  component: App,
});

const ProfileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/profile",
  beforeLoad: async () => {
    try {
      logger.info("Route", "Checking authentication status for profile route");
      
      if (sessionStore.hasActiveSession()) {
        const sessionData = sessionStore.getSession()!;
        logger.info("Route", "Using existing session data for profile");
        return { userData: sessionData };
      }

      logger.info("Route", "No active session, attempting server authentication");
      const userData = await useToken();
      sessionStore.setSession(userData);
      logger.info("Route", "Creating new session for profile");
      return {
        userData,
      };
    } catch (error) {
      logger.error("Route", "No valid session found, redirecting to login");
      sessionStore.clearSession();
      return redirect({
        to: "/",
      });
    }
  },
  component: Profile,
});

const routeTree = rootRoute.addChildren([indexRoute, ProfileRoute]);

export default routeTree;
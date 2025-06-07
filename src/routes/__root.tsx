import { createRoute, redirect } from "@tanstack/react-router";
import { createRootRoute, Outlet } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Suspense } from "react";

import App from "../pages/App";
import Profile from "../pages/Profile/Profile";
import PageLoader from "../components/Loading/PageLoader";
import ErrorBoundary from "../components/Error/ErrorBoundary";
import NetworkErrorBoundary from "../components/Error/NetworkErrorBoundary";
import SessionMonitor from "../components/Session/SessionMonitor";
import useToken from "../lib/useToken";
import { logger } from "../utils/logger";
import SessionStore from "../lib/sessionStore";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: any) => {
        // Log errors silently
        logger.error("QueryClient", `Query failed (attempt ${failureCount + 1}):`, error?.message);
        
        // Don't retry on 401 errors
        if (error?.response?.status === 401) {
          return false;
        }
        
        // Limited retries - max 2 attempts
        return failureCount < 2;
      },
      retryDelay: (attemptIndex) => {
        // Quick retry with minimal delay
        return Math.min(1000 * (attemptIndex + 1), 3000);
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      refetchOnMount: true,
      refetchInterval: false, // Disable automatic refetching
      // Silent error handling - never throw errors to UI
      throwOnError: false,
    },
    mutations: {
      // Silent error handling for mutations too
      throwOnError: false,
      retry: (failureCount, error: any) => {
        // Don't retry mutations on 401 errors
        if (error?.response?.status === 401) {
          return false;
        }
        return failureCount < 1; // Only 1 retry for mutations
      },
      retryDelay: () => 1000, // 1 second delay for mutation retries
    },
  },
});

export const sessionStore = new SessionStore(queryClient);

export const rootRoute = createRootRoute({
  component: () => (
    <ErrorBoundary>
      <NetworkErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <Suspense fallback={<PageLoader message="Loading..." />}>
            <Outlet />
            <SessionMonitor />
          </Suspense>
        </QueryClientProvider>
      </NetworkErrorBoundary>
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
      // Handle all errors silently - log but don't show to user
      if (error instanceof Error && error.message.includes("401")) {
        logger.info("Route", "No active session, staying on login page");
      } else if (error instanceof Error && error.name === "RedirectError") {
        throw error; // Allow redirects to work
      } else {
        logger.error("Route", `Authentication check failed: ${error}`);
        // Clear any corrupted session data
        sessionStore.clearSession();
      }
      return {}; // Always return successfully to show login page
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
      // Handle errors silently - redirect to login without showing error
      logger.error("Route", "Authentication failed for profile, redirecting to login");
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
import { Switch, Route, useLocation } from "wouter";
import { ReactNode, useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { Layout } from "@/components/layout";
import { AuthProvider } from "@/contexts/auth-context";
import { ThemeProvider } from "@/contexts/theme-context";
import { useAuth } from "@/hooks/use-auth";

// Pages
import Home from "./pages/home";
import Login from "./pages/login";
import Register from "./pages/register";
import Dashboard from "./pages/dashboard";
import Capture from "./pages/capture";
import Library from "./pages/library";
import Search from "./pages/search";
import MemoryDetail from "./pages/memory-detail";
import Connections from "./pages/connections";
import Timeline from "./pages/timeline";
import Chat from "./pages/chat";
import Settings from "./pages/settings";
import Tags from "./pages/tags";

const PUBLIC_PATHS = ["/", "/login", "/register"];

function AuthGuard({ children }: { children: ReactNode }) {
  const { user, isLoaded } = useAuth();
  const [location, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoaded) return;
    if (!user && !PUBLIC_PATHS.includes(location)) {
      setLocation("/login");
    }
  }, [user, isLoaded, location, setLocation]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}

function Router() {
  const { user } = useAuth();

  return (
    <Switch>
      {/* Public routes */}
      <Route path="/" component={user ? Dashboard : Home} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />

      {/* Protected routes */}
      <Route path="/dashboard">
        {() => <Layout><Dashboard /></Layout>}
      </Route>
      <Route path="/capture">
        {() => <Layout><Capture /></Layout>}
      </Route>
      <Route path="/library">
        {() => <Layout><Library /></Layout>}
      </Route>
      <Route path="/timeline">
        {() => <Layout><Timeline /></Layout>}
      </Route>
      <Route path="/search">
        {() => <Layout><Search /></Layout>}
      </Route>
      <Route path="/chat">
        {() => <Layout><Chat /></Layout>}
      </Route>
      <Route path="/memory/:id">
        {() => <Layout><MemoryDetail /></Layout>}
      </Route>
      <Route path="/connections">
        {() => <Layout><Connections /></Layout>}
      </Route>
      <Route path="/tags">
        {() => <Layout><Tags /></Layout>}
      </Route>
      <Route path="/settings">
        {() => <Layout><Settings /></Layout>}
      </Route>

      <Route>
        {() => user ? <Layout><NotFound /></Layout> : <NotFound />}
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AuthProvider>
            <AuthGuard>
              <Router />
            </AuthGuard>
            <Toaster />
          </AuthProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;

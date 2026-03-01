import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { Layout } from "@/components/layout";

// Pages
import Home from "./pages/home";
import Login from "./pages/login";
import Capture from "./pages/capture";
import Library from "./pages/library";
import Search from "./pages/search";
import MemoryDetail from "./pages/memory-detail";
import Connections from "./pages/connections";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      
      {/* Protected-ish routes wrapped in Layout */}
      <Route path="/capture">
        {() => <Layout><Capture /></Layout>}
      </Route>
      <Route path="/library">
        {() => <Layout><Library /></Layout>}
      </Route>
      <Route path="/search">
        {() => <Layout><Search /></Layout>}
      </Route>
      <Route path="/memory/:id">
        {() => <Layout><MemoryDetail /></Layout>}
      </Route>
      <Route path="/connections">
        {() => <Layout><Connections /></Layout>}
      </Route>

      {/* Fallback to 404 */}
      <Route>
        {() => <Layout><NotFound /></Layout>}
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Router />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

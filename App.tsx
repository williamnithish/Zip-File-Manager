import { Layout } from "@/components/layout";
import Dashboard from "@/pages/dashboard";
import Pipeline from "@/pages/pipeline";
import KnowledgeBrowser from "@/pages/knowledge";
import EventLog from "@/pages/events";
import Manage from "@/pages/manage";
import NotFound from "@/pages/not-found";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

const queryClient = new QueryClient();

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/pipeline" component={Pipeline} />
        <Route path="/knowledge" component={KnowledgeBrowser} />
        <Route path="/events" component={EventLog} />
        <Route path="/manage" component={Manage} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

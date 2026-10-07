import { Switch, Route, Router as WouterRouter, Link, useLocation } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import QuotationPage from "@/pages/QuotationPage";
import TestReportPage from "@/pages/TestReportPage";

const queryClient = new QueryClient();

function Tabs() {
  const [loc] = useLocation();
  const tab = (href: string, label: string) => {
    const active = href === "/" ? loc === "/" : loc.startsWith(href);
    return (
      <Link
        href={href}
        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
          active ? "bg-white text-blue-900" : "text-blue-100 hover:bg-blue-800"
        }`}
      >
        {label}
      </Link>
    );
  };
  return (
    <nav className="bg-blue-950 print:hidden">
      <div className="max-w-6xl mx-auto px-4 py-2 flex gap-2">
        {tab("/", "Quotation")}
        {tab("/report", "Test Report")}
      </div>
    </nav>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={QuotationPage} />
      <Route path="/report" component={TestReportPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        {/* Hash routing so /#/report works on GitHub Pages without a server rewrite. */}
        <WouterRouter hook={useHashLocation}>
          <Tabs />
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

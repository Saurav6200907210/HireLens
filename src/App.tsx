import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { Suspense, lazy } from "react";
import { SiteFooter } from "@/components/SiteFooter";

const Index = lazy(() => import("./pages/Index.tsx"));
const Auth = lazy(() => import("./pages/Auth.tsx"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword.tsx"));
const UpdatePassword = lazy(() => import("./pages/UpdatePassword.tsx"));
const Dashboard = lazy(() => import("./pages/Dashboard.tsx"));
const Interview = lazy(() => import("./pages/Interview.tsx"));
const Results = lazy(() => import("./pages/Results.tsx"));
const McqSetup = lazy(() => import("./pages/McqSetup.tsx"));
const LiveSetup = lazy(() => import("./pages/LiveSetup.tsx"));
const LiveInterview = lazy(() => import("./pages/LiveInterview.tsx"));
const LiveResults = lazy(() => import("./pages/LiveResults.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
  </div>
);

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <div className="flex flex-col min-h-screen">
            <div className="flex-1">
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/login" element={<Auth mode="login" />} />
                  <Route path="/signup" element={<Auth mode="signup" />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/update-password" element={<UpdatePassword />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/mcq-setup" element={<McqSetup />} />
                  <Route path="/interview/:id" element={<Interview />} />
                  <Route path="/results/:id" element={<Results />} />
                  <Route path="/live-setup" element={<LiveSetup />} />
                  <Route path="/live/:id" element={<LiveInterview />} />
                  <Route path="/live-results/:id" element={<LiveResults />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </div>
            <SiteFooter />
          </div>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

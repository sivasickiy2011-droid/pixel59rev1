import AiChat from "./pages/AiChat";

import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { PartnerProvider } from "@/contexts/PartnerContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AnimationProvider } from "@/contexts/AnimationContext";
import { useEffect } from "react";
import { trackPageVisit } from "@/utils/analytics";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import BotProtection from "./components/BotProtection";
import BotAdmin from "./pages/BotAdmin";
import ConsentAdmin from "./pages/ConsentAdmin";
import AdminLogin from "./pages/AdminLogin";
        <Route path="/ai-chat" element={<AiChat />} />
import LoginHistory from "./pages/LoginHistory";
import ChangePassword from "./pages/ChangePassword";
import SecurityAdmin from "./pages/SecurityAdmin";
import AdminProtectedRoute from "./components/AdminProtectedRoute";
import TermsOfUse from "./pages/TermsOfUse";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import OurServices from "./pages/OurServices";
import TelegramMiniApp from "./pages/TelegramMiniApp";
import Partners from "./pages/Partners";
import Analytics from "./pages/Analytics";
import PartnerLogosAdmin from "./pages/PartnerLogosAdmin";
import TestS3Upload from "./pages/TestS3Upload";
import PortfolioAdmin from "./pages/PortfolioAdmin";
import ContentAdmin from "./pages/ContentAdmin";
import Brief from "./pages/Brief";
import EmergencyReset from "./pages/EmergencyReset";

const queryClient = new QueryClient();

function AnalyticsTracker() {
  const location = useLocation();

  useEffect(() => {
    trackPageVisit(location.pathname);
  }, [location]);

  return null;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AnimationProvider>
        <TooltipProvider>
          <PartnerProvider>
            <Toaster position="top-right" richColors />
            <BotProtection />
            <BrowserRouter>
              <AnalyticsTracker />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/services" element={<OurServices />} />
            <Route path="/brief" element={<Brief />} />
            <Route path="/tg" element={<TelegramMiniApp />} />
            <Route path="/admin" element={<Navigate to="/admin/login" replace />} />
            <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/ai-chat" element={<AiChat />} />
            <Route path="/admin/bots" element={<AdminProtectedRoute><BotAdmin /></AdminProtectedRoute>} />
            <Route path="/admin/consents" element={<AdminProtectedRoute><ConsentAdmin /></AdminProtectedRoute>} />
            <Route path="/admin/partners" element={<AdminProtectedRoute><Partners /></AdminProtectedRoute>} />
            <Route path="/admin/content" element={<AdminProtectedRoute><ContentAdmin /></AdminProtectedRoute>} />
            <Route path="/admin/partner-logos" element={<AdminProtectedRoute><PartnerLogosAdmin /></AdminProtectedRoute>} />
            <Route path="/admin/portfolio" element={<AdminProtectedRoute><PortfolioAdmin /></AdminProtectedRoute>} />
            <Route path="/admin/analytics" element={<AdminProtectedRoute><Analytics /></AdminProtectedRoute>} />
            <Route path="/admin/security" element={<AdminProtectedRoute><SecurityAdmin /></AdminProtectedRoute>} />
            <Route path="/admin/login-history" element={<AdminProtectedRoute><LoginHistory /></AdminProtectedRoute>} />
            <Route path="/admin/change-password" element={<AdminProtectedRoute><ChangePassword /></AdminProtectedRoute>} />
            <Route path="/emergency-reset" element={<EmergencyReset />} />
            <Route path="/test-s3" element={<TestS3Upload />} />
            <Route path="/terms" element={<TermsOfUse />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
          </PartnerProvider>
        </TooltipProvider>
      </AnimationProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import ErrorBoundary from "@/components/ui/error-boundary";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useVisitorTracking } from "@/hooks/useVisitorTracking";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { ResponsiveLayout } from "./components/layout/ResponsiveLayout";
import { CartProvider } from "./context/CartContext";
import { AuthProvider } from "./hooks/useAuth";
import { PaymentProvider } from "./context/PaymentContext";
import { ThemeProvider } from "./context/ThemeContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AdminRoute } from "./components/AdminRoute";
import { ChatBot } from "./components/ChatBot";
import { PushNotificationManager } from "./components/PushNotificationManager";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import Index from "./pages/Index";
import NewsPage from "./pages/NewsPage";
import NewsDetailPage from "./pages/NewsDetailPage";
import TicketsPage from "./pages/TicketsPage";
import TicketPurchasePage from "./pages/TicketPurchasePage";
import PaymentPage from "./pages/PaymentPage";
import TicketConfirmationPage from "./pages/TicketConfirmationPage";
import ProfilePage from "./pages/ProfilePage";
import MatchesPage from "./pages/MatchesPage";
import MorePage from "./pages/MorePage";
import ShopPage from "./pages/ShopPage";
import AboutPage from "./pages/AboutPage";
import NotFound from "./pages/NotFound";
import CartPage from "./pages/CartPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import MyClubPage from "./pages/MyClubPage";
import PlayerDetailPage from "./pages/PlayerDetailPage";
import GalleryPage from "./pages/GalleryPage";
import AdminDashboard from "./pages/AdminDashboard";
import AdminMorePage from "./pages/AdminMorePage";
import PaymentSuccessPage from "./pages/PaymentSuccessPage";
import PaymentFailedPage from "./pages/PaymentFailedPage";
import PaymentMethodsPage from "./pages/PaymentMethodsPage";
import TicketScannerLoginPage from "./pages/TicketScannerLoginPage";
import TicketScannerPage from "./pages/TicketScannerPage";
import MatchDetailPage from "./pages/MatchDetailPage";
import AssistantPage from "./pages/AssistantPage";

const queryClient = new QueryClient();

function AppContent() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const isScannerRoute = location.pathname.startsWith('/scanner-login') || location.pathname.startsWith('/ticket-scanner');
  const isAssistantRoute = location.pathname === '/assistant';
  
  useVisitorTracking();
  
  if (isScannerRoute) {
    return (
      <Routes>
        <Route path="/scanner-login" element={<TicketScannerLoginPage />} />
        <Route path="/ticket-scanner" element={<TicketScannerPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    );
  }
  
  if (isAdminRoute) {
    return (
      <Routes>
        <Route path="/admin" element={<ProtectedRoute><AdminRoute><AdminDashboard /></AdminRoute></ProtectedRoute>} />
        <Route path="/admin/more" element={<ProtectedRoute><AdminRoute><AdminMorePage /></AdminRoute></ProtectedRoute>} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    );
  }
  
  return (
    <ResponsiveLayout currentPath={location.pathname}>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/news" element={<NewsPage />} />
        <Route path="/news/:id" element={<NewsDetailPage />} />
        <Route path="/tickets" element={<ProtectedRoute><TicketsPage /></ProtectedRoute>} />
        <Route path="/tickets/purchase/:matchId" element={<ProtectedRoute><TicketPurchasePage /></ProtectedRoute>} />
        <Route path="/payment/:matchId" element={<ProtectedRoute><PaymentPage /></ProtectedRoute>} />
        <Route path="/payment-success" element={<PaymentSuccessPage />} />
        <Route path="/payment-failed" element={<PaymentFailedPage />} />
        <Route path="/payment-methods" element={<PaymentMethodsPage />} />
        <Route path="/tickets/confirmation" element={<ProtectedRoute><TicketConfirmationPage /></ProtectedRoute>} />
        <Route path="/matches" element={<MatchesPage />} />
        <Route path="/match/:matchId" element={<MatchDetailPage />} />
        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="/more" element={<MorePage />} />
        <Route path="/shop" element={<ProtectedRoute><ShopPage /></ProtectedRoute>} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/cart" element={<ProtectedRoute><CartPage /></ProtectedRoute>} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/my-club" element={<MyClubPage />} />
        <Route path="/player/:id" element={<PlayerDetailPage />} />
        <Route path="/gallery" element={<GalleryPage />} />
        <Route path="/assistant" element={<AssistantPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      {!isAssistantRoute && <ChatBot />}
    </ResponsiveLayout>
  );
}

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <TooltipProvider>
            <PaymentProvider>
              <CartProvider>
                <Toaster />
                <Sonner />
                <PushNotificationManager />
                <OfflineIndicator />
                <BrowserRouter
                  future={{
                    v7_startTransition: true,
                    v7_relativeSplatPath: true,
                  }}
                >
                  <AppContent />
                </BrowserRouter>
              </CartProvider>
            </PaymentProvider>
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
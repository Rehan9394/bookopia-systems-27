import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { OwnerLayout } from "@/components/layout/OwnerLayout";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import Dashboard from "./pages/Dashboard";
import Bookings from "./pages/Bookings";
import BookingView from "./pages/BookingView";
import BookingAdd from "./pages/BookingAdd";
import BookingEdit from "./pages/BookingEdit";
import Availability from "./pages/Availability";
import Rooms from "./pages/Rooms";
import RoomView from "./pages/RoomView";
import RoomAdd from "./pages/RoomAdd";
import RoomEdit from "./pages/RoomEdit";
import CleaningStatus from "./pages/CleaningStatus";
import Expenses from "./pages/Expenses";
import ExpenseAdd from "./pages/ExpenseAdd";
import ExpenseView from "./pages/ExpenseView";
import ExpenseEdit from "./pages/ExpenseEdit";
import Users from "./pages/Users";
import UserAdd from "./pages/UserAdd";
import UserView from "./pages/UserView";
import UserEdit from "./pages/UserEdit";
import Owners from "./pages/Owners";
import OwnerAdd from "./pages/OwnerAdd";
import OwnerView from "./pages/OwnerView";
import OwnerEdit from "./pages/OwnerEdit";
import Reports from "./pages/Reports";
import AuditLogs from "./pages/AuditLogs";
import Settings from "./pages/Settings";
import Login from "./pages/Login";
import OwnerLogin from "./pages/OwnerLogin";
import OwnerDashboard from "./pages/OwnerDashboard";
import OwnerBookings from "./pages/OwnerBookings";
import OwnerAvailability from "./pages/OwnerAvailability";
import OwnerCleaningStatus from "./pages/OwnerCleaningStatus";
import OwnerReports from "./pages/OwnerReports";
import NotFound from "./pages/NotFound";
import Profile from "./pages/Profile";
import PropertyAdd from "./pages/PropertyAdd";
import PropertyEdit from "./pages/PropertyEdit";
import RoomTypeAdd from "./pages/RoomTypeAdd";
import RoomTypeEdit from "./pages/RoomTypeEdit";
import EmailTemplates from "./pages/EmailTemplates";
import EmailTemplateAdd from "./pages/EmailTemplateAdd";
import EmailTemplateEdit from "./pages/EmailTemplateEdit";
import SmsTemplates from "./pages/SmsTemplates";
import SmsTemplateAdd from "./pages/SmsTemplateAdd";
import SmsTemplateEdit from "./pages/SmsTemplateEdit";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

const ProtectedRoute = ({ 
  children,
  requiredRole = ["admin", "staff", "agent", "manager"],
}: { 
  children: JSX.Element,
  requiredRole?: string[]
}) => {
  const { isAuthenticated, user } = useAuth();
  
  console.log("Protected route check:", { isAuthenticated, user, requiredRole });
  
  if (!isAuthenticated) {
    console.log("Not authenticated, redirecting to login");
    return <Navigate to="/login" />;
  }
  
  if (user && !requiredRole.includes(user.role)) {
    console.log(`User role ${user.role} not in required roles: ${requiredRole.join(', ')}`);
    return <Navigate to="/" />;
  }
  
  console.log("Access granted to protected route");
  return children;
};

// New component for owner routes protection
const ProtectedOwnerRoute = ({ children }: { children: JSX.Element }) => {
  const { isOwnerAuthenticated } = useAuth();
  
  console.log("Protected owner route check:", { isOwnerAuthenticated });
  
  if (!isOwnerAuthenticated) {
    console.log("Owner not authenticated, redirecting to owner login");
    return <Navigate to="/owner/login" />;
  }
  
  console.log("Access granted to protected owner route");
  return children;
};

const MainLayout = () => {
  console.log("Rendering main layout");
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 p-6 bg-background overflow-auto">
          <div className="max-w-[1600px] mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

const App = () => {
  console.log("App rendering");
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/owner/login" element={<OwnerLogin />} />
              
              <Route path="/" element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              }>
                <Route index element={<Dashboard />} />
                <Route path="profile" element={<Profile />} />
                <Route path="bookings" element={<Bookings />} />
                <Route path="bookings/:id" element={<BookingView />} />
                <Route path="bookings/new" element={<BookingAdd />} />
                <Route path="bookings/edit/:id" element={<BookingEdit />} />
                <Route path="availability" element={<Availability />} />
                <Route path="rooms" element={<Rooms />} />
                <Route path="rooms/view/:id" element={<RoomView />} />
                <Route path="rooms/add" element={
                  <ProtectedRoute requiredRole={["admin", "manager"]}>
                    <RoomAdd />
                  </ProtectedRoute>
                } />
                <Route path="rooms/edit/:id" element={
                  <ProtectedRoute requiredRole={["admin", "manager"]}>
                    <RoomEdit />
                  </ProtectedRoute>
                } />
                <Route path="expenses" element={<Expenses />} />
                <Route path="expenses/add" element={<ExpenseAdd />} />
                <Route path="expenses/:id" element={<ExpenseView />} />
                <Route path="expenses/edit/:id" element={
                  <ProtectedRoute requiredRole={["admin", "manager"]}>
                    <ExpenseEdit />
                  </ProtectedRoute>
                } />
                <Route path="cleaning" element={<CleaningStatus />} />
                <Route path="users" element={
                  <ProtectedRoute requiredRole={["admin"]}>
                    <Users />
                  </ProtectedRoute>
                } />
                <Route path="users/add" element={
                  <ProtectedRoute requiredRole={["admin"]}>
                    <UserAdd />
                  </ProtectedRoute>
                } />
                <Route path="users/:id" element={
                  <ProtectedRoute requiredRole={["admin"]}>
                    <UserView />
                  </ProtectedRoute>
                } />
                <Route path="users/edit/:id" element={
                  <ProtectedRoute requiredRole={["admin"]}>
                    <UserEdit />
                  </ProtectedRoute>
                } />
                <Route path="owners" element={
                  <ProtectedRoute requiredRole={["admin", "manager"]}>
                    <Owners />
                  </ProtectedRoute>
                } />
                <Route path="owners/add" element={
                  <ProtectedRoute requiredRole={["admin", "manager"]}>
                    <OwnerAdd />
                  </ProtectedRoute>
                } />
                <Route path="owners/:id" element={
                  <ProtectedRoute requiredRole={["admin", "manager"]}>
                    <OwnerView />
                  </ProtectedRoute>
                } />
                <Route path="owners/edit/:id" element={
                  <ProtectedRoute requiredRole={["admin", "manager"]}>
                    <OwnerEdit />
                  </ProtectedRoute>
                } />
                <Route path="reports" element={<Reports />} />
                <Route path="audit" element={
                  <ProtectedRoute requiredRole={["admin", "manager"]}>
                    <AuditLogs />
                  </ProtectedRoute>
                } />
                <Route path="settings" element={
                  <ProtectedRoute requiredRole={["admin", "manager"]}>
                    <Settings />
                  </ProtectedRoute>
                } />
                <Route path="settings/properties/new" element={
                  <ProtectedRoute requiredRole={["admin", "manager"]}>
                    <PropertyAdd />
                  </ProtectedRoute>
                } />
                <Route path="settings/properties/edit/:id" element={
                  <ProtectedRoute requiredRole={["admin", "manager"]}>
                    <PropertyEdit />
                  </ProtectedRoute>
                } />
                <Route path="settings/room-types/new" element={
                  <ProtectedRoute requiredRole={["admin", "manager"]}>
                    <RoomTypeAdd />
                  </ProtectedRoute>
                } />
                <Route path="settings/room-types/edit/:id" element={
                  <ProtectedRoute requiredRole={["admin", "manager"]}>
                    <RoomTypeEdit />
                  </ProtectedRoute>
                } />
                <Route path="settings/email-templates" element={
                  <ProtectedRoute requiredRole={["admin", "manager"]}>
                    <EmailTemplates />
                  </ProtectedRoute>
                } />
                <Route path="settings/email-templates/new" element={
                  <ProtectedRoute requiredRole={["admin", "manager"]}>
                    <EmailTemplateAdd />
                  </ProtectedRoute>
                } />
                <Route path="settings/email-templates/edit/:id" element={
                  <ProtectedRoute requiredRole={["admin", "manager"]}>
                    <EmailTemplateEdit />
                  </ProtectedRoute>
                } />
                <Route path="settings/sms-templates" element={
                  <ProtectedRoute requiredRole={["admin", "manager"]}>
                    <SmsTemplates />
                  </ProtectedRoute>
                } />
                <Route path="settings/sms-templates/new" element={
                  <ProtectedRoute requiredRole={["admin", "manager"]}>
                    <SmsTemplateAdd />
                  </ProtectedRoute>
                } />
                <Route path="settings/sms-templates/edit/:id" element={
                  <ProtectedRoute requiredRole={["admin", "manager"]}>
                    <SmsTemplateEdit />
                  </ProtectedRoute>
                } />
              </Route>
              
              <Route path="/owner" element={
                <ProtectedOwnerRoute>
                  <OwnerLayout />
                </ProtectedOwnerRoute>
              }>
                <Route path="dashboard" element={<OwnerDashboard />} />
                <Route path="bookings" element={<OwnerBookings />} />
                <Route path="availability" element={<OwnerAvailability />} />
                <Route path="cleaning" element={<OwnerCleaningStatus />} />
                <Route path="reports" element={<OwnerReports />} />
              </Route>
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;

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
  requiredRole = ["admin", "staff", "manager"],
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
                <Route path="rooms/add" element={<RoomAdd />} />
                <Route path="rooms/edit/:id" element={<RoomEdit />} />
                <Route path="expenses" element={<Expenses />} />
                <Route path="expenses/add" element={<ExpenseAdd />} />
                <Route path="expenses/:id" element={<ExpenseView />} />
                <Route path="expenses/edit/:id" element={<ExpenseEdit />} />
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
                <Route path="owners" element={<Owners />} />
                <Route path="owners/add" element={<OwnerAdd />} />
                <Route path="owners/:id" element={<OwnerView />} />
                <Route path="owners/edit/:id" element={<OwnerEdit />} />
                <Route path="reports" element={<Reports />} />
                <Route path="audit" element={<AuditLogs />} />
                <Route path="settings" element={<Settings />} />
                <Route path="settings/properties/new" element={<PropertyAdd />} />
                <Route path="settings/properties/edit/:id" element={<PropertyEdit />} />
                <Route path="settings/room-types/new" element={<RoomTypeAdd />} />
                <Route path="settings/room-types/edit/:id" element={<RoomTypeEdit />} />
                <Route path="settings/email-templates" element={<EmailTemplates />} />
                <Route path="settings/email-templates/new" element={<EmailTemplateAdd />} />
                <Route path="settings/email-templates/edit/:id" element={<EmailTemplateEdit />} />
                <Route path="settings/sms-templates" element={<SmsTemplates />} />
                <Route path="settings/sms-templates/new" element={<SmsTemplateAdd />} />
                <Route path="settings/sms-templates/edit/:id" element={<SmsTemplateEdit />} />
              </Route>
              
              <Route path="/owner" element={
                <ProtectedRoute requiredRole={["owner"]}>
                  <OwnerLayout />
                </ProtectedRoute>
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

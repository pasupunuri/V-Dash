import React, { useState, useEffect, useRef } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Sidebar from "@/components/Sidebar";
import TopNavbar from "@/components/TopNavbar";
import Footer from "@/components/Footer";
import ProtectedRoute from "@/components/ProtectedRoute";
import Dashboard from "@/pages/Dashboard";
import NightAudit from "@/pages/NightAudit";
import Reports from "@/pages/Reports";
import OnTheBooks from "@/pages/OnTheBooks";
import NotFound from "./pages/NotFound";
import { cn } from "@/lib/utils";
import Login from "@/pages/Login";
import { fetchProperties } from "@/mocks/propertyApi";
import HotelDashboard from "@/pages/HotelDashboard";
import Budgeting from "@/pages/Budgeting";
import Accounting from "@/pages/Accounting";
import Forecasting from "@/pages/Forecasting";
import LaborAnalytics from "@/pages/LaborAnalytics";
import UploadDailyReports from "@/pages/UploadDailyReports";
import ViewDownloadReports from "@/pages/ViewDownloadReports";
import ManageUsers from "@/pages/ManageUsers";
import InviteUser from "@/pages/InviteUser";
import { usePropertyStore } from "@/store/propertyStore";

const queryClient = new QueryClient();

function isSmallScreen() {
  return window.innerWidth <= 1024;
}

function AppRoutes() {
  const location = useLocation();

  if (location.pathname === "/login" || location.pathname === "/") {
    return <Login />;
  }

  return (
    <ProtectedRoute>
      <MainLayout />
    </ProtectedRoute>
  );
}

function MainLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const manualToggle = useRef(false);

  const {
    properties,
    selectedHotel,
    setSelectedHotel,
    fetchProperties,
    initialized,
  } = usePropertyStore();

  useEffect(() => {
    if (!initialized) {
      fetchProperties();
    }
  }, [initialized, fetchProperties]);

  useEffect(() => {
    const updateSidebar = () => {
      if (!manualToggle.current) {
        setSidebarCollapsed(isSmallScreen());
      }
    };
    updateSidebar();
    const handleResize = () => {
      updateSidebar();
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const toggleSidebar = () => {
    setSidebarCollapsed((prev) => {
      manualToggle.current = true;
      return !prev;
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 w-full flex flex-col">
      <Sidebar isCollapsed={sidebarCollapsed} onToggleCollapse={toggleSidebar} />
      <TopNavbar
        sidebarCollapsed={sidebarCollapsed}
        onToggleSidebar={toggleSidebar}
      />

      <main
        className={cn(
          "pt-16 transition-all duration-300 flex-1",
          sidebarCollapsed ? "ml-16" : "ml-64"
        )}
      >
        <div className="p-6 w-full">
          <Routes>
            <Route path="/dashboard" element={
              <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/hotel-dashboard" element={
              <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                <HotelDashboard selectedHotel={selectedHotel} />
              </ProtectedRoute>
            } />
            <Route path="/night-audit" element={
              <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                <NightAudit />
              </ProtectedRoute>
            } />
            <Route path="/reports" element={
              <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                <Reports />
              </ProtectedRoute>
            } />
            <Route path="/budgeting" element={
              <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                <Budgeting selectedHotel={selectedHotel} />
              </ProtectedRoute>
            } />
            <Route path="/accounting" element={
              <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                <Accounting />
              </ProtectedRoute>
            } />
            <Route path="/forecasting" element={
              <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                <Forecasting selectedHotel={selectedHotel} />
              </ProtectedRoute>
            } />
            <Route path="/labor-analytics" element={
              <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                <LaborAnalytics selectedHotel={selectedHotel} />
              </ProtectedRoute>
            } />
            <Route path="/on-the-books" element={
              <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                <OnTheBooks />
              </ProtectedRoute>
            } />
            <Route path="/upload-daily-reports" element={<UploadDailyReports />} />
            <Route path="/view-download-reports" element={<ViewDownloadReports />} />
            <Route path="/manage-users" element={
              <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                <ManageUsers />
              </ProtectedRoute>
            } />
            <Route path="/invite-user" element={
              <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                <InviteUser />
              </ProtectedRoute>
            } />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </main>

      <div
        className={cn(
          "transition-all duration-300 mt-auto",
          sidebarCollapsed ? "ml-16" : "ml-64"
        )}
      >
        <Footer />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

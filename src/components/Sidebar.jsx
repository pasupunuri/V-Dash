import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import {
  Calendar,
  Bell,
  User,
  BarChart3,
  Building2,
  DollarSign,
  Calculator,
  Menu,
  TrendingUp,
  BookOpen,
  Users,
  Upload,
  Download,
  FileSpreadsheet
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { useAuthStore } from '@/store/authStore';

const navigationItems = [
  { label: 'Portfolio Dashboard', icon: BarChart3, path: '/dashboard', allowedRoles: ['admin', 'super_admin'] },
  { label: 'Hotel Dashboard', icon: Building2, path: '/hotel-dashboard', allowedRoles: ['admin', 'super_admin'] },
  // { label: 'Budgeting', icon: DollarSign, path: '/budgeting' },
  // { label: 'Forecasting', icon: TrendingUp, path: '/forecasting' },
  // { label: 'Labor Analytics', icon: Users, path: '/labor-analytics' },
  // { label: 'On The Books', icon: BookOpen, path: '/on-the-books' },
  { label: 'Accounting', icon: Calculator, path: '/accounting', allowedRoles: ['admin', 'super_admin'] },
  // { label: 'Report Data Manager', icon: FileSpreadsheet, path: '/report-data-manager', allowedRoles: ['admin', 'super_admin'] },
];

const additionalItems = [
  { label: 'Upload Daily Reports', icon: Upload, path: '/upload-daily-reports' },  // Available to all roles
  // { label: 'View/Download Reports', icon: Download, path: '/view-download-reports' },  // Available to all roles
];

const Sidebar = ({ isCollapsed, onToggleCollapse }) => {
  const location = useLocation();
  const user = useAuthStore(state => state.user);
  const userRole = user?.role || 'employee';

  // Filter navigation items based on user role
  const filteredNavigationItems = navigationItems.filter(item => {
    if (!item.allowedRoles) return true; // No restriction
    return item.allowedRoles.includes(userRole);
  });

  const renderNavigationItem = (item) => {
    const isActive = location.pathname === item.path;

    const menuContent = (
      <span className={cn(
        "flex items-center w-full",
        isCollapsed ? "justify-center" : ""
      )}>
        <item.icon 
          className={cn(
            "w-5 h-5 transition-colors flex-shrink-0",
            isActive ? "text-white" : "text-slate-400 group-hover:text-slate-200",
            isCollapsed ? "mx-auto" : "mr-3"
          )}
        />
        {!isCollapsed && (
          <span className={cn(
            "text-sm transition-all duration-200",
            isActive ? "font-semibold" : ""
          )}>{item.label}</span>
        )}
        {isActive && !isCollapsed && (
          <div className="absolute right-3 w-2 h-2 bg-white rounded-full opacity-80" />
        )}
      </span>
    );

    return (
      <li key={item.path} className="relative">
        {isCollapsed ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                to={item.path}
                className={cn(
                  "flex items-center px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative overflow-hidden",
                  isActive 
                    ? "bg-gradient-to-r from-yellow-500 to-yellow-600 text-white shadow-lg shadow-yellow-500/25"
                    : "text-slate-300 hover:bg-slate-700/50 hover:text-white"
                )}
                tabIndex={0}
              >
                {menuContent}
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right" align="center">
              {item.label}
            </TooltipContent>
          </Tooltip>
        ) : (
          <Link
            to={item.path}
            className={cn(
              "flex items-center px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative overflow-hidden",
              isActive 
                ? "bg-gradient-to-r from-yellow-500 to-yellow-600 text-white shadow-lg shadow-yellow-500/25"
                : "text-slate-300 hover:bg-slate-700/50 hover:text-white"
            )}
          >
            {menuContent}
          </Link>
        )}
      </li>
    );
  };

  return (
    <div 
      className={cn(
        "fixed left-0 top-0 h-full bg-gradient-to-b from-slate-900 to-slate-800 border-r border-slate-700/50 transition-all duration-300 z-30 backdrop-blur-sm",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo Area */}
      <div className="h-14 flex items-center justify-between border-b border-slate-700/50 px-4">
        {!isCollapsed ? (
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-lg flex items-center justify-center shadow-lg">
              <span className="text-slate-900 font-bold text-sm">VD</span>
            </div>
            <div>
              <h1 className="text-white font-semibold text-sm">V-Dash</h1>
              <p className="text-slate-400 text-xs">Analytics</p>
            </div>
          </div>
        ) : (
          <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-lg flex items-center justify-center shadow-lg mx-auto">
            <span className="text-slate-900 font-bold text-sm">VD</span>
          </div>
        )}
        
        {!isCollapsed && (
          <button
            onClick={onToggleCollapse}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-700/50 hover:text-white transition-all duration-200"
            aria-label="Collapse sidebar"
          >
            <Menu className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 px-3 py-4">
        <TooltipProvider>
          <ul className="space-y-1">
            {filteredNavigationItems.map(renderNavigationItem)}

            {/* Separator Line - only show if there are navigation items above */}
            {filteredNavigationItems.length > 0 && (
              <li className="py-2">
                <div className="border-t border-slate-700/50 mx-2" />
              </li>
            )}

            {additionalItems.map(renderNavigationItem)}
          </ul>
        </TooltipProvider>
      </nav>

      {/* Collapse Toggle - Only show when collapsed */}
      {isCollapsed && (
        <div className="border-t border-slate-700/50 p-3">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={onToggleCollapse}
                  className="w-full flex items-center justify-center p-2.5 rounded-xl text-slate-400 hover:bg-slate-700/50 hover:text-white transition-all duration-200 group"
                  title="Expand sidebar"
                  aria-label="Expand sidebar"
                >
                  <Menu className="w-5 h-5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" align="center">
                Expand Menu
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )}
    </div>
  );
};

export default Sidebar;

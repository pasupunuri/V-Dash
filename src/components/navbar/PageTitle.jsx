import React from 'react';
import { useLocation } from 'react-router-dom';

export const usePageTitle = () => {
  const location = useLocation();

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/':
        return 'Portfolio Dashboard';
      case '/hotel-dashboard':
        return 'Hotel Dashboard';
      case '/night-audit':
        return 'Night Audit';
      case '/reports':
        return 'Reports';
      case '/portfolio':
        return 'Portfolio';
      case '/budgeting':
        return 'Budgeting';
      case '/forecasting':
        return 'Forecasting';
      case '/accounting':
        return 'Accounting';
      case '/labor-analytics':
        return 'Labor Analytics';
      case '/on-the-books':
        return 'On The Books';
      case '/upload-daily-reports':
        return 'Night Audit Reports Upload';
      case '/view-download-reports':
        return 'View / Download Night Audit Reports';
      case '/report-data-manager':
        return 'Report Data Manager';
      case '/manage-users':
        return 'Manage Users';
      default:
        return 'Portfolio Dashboard';
    }
  };

  return getPageTitle();
};

const PageTitle = ({ title }) => {
  return (
    <div className="flex items-center space-x-4 min-w-0 flex-1">
      <div className="min-w-0">
        <h1 className="text-xl font-semibold text-gray-900 truncate">{title}</h1>
      </div>
    </div>
  );
};

export default PageTitle;

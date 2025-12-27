import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, ChevronDown } from 'lucide-react';
import { useAuthStore } from "@/store/authStore";
import { usePropertyStore } from "@/store/propertyStore";
import "react-day-picker/dist/style.css";

const UserMenu = () => {
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const logout = useAuthStore(state => state.logout);
  const user = useAuthStore(state => state.user);
  const resetPropertyStore = usePropertyStore(state => state.reset);

  const handleLogout = () => {
    logout();
    resetPropertyStore(); // Clear cached property data on logout
    navigate("/login");
  };
  // Close dropdown on outside click
  useEffect(() => {
    if (!showDropdown) return;
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center">
          <User className="w-4 h-4 text-white" />
        </div>
        <ChevronDown className="w-4 h-4 text-gray-500" />
      </button>

      {showDropdown && (
        <div className="absolute top-full right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
          {/* User Name and Designation */}
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-sm font-medium text-gray-900">{user.full_name}</p>
            {user?.email && (
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
            )}
          {/* </div> */}
          {/* <p className="text-xs text-gray-500">Corporate Director</p> */}
          </div>

          {/* Section 1 */}
          {/* <button
            className="w-full flex items-center gap-2 text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            onClick={() => setShowDropdown(false)}
          >
            Audit Trail
          </button>
          <button
            className="w-full flex items-center gap-2 text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            onClick={() => setShowDropdown(false)}
          >
            Email List
          </button> */}

          {/* <hr className="my-1 border-gray-100" /> */}

          {/* Section 2 - Only show User Management for admin and super_admin */}
          {(user?.role === 'admin' || user?.role === 'super_admin') && (
            <button
              className="w-full flex items-center gap-2 text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              onClick={() => {
                setShowDropdown(false);
                navigate('/manage-users');
              }}
            >
              User Management
            </button>
          )}
          {/* <button
            className="w-full flex items-center gap-2 text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            onClick={() => setShowDropdown(false)}
          >
            Event Calender
          </button>
          <button
            className="w-full flex items-center gap-2 text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            onClick={() => setShowDropdown(false)}
          >
            Bank Accounts
          </button>

          <hr className="my-1 border-gray-100" /> */}

          {/* Section 3 */}
          {/* <button
            className="w-full flex items-center gap-2 text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            onClick={() => setShowDropdown(false)}
          >
            Change Password
          </button> */}

          <hr className="my-1 border-gray-100" />

          {/* Section 4 */}
          <button
            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
            onClick={() => {
              handleLogout();
            }}
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
};

export default UserMenu;

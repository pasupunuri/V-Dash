import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Building,
  User,
  MoreHorizontal,
  UserCheck,
  UserX,
  ChevronLeft,
  ChevronRight,
  Key,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { userApi } from '@/utils/userApi';
import { api } from '@/store/api';
import { useAuthStore } from '@/store/authStore';

// Helper to display role nicely
const formatRole = (role) => {
  if (role === 'super_admin') return 'Super Admin';
  if (role === 'admin') return 'Admin';
  if (role === 'employee') return 'Employee';
  return role || 'Employee';
};

const ManageUsers = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const currentUser = useAuthStore(state => state.user);
  const isSuperAdmin = currentUser?.role === 'super_admin';
  const [searchQuery, setSearchQuery] = useState('');
  const [showEditUserDialog, setShowEditUserDialog] = useState(false);
  const [showAssignPropertiesDialog, setShowAssignPropertiesDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [properties, setProperties] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);
  const [activeCount, setActiveCount] = useState(0);
  const [inactiveCount, setInactiveCount] = useState(0);
  const pageSize = 20;
  const [editFormData, setEditFormData] = useState({
    full_name: '',
    role: '',
    phone: '',
  });
  const [showChangePasswordDialog, setShowChangePasswordDialog] = useState(false);
  const [newPassword, setNewPassword] = useState('');

  // Load users and properties from API
  const loadUsers = async (page = currentPage, search = searchQuery) => {
    try {
      setTableLoading(true);
      const response = await userApi.getUsers(page, pageSize, search);
      setUsers(response.users || []);
      setTotalUsers(response.total || 0);
      setTotalPages(response.total_pages || 0);
      setCurrentPage(response.page || 1);
      setActiveCount(response.active_count || 0);
      setInactiveCount(response.inactive_count || 0);
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load users',
        variant: 'destructive',
      });
    } finally {
      setTableLoading(false);
      setInitialLoading(false);
    }
  };

  const loadProperties = async () => {
    try {
      const response = await api.get('properties');
      setProperties(response.data || []);
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load properties',
        variant: 'destructive',
      });
    }
  };

  const isInitialMount = useRef(true);

  useEffect(() => {
    loadUsers(1, '');
    loadProperties();
  }, []);

  // Debounced search effect - skip initial mount
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    const timeoutId = setTimeout(() => {
      loadUsers(1, searchQuery);
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setEditFormData({
      full_name: user.full_name || '',
      role: user.role || '',
      phone: user.phone || '',
    });
    setShowEditUserDialog(true);
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;

    try {
      await userApi.updateUser(selectedUser._id, editFormData);
      toast({
        title: 'Success',
        description: 'User updated successfully',
      });
      await loadUsers();
      setShowEditUserDialog(false);
      setSelectedUser(null);
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update user',
        variant: 'destructive',
      });
    }
  };

  const handleChangePassword = (user) => {
    setSelectedUser(user);
    setNewPassword('');
    setShowChangePasswordDialog(true);
  };

  const handleUpdatePassword = async () => {
    if (!selectedUser || !newPassword) return;

    if (newPassword.length < 6) {
      toast({
        title: 'Error',
        description: 'Password must be at least 6 characters',
        variant: 'destructive',
      });
      return;
    }

    try {
      await userApi.updateUserPassword(selectedUser._id, newPassword);
      toast({
        title: 'Success',
        description: 'Password updated successfully',
      });
      setShowChangePasswordDialog(false);
      setSelectedUser(null);
      setNewPassword('');
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update password',
        variant: 'destructive',
      });
    }
  };

  const handleToggleUserStatus = async (userId, currentStatus) => {
    try {
      const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
      await userApi.toggleUserStatus(userId, newStatus);
      toast({
        title: 'Success',
        description: `User status changed to ${newStatus}`,
      });
      await loadUsers();
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update user status',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      await userApi.deleteUser(userId);
      toast({
        title: 'Success',
        description: 'User deleted successfully',
      });
      await loadUsers();
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete user',
        variant: 'destructive',
      });
    }
  };

  const handleAssignProperties = (user) => {
    setSelectedUser(user);
    setShowAssignPropertiesDialog(true);
  };

  const handleUpdateProperties = async () => {
    if (!selectedUser) return;

    try {
      await userApi.updateUserProperties(selectedUser._id, selectedUser.property_ids || []);
      toast({
        title: 'Success',
        description: 'Property assignments updated successfully',
      });
      await loadUsers();
      setShowAssignPropertiesDialog(false);
      setSelectedUser(null);
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update property assignments',
        variant: 'destructive',
      });
    }
  };

  const handlePropertyToggle = (propertyId, checked) => {
    if (!selectedUser) return;

    setSelectedUser(prev => ({
      ...prev,
      property_ids: checked
        ? [...(prev.property_ids || []), propertyId]
        : (prev.property_ids || []).filter(id => id !== propertyId)
    }));
  };

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Loading users...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manage Users</h1>
          <p className="text-gray-600 mt-1">Invite, edit, and manage user accounts and property assignments</p>
        </div>
        <Button onClick={() => navigate('/invite-user')}>
          <Plus className="w-4 h-4 mr-2" />
          Invite User
        </Button>
      </div>

      {/* Search and Stats */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search users by name, email, or role"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-4 text-sm text-gray-600">
              <span>Total Users: {totalUsers}</span>
              <span>Active: {activeCount}</span>
              <span>Inactive: {inactiveCount}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1 relative">
            {/* Table Loading Overlay */}
            {tableLoading && (
              <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-10 rounded-lg">
                <div className="flex items-center gap-2 text-gray-600">
                  <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  <span>Loading...</span>
                </div>
              </div>
            )}

            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 px-4 py-2 text-sm font-medium text-gray-500 border-b">
              <div className="col-span-4">User</div>
              <div className="col-span-2">Properties</div>
              <div className="col-span-2">Role</div>
              <div className="col-span-2">Created</div>
              <div className="col-span-2 text-right">Actions</div>
            </div>

            {/* Table Rows */}
            {users.map((user) => (
              <div key={user._id} className="grid grid-cols-12 gap-4 px-4 py-3 hover:bg-gray-50 transition-colors rounded-lg">
                <div className="col-span-4 flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="font-medium text-blue-600">
                      {user.full_name || user.email}
                    </div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                    <div className="mt-1">
                      <Badge
                        variant={user.status === 'Active' ? 'default' : 'secondary'}
                        className={user.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}
                      >
                        {user.status || 'Active'}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="col-span-2 flex items-center">
                  <span className="text-sm text-blue-600 font-medium">
                    {(user.property_ids || []).length} Properties
                  </span>
                </div>

                <div className="col-span-2 flex items-center">
                  <span className="text-sm text-gray-700">{formatRole(user.role)}</span>
                </div>

                <div className="col-span-2 flex items-center">
                  <span className="text-sm text-gray-700">
                    {user.created_at ? format(new Date(user.created_at), 'MMM d, yyyy') : 'N/A'}
                  </span>
                </div>

                <div className="col-span-2 flex items-center justify-end">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEditUser(user)}>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit User
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleChangePassword(user)}>
                        <Key className="w-4 h-4 mr-2" />
                        Change Password
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleAssignProperties(user)}>
                        <Building className="w-4 h-4 mr-2" />
                        Manage Properties
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleToggleUserStatus(user._id, user.status || 'Active')}>
                        {(user.status || 'Active') === 'Active' ? (
                          <>
                            <UserX className="w-4 h-4 mr-2" />
                            Disable User
                          </>
                        ) : (
                          <>
                            <UserCheck className="w-4 h-4 mr-2" />
                            Enable User
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleDeleteUser(user._id)}
                        className="text-red-600"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete User
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}

            {users.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No users found matching your search.
              </div>
            )}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t">
              <div className="text-sm text-gray-600">
                Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalUsers)} of {totalUsers} users
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => loadUsers(currentPage - 1)}
                  disabled={currentPage === 1 || tableLoading}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Previous
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(page => {
                      // Show first, last, current, and adjacent pages
                      return page === 1 ||
                             page === totalPages ||
                             Math.abs(page - currentPage) <= 1;
                    })
                    .map((page, index, arr) => (
                      <React.Fragment key={page}>
                        {index > 0 && arr[index - 1] !== page - 1 && (
                          <span className="px-2 text-gray-400">...</span>
                        )}
                        <Button
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                          className="w-8 h-8 p-0"
                          onClick={() => loadUsers(page)}
                          disabled={tableLoading}
                        >
                          {page}
                        </Button>
                      </React.Fragment>
                    ))
                  }
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => loadUsers(currentPage + 1)}
                  disabled={currentPage === totalPages || tableLoading}
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={showEditUserDialog} onOpenChange={setShowEditUserDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-4">
              <div>
                <Label>Full Name</Label>
                <Input
                  value={editFormData.full_name}
                  onChange={(e) => setEditFormData({ ...editFormData, full_name: e.target.value })}
                  placeholder="Enter full name"
                />
              </div>

              <div>
                <Label>Role</Label>
                <select
                  value={editFormData.role}
                  onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  {isSuperAdmin && <option value="super_admin">Super Admin</option>}
                  <option value="admin">Admin</option>
                  <option value="employee">Employee</option>
                </select>
              </div>

              <div>
                <Label>Phone</Label>
                <Input
                  value={editFormData.phone}
                  onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                  placeholder="Enter phone number"
                />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => setShowEditUserDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateUser}>
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Assign Properties Dialog */}
      <Dialog open={showAssignPropertiesDialog} onOpenChange={setShowAssignPropertiesDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Manage Property Assignments</DialogTitle>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="font-medium">
                  {selectedUser.full_name || selectedUser.email}
                </p>
                <p className="text-sm text-gray-600">{selectedUser.email}</p>
              </div>

              <div className="space-y-2">
                <Label>Assigned Properties</Label>
                <div className="max-h-60 overflow-y-auto border rounded-lg p-3 space-y-2">
                  {properties.map((property) => (
                    <div key={property._id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`assign-${property._id}`}
                        checked={(selectedUser.property_ids || []).includes(property._id)}
                        onCheckedChange={(checked) => handlePropertyToggle(property._id, checked)}
                      />
                      <Label htmlFor={`assign-${property._id}`} className="text-sm font-normal">
                        {property.name} {property.rooms ? `(${property.rooms} rooms)` : ''}
                      </Label>
                    </div>
                  ))}
                  {properties.length === 0 && (
                    <div className="text-center py-4 text-gray-500 text-sm">
                      No properties available
                    </div>
                  )}
                </div>
                <p className="text-sm text-gray-600">
                  Selected: {(selectedUser.property_ids || []).length} properties
                </p>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => setShowAssignPropertiesDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateProperties}>
              Update Assignments
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog open={showChangePasswordDialog} onOpenChange={setShowChangePasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="font-medium">{selectedUser.full_name || selectedUser.email}</p>
                <p className="text-sm text-gray-600">{selectedUser.email}</p>
              </div>

              <div>
                <Label>New Password</Label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                />
                <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => setShowChangePasswordDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdatePassword} disabled={!newPassword || newPassword.length < 6}>
              Update Password
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ManageUsers;

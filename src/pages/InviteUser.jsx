import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, ArrowLeft, Mail, User, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { userApi } from '@/utils/userApi';
import { api } from '@/store/api';
import { useAuthStore } from '@/store/authStore';

const InviteUser = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const currentUser = useAuthStore(state => state.user);
  const isSuperAdmin = currentUser?.role === 'super_admin';

  const [newUser, setNewUser] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phone: '',
    designation: '',
    role: 'employee',
    assignedProperties: []
  });

  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Property selection state for filtering
  const [propertySearchQuery, setPropertySearchQuery] = useState('');

  // Load properties from API
  useEffect(() => {
    const loadProperties = async () => {
      try {
        setLoading(true);
        const response = await api.get('properties');
        setProperties(response.data || []);
      } catch (error) {
        toast({
          title: 'Error',
          description: error.message || 'Failed to load properties',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    loadProperties();
  }, []);

  // Filter properties based on search
  const filteredProperties = properties.filter(property => {
    const searchLower = propertySearchQuery.toLowerCase();
    return (
      property.name.toLowerCase().includes(searchLower)
    );
  });

  const handlePropertyToggle = (propertyId, checked) => {
    setNewUser(prev => ({
      ...prev,
      assignedProperties: checked
        ? [...prev.assignedProperties, propertyId]
        : prev.assignedProperties.filter(p => p !== propertyId)
    }));
  };

  const handleSelectAllFiltered = () => {
    const allPropertyIds = filteredProperties.map(p => p._id);
    setNewUser(prev => ({
      ...prev,
      assignedProperties: [...new Set([...prev.assignedProperties, ...allPropertyIds])]
    }));
  };

  const handleDeselectAll = () => {
    setNewUser(prev => ({
      ...prev,
      assignedProperties: []
    }));
  };

  const handleInviteUser = async () => {
    // Validate required fields
    if (!newUser.firstName || !newUser.lastName || !newUser.email || !newUser.password || !newUser.designation || !newUser.role) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSubmitting(true);

      // Create user via API
      await userApi.createUser({
        email: newUser.email,
        password: newUser.password,
        role: newUser.role,
        full_name: `${newUser.firstName} ${newUser.lastName}`,
        phone: newUser.phone,
        property_ids: newUser.assignedProperties,
      });

      toast({
        title: 'Invitation Sent',
        description: `User ${newUser.email} has been created successfully`,
      });

      // Navigate back to manage users
      navigate('/manage-users');
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create user',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/manage-users')}
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Manage Users
          </Button>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
            <Plus className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Invite New User</h1>
            <p className="text-gray-600">Create a new user account and assign properties</p>
          </div>
        </div>

        {/* Main Form */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* User Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                User Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>First Name *</Label>
                  <Input
                    value={newUser.firstName}
                    onChange={(e) => setNewUser(prev => ({ ...prev, firstName: e.target.value }))}
                    placeholder="Enter first name"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Last Name *</Label>
                  <Input
                    value={newUser.lastName}
                    onChange={(e) => setNewUser(prev => ({ ...prev, lastName: e.target.value }))}
                    placeholder="Enter last name"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Email Address *</Label>
                <Input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Enter email address"
                />
              </div>

              <div className="space-y-2">
                <Label>Password *</Label>
                <Input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Enter password"
                />
              </div>

              <div className="space-y-2">
                <Label>Phone Number</Label>
                <Input
                  value={newUser.phone}
                  onChange={(e) => setNewUser(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="Enter phone number"
                />
              </div>

              <div className="space-y-2">
                <Label>Designation *</Label>
                <Select
                  value={newUser.designation}
                  onValueChange={(value) => setNewUser(prev => ({ ...prev, designation: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select designation" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Corporate Director">Corporate Director</SelectItem>
                    <SelectItem value="General Manager">General Manager</SelectItem>
                    <SelectItem value="Revenue Manager">Revenue Manager</SelectItem>
                    <SelectItem value="Property Manager">Property Manager</SelectItem>
                    <SelectItem value="Financial Controller">Financial Controller</SelectItem>
                    <SelectItem value="Operations Manager">Operations Manager</SelectItem>
                    <SelectItem value="Assistant Manager">Assistant Manager</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Role *</Label>
                <Select
                  value={newUser.role}
                  onValueChange={(value) => setNewUser(prev => ({ ...prev, role: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {isSuperAdmin && <SelectItem value="super_admin">Super Admin</SelectItem>}
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="employee">Employee</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Property Assignment */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                Assign Properties ({newUser.assignedProperties.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search properties..."
                  value={propertySearchQuery}
                  onChange={(e) => setPropertySearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Bulk Actions */}
              <div className="flex gap-2 text-xs">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAllFiltered}
                  disabled={filteredProperties.length === 0 || loading}
                >
                  Select All ({filteredProperties.length})
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDeselectAll}
                  disabled={newUser.assignedProperties.length === 0}
                >
                  Deselect All
                </Button>
              </div>

              {/* Properties List */}
              <ScrollArea className="h-80 border rounded-lg">
                {loading ? (
                  <div className="p-8 text-center text-gray-500">
                    Loading properties...
                  </div>
                ) : (
                  <div className="p-3 space-y-2">
                    {filteredProperties.map((property) => (
                      <div key={property._id} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded-md">
                        <Checkbox
                          id={`new-${property._id}`}
                          checked={newUser.assignedProperties.includes(property._id)}
                          onCheckedChange={(checked) => handlePropertyToggle(property._id, checked)}
                        />
                        <Label htmlFor={`new-${property._id}`} className="text-sm font-normal flex-1 cursor-pointer">
                          <div>
                            <div className="font-medium">{property.name}</div>
                            {property.rooms && (
                              <div className="text-xs text-gray-500">{property.rooms} rooms</div>
                            )}
                          </div>
                        </Label>
                      </div>
                    ))}

                    {filteredProperties.length === 0 && !loading && (
                      <div className="text-center py-8 text-gray-500">
                        No properties found matching your criteria.
                      </div>
                    )}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => navigate('/manage-users')} disabled={submitting}>
            Cancel
          </Button>
          <Button
            onClick={handleInviteUser}
            className="bg-blue-600 hover:bg-blue-700"
            disabled={submitting}
          >
            {submitting ? 'Creating...' : 'Create User'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default InviteUser;

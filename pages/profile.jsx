import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { User, Mail, Phone, Calendar, UserPlus, Save, AlertCircle } from "lucide-react";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    phone: '',
    date_of_birth: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    caretaker_email: ''
  });
  const queryClient = useQueryClient();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        setFormData({
          phone: currentUser.phone || '',
          date_of_birth: currentUser.date_of_birth || '',
          emergency_contact_name: currentUser.emergency_contact_name || '',
          emergency_contact_phone: currentUser.emergency_contact_phone || '',
          caretaker_email: currentUser.caretaker_email || ''
        });
      } catch (error) {
        console.error("Error fetching user:", error);
      }
    };
    fetchUser();
  }, []);

  const updateProfileMutation = useMutation({
    mutationFn: (data) => base44.auth.updateMe(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
      alert('Profile updated successfully!');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    updateProfileMutation.mutate(formData);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-blue-50 via-white to-green-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">My Profile</h1>
          <p className="text-gray-600 mt-2 text-lg">Manage your personal information</p>
        </div>

        <Card className="shadow-lg border-none mb-6">
          <CardHeader className="bg-gradient-to-r from-blue-500 to-green-500 text-white rounded-t-lg p-8">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
                <User className="w-10 h-10 text-white" />
              </div>
              <div>
                <CardTitle className="text-3xl">{user.full_name}</CardTitle>
                <p className="text-white/90 text-lg mt-2 flex items-center gap-2">
                  <Mail className="w-5 h-5" />
                  {user.email}
                </p>
                <Badge className="mt-3 bg-white/20 text-white border-white/30">
                  {user.role === 'admin' ? 'Administrator' : 'User'}
                </Badge>
              </div>
            </div>
          </CardHeader>
        </Card>

        <form onSubmit={handleSubmit}>
          <Card className="shadow-lg border-none mb-6">
            <CardHeader>
              <CardTitle className="text-2xl">Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-lg flex items-center gap-2">
                    <Phone className="w-5 h-5" />
                    Phone Number
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    placeholder="Your phone number"
                    className="text-lg py-6"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date_of_birth" className="text-lg flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Date of Birth
                  </Label>
                  <Input
                    id="date_of_birth"
                    type="date"
                    value={formData.date_of_birth}
                    onChange={(e) => setFormData({...formData, date_of_birth: e.target.value})}
                    className="text-lg py-6"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-none mb-6">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <AlertCircle className="w-6 h-6 text-red-600" />
                Emergency Contact
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="emergency_contact_name" className="text-lg">
                    Contact Name
                  </Label>
                  <Input
                    id="emergency_contact_name"
                    value={formData.emergency_contact_name}
                    onChange={(e) => setFormData({...formData, emergency_contact_name: e.target.value})}
                    placeholder="Emergency contact name"
                    className="text-lg py-6"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="emergency_contact_phone" className="text-lg">
                    Contact Phone
                  </Label>
                  <Input
                    id="emergency_contact_phone"
                    type="tel"
                    value={formData.emergency_contact_phone}
                    onChange={(e) => setFormData({...formData, emergency_contact_phone: e.target.value})}
                    placeholder="Emergency contact phone"
                    className="text-lg py-6"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-none">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <UserPlus className="w-6 h-6 text-blue-600" />
                Caretaker Information
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <div className="space-y-2">
                <Label htmlFor="caretaker_email" className="text-lg">
                  Caretaker Email (Optional)
                </Label>
                <Input
                  id="caretaker_email"
                  type="email"
                  value={formData.caretaker_email}
                  onChange={(e) => setFormData({...formData, caretaker_email: e.target.value})}
                  placeholder="Caretaker's email for notifications"
                  className="text-lg py-6"
                />
                <p className="text-sm text-gray-500 mt-2">
                  Your caretaker will receive copies of medicine reminder emails
                </p>
              </div>
            </CardContent>
            <CardFooter className="p-6 bg-gray-50 rounded-b-lg flex justify-end">
              <Button
                type="submit"
                size="lg"
                disabled={updateProfileMutation.isPending}
                className="bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-lg px-8"
              >
                <Save className="w-5 h-5 mr-2" />
                {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </CardFooter>
          </Card>
        </form>
      </div>
    </div>
  );
}
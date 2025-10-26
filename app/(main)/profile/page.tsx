"use client";

import React, { useState, useEffect } from "react";
import { useUser } from "@/app/provider";
import { supabase } from "@/services/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { User, Mail, Calendar, Edit3, Save, X } from "lucide-react";
import Footer from "../_components/Footer";

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  created_at: string;
  monthly_income?: number;
  saving_target_cents?: number;
  user_description?: string;
}

const ProfilePage: React.FC = () => {
  const { user } = useUser();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    monthly_income: "",
    saving_target: "",
    user_description: ""
  });

  useEffect(() => {
    if (user?.id) {
      fetchUserProfile();
    }
  }, [user?.id]);

  const fetchUserProfile = async () => {
    try {
      setIsLoading(true);
      
      // Lấy thông tin user từ auth.users
      const { data: authUser, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        console.error("Error fetching auth user:", authError);
        return;
      }

      // Lấy thông tin profile từ bảng users
      const { data: profileData, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error("Error fetching profile:", profileError);
      }

      // Tạo profile object từ auth user và users table data
      const userProfile: UserProfile = {
        id: authUser.user.id,
        email: authUser.user.email || "",
        full_name: profileData?.full_name || authUser.user.user_metadata?.full_name || "",
        created_at: authUser.user.created_at,
        monthly_income: profileData?.monthly_income || 0,
        saving_target_cents: profileData?.saving_target_cents || 0,
        user_description: profileData?.user_description || ""
      };

      setProfile(userProfile);
      setFormData({
        full_name: userProfile.full_name,
        monthly_income: userProfile.monthly_income?.toString() || "",
        saving_target: userProfile.saving_target_cents ? (userProfile.saving_target_cents / 100).toString() : "",
        user_description: userProfile.user_description || ""
      });
    } catch (error) {
      console.error("Error fetching user profile:", error);
      toast.error("Failed to load profile");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);

      // Cập nhật user metadata
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          full_name: formData.full_name
        }
      });

      if (updateError) {
        throw updateError;
      }

      // Cập nhật hoặc tạo profile trong bảng users
      const { error: profileError } = await supabase
        .from('users')
        .upsert({
          id: user.id,
          full_name: formData.full_name,
          monthly_income: formData.monthly_income ? parseInt(formData.monthly_income) : 0,
          saving_target_cents: formData.saving_target ? parseInt(formData.saving_target) * 100 : 0,
          user_description: formData.user_description
        });

      if (profileError) {
        console.error("Error updating profile:", profileError);
        // Không throw error vì auth update đã thành công
      }

      toast.success("Profile updated successfully!");
      setIsEditing(false);
      await fetchUserProfile(); // Refresh data
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      full_name: profile?.full_name || "",
      monthly_income: profile?.monthly_income?.toString() || "",
      saving_target: profile?.saving_target_cents ? (profile.saving_target_cents / 100).toString() : "",
      user_description: profile?.user_description || ""
    });
    setIsEditing(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-blue-600 to-purple-600 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-white mx-auto mb-6"></div>
          <h1 className="text-2xl font-bold text-white mb-2">Loading...</h1>
          <p className="text-indigo-100">Loading your profile</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="py-20 lg:py-32 bg-gradient-to-br from-indigo-600 to-purple-600">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white bg-opacity-20 rounded-full mb-8">
              <User className="w-10 h-10 text-indigo-600" />
            </div>
            <h1 className="text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
              User Profile
            </h1>
            <p className="text-xl lg:text-2xl text-indigo-100 mb-8 max-w-3xl mx-auto">
              Manage your personal information and account settings
            </p>
          </div>
        </div>
      </section>

      {/* Profile Content */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <Card className="shadow-xl">
            <CardHeader className="bg-gradient-to-r from-indigo-50 to-blue-50 border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                  Profile Information
                </CardTitle>
                {!isEditing && (
                  <Button
                    onClick={() => setIsEditing(true)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    <Edit3 className="w-4 h-4 mr-2" />
                    Edit Profile
                  </Button>
                )}
              </div>
            </CardHeader>

            <CardContent className="p-8">
              {isEditing ? (
                <div className="space-y-8">
                  {/* Personal Information Section */}
                  <div className="space-y-6">
                    <div className="flex items-center space-x-3 pb-4 border-b border-gray-200">
                      <h3 className="text-xl font-semibold text-gray-800">Personal Information</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="full_name" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                          <User className="w-4 h-4 text-indigo-600" />
                          Full Name
                        </Label>
                        <Input
                          id="full_name"
                          type="text"
                          value={formData.full_name}
                          onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                          className="text-lg h-12"
                          placeholder="Enter your full name"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                          <Mail className="w-4 h-4 text-indigo-600" />
                          Email Address
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          value={profile?.email || ""}
                          disabled
                          className="text-lg h-12 bg-gray-100"
                        />
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                          Email cannot be changed
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Financial Information Section */}
                  <div className="space-y-6">
                    <div className="flex items-center space-x-3 pb-4 border-b border-gray-200">
                      <h3 className="text-xl font-semibold text-gray-800">Financial Information</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="monthly_income" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                          <span className="text-lg">💰</span>
                          Monthly Income (VND)
                        </Label>
                        <Input
                          id="monthly_income"
                          type="number"
                          value={formData.monthly_income}
                          onChange={(e) => setFormData({ ...formData, monthly_income: e.target.value })}
                          className="text-lg h-12"
                          placeholder="Enter your monthly income"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="saving_target" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                          <span className="text-lg">🎯</span>
                          Saving Target (VND)
                        </Label>
                        <Input
                          id="saving_target"
                          type="number"
                          value={formData.saving_target}
                          onChange={(e) => setFormData({ ...formData, saving_target: e.target.value })}
                          className="text-lg h-12"
                          placeholder="Enter your saving target"
                        />
                      </div>
                    </div>
                  </div>

                  {/* AI Personalization Section */}
                  <div className="space-y-6">
                    <div className="flex items-center space-x-3 pb-4 border-b border-gray-200">
                      <span className="text-2xl">🤖</span>
                      <h3 className="text-xl font-semibold text-gray-800">AI Personalization Preferences</h3>
                    </div>

                    <div className="space-y-4">
                      <Label htmlFor="user_description" className="text-sm font-semibold text-gray-700">
                        Tell AI about yourself
                      </Label>
                      <textarea
                        id="user_description"
                        value={formData.user_description}
                        onChange={(e) => setFormData({ ...formData, user_description: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-lg resize-none"
                        rows={6}
                        placeholder="Enter your preferences, skills, and information to help AI suggest better:&#10;&#10;Works with Laravel PHP and prefers existing libraries.&#10;Self-assesses coding skills at 4/10.&#10;Currently learning Azure-104 and AL Programming.&#10;Customizes ERP Dynamics 365 Business Central.&#10;Manages Azure hosting for ERP systems."
                      />
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <span className="text-lg">💡</span>
                          <div>
                            <p className="text-sm font-medium text-blue-800 mb-1">AI Understanding Tip</p>
                            <p className="text-xs text-blue-700">
                              Write complete sentences ending with periods. The system will automatically split them into individual preferences for better AI understanding.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                    <Button
                      onClick={handleCancel}
                      variant="outline"
                      disabled={isSaving}
                      className="px-6 py-3"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3"
                    >
                      {isSaving ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-8">

                  {/* Profile Information - 5 values in 3-2 layout */}
                  <div className="space-y-6">

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Left Column - 3 items */}
                      <div className="space-y-6">
                        <div className="flex items-center space-x-3">
                          <User className="w-5 h-5 text-indigo-600" />
                          <div>
                            <p className="text-sm font-medium text-gray-500">Full Name</p>
                            <p className="text-lg font-semibold text-gray-800">
                              {profile?.full_name || "Not provided"}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3">
                          <Mail className="w-5 h-5 text-indigo-600" />
                          <div>
                            <p className="text-sm font-medium text-gray-500">Email</p>
                            <p className="text-lg font-semibold text-gray-800">
                              {profile?.email || "Not provided"}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3">
                          <Calendar className="w-5 h-5 text-indigo-600" />
                          <div>
                            <p className="text-sm font-medium text-gray-500">Member Since</p>
                            <p className="text-lg font-semibold text-gray-800">
                              {profile?.created_at ? formatDate(profile.created_at) : "Not available"}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Right Column - 2 items */}
                      <div className="space-y-6">
                        <div>
                          <p className="text-sm font-medium text-gray-500">Monthly Income</p>
                          <p className="text-lg font-semibold text-gray-800">
                            {new Intl.NumberFormat('vi-VN', {
                              style: 'currency',
                              currency: 'VND',
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 0,
                            }).format(profile?.monthly_income || 0)}
                          </p>
                        </div>

                        <div>
                          <p className="text-sm font-medium text-gray-500">Saving Target</p>
                          <p className="text-lg font-semibold text-gray-800">
                            {new Intl.NumberFormat('vi-VN', {
                              style: 'currency',
                              currency: 'VND',
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 0,
                            }).format((profile?.saving_target_cents || 0) / 100)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* AI Personalization Preferences */}
                  {profile?.user_description && (
                    <div className="space-y-6">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-xl font-semibold text-gray-800">AI Personalization Preferences</h3>
                      </div>

                      <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                        <table className="w-full">
                          <thead className="bg-gray-100">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                #
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Preference / Information
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {profile.user_description
                              .split(/[\n\r]+/) // Split by newlines and carriage returns
                              .map(line => line.trim()) // Trim whitespace
                              .filter(line => line.length > 0) // Remove empty lines
                              .flatMap(line => {
                                // Split by common sentence endings but keep the punctuation
                                return line.split(/(?<=[.!?])\s+/).filter(sentence => sentence.trim().length > 0);
                              })
                              .map((sentence, index) => (
                                <tr key={index} className="hover:bg-gray-50">
                                  <td className="px-4 py-3 text-sm text-gray-500 font-medium">
                                    {index + 1}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-800">
                                    {sentence.trim()}
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default ProfilePage;

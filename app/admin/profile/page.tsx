// app/admin/profile/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  Mail,
  Phone,
  Building,
  MapPin,
  Calendar,
  Save,
  Camera,
  Loader2,
  Shield,
  Clock,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface AdminProfile {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  role: string;
  department?: string;
  position?: string;
  office?: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
  isActive: boolean;
  permissions: string[];
}

export default function AdminProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    department: "",
    position: "",
    office: "",
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  /* =========================================================
     LOAD PROFILE
  ========================================================= */

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setMessage(null);
      
      const token = localStorage.getItem("token");

      if (!token) {
        setMessage({
          type: 'error',
          text: 'Please log in to view your profile'
        });
        setLoading(false);
        return;
      }

      const response = await fetch("/api/admin/profile", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch profile: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.data) {
        throw new Error("No profile data received");
      }

      const userData = data.data;
      setProfile(userData);
      setFormData({
        fullName: userData.fullName || "",
        email: userData.email || "",
        phone: userData.phone || "",
        department: userData.department || "",
        position: userData.position || "",
        office: userData.office || "",
      });
    } catch (error) {
      console.error("Error fetching profile:", error);
      setMessage({
        type: 'error',
        text: 'Failed to load profile. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     UPDATE PROFILE
  ========================================================= */

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        setMessage({
          type: 'error',
          text: 'Please log in to update your profile'
        });
        setSaving(false);
        return;
      }

      const response = await fetch("/api/admin/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to update profile: ${response.status}`);
      }

      const data = await response.json();
      const updatedProfile = data.data || {
        ...profile,
        ...formData,
        updatedAt: new Date().toISOString()
      };

      setProfile(updatedProfile);
      
      // Update local storage
      try {
        const user = localStorage.getItem("user");
        if (user) {
          const userData = JSON.parse(user);
          userData.fullName = formData.fullName;
          userData.email = formData.email;
          localStorage.setItem("user", JSON.stringify(userData));
        }
      } catch (e) {
        console.error("Error updating local storage:", e);
      }

      setMessage({
        type: 'success',
        text: 'Profile updated successfully!'
      });

      setIsEditing(false);

    } catch (error: any) {
      console.error("Error updating profile:", error);
      setMessage({
        type: 'error',
        text: error.message || 'Failed to update profile. Please try again.'
      });
    } finally {
      setSaving(false);
    }
  };

  /* =========================================================
     CHANGE PASSWORD
  ========================================================= */

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({
        type: 'error',
        text: 'Passwords do not match'
      });
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setMessage({
        type: 'error',
        text: 'Password must be at least 8 characters'
      });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        setMessage({
          type: 'error',
          text: 'Please log in to change your password'
        });
        setSaving(false);
        return;
      }

      const response = await fetch("/api/admin/profile/password", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      if (!response.ok) {
        let errorMessage = "Failed to change password";
        try {
          const error = await response.json();
          errorMessage = error.message || error.error || errorMessage;
        } catch (e) {
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      setMessage({
        type: 'success',
        text: 'Password changed successfully!'
      });

    } catch (error: any) {
      console.error("Error changing password:", error);
      setMessage({
        type: 'error',
        text: error.message || 'Failed to change password. Please try again.'
      });
    } finally {
      setSaving(false);
    }
  };

  /* =========================================================
     GET INITIALS
  ========================================================= */

  const getInitials = () => {
    if (!formData.fullName) return "U";
    return formData.fullName
      .split(" ")
      .filter(Boolean)
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  /* =========================================================
     FORMAT DATE
  ========================================================= */

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (e) {
      return dateString;
    }
  };

  /* =========================================================
     HANDLE INPUT CHANGE
  ========================================================= */

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
    setIsEditing(true);
  };

  /* =========================================================
     RENDER
  ========================================================= */

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-red-600" />
          <p className="mt-4 text-sm text-zinc-500">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-5xl py-6 px-4 sm:px-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
          My Profile
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          View and manage your account information
        </p>
      </div>

      {/* Message */}
      {message && (
        <div className={`rounded-lg p-4 flex items-start gap-3 mb-6 ${
          message.type === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-700 dark:bg-green-950/30 dark:border-green-800 dark:text-green-400' 
            : 'bg-red-50 border border-red-200 text-red-700 dark:bg-red-950/30 dark:border-red-800 dark:text-red-400'
        }`}>
          <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium">{message.type === 'success' ? 'Success' : 'Error'}</p>
            <p className="text-sm mt-0.5">{message.text}</p>
          </div>
        </div>
      )}

      {/* Profile Card */}
      <Card className="mb-6 border shadow-sm">
        <CardHeader className="p-6">
          <div className="flex items-center gap-6">
            <div className="relative flex-shrink-0">
              <Avatar className="h-24 w-24 ring-4 ring-red-100 dark:ring-red-900/30">
                <AvatarImage src={profile?.avatar} />
                <AvatarFallback className="text-2xl font-bold bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              <Button
                variant="secondary"
                size="icon"
                className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full border-2 border-white bg-zinc-100 hover:bg-zinc-200 dark:border-zinc-950 dark:bg-zinc-800 dark:hover:bg-zinc-700"
              >
                <Camera className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">
                {formData.fullName || "User"}
              </h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
                {profile?.position || "No position set"}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="gap-1">
                  <Shield className="h-3 w-3" />
                  {profile?.role || "User"}
                </Badge>
                {profile?.isActive && (
                  <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                    <CheckCircle className="mr-1 h-3 w-3" />
                    Active
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList className="w-full grid grid-cols-2 max-w-[400px]">
          <TabsTrigger value="profile" className="gap-2">
            <User className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Shield className="h-4 w-4" />
            Security
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <Card className="border shadow-sm">
            <form onSubmit={handleUpdateProfile}>
              <CardHeader className="p-6 pb-4">
                <CardTitle className="text-lg">Personal Information</CardTitle>
                <CardDescription className="text-sm">
                  Update your personal information and contact details
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4 p-6 pt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <Label htmlFor="fullName" className="text-sm font-medium">Full Name *</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                      <Input
                        id="fullName"
                        value={formData.fullName}
                        onChange={handleInputChange}
                        className="pl-9 h-10 text-sm w-full"
                        placeholder="Enter your full name"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-sm font-medium">Email Address *</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="pl-9 h-10 text-sm w-full"
                        placeholder="your.email@example.com"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="phone" className="text-sm font-medium">Phone Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="pl-9 h-10 text-sm w-full"
                        placeholder="+1 (555) 000-0000"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="department" className="text-sm font-medium">Department</Label>
                    <div className="relative">
                      <Building className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                      <Input
                        id="department"
                        value={formData.department}
                        onChange={handleInputChange}
                        className="pl-9 h-10 text-sm w-full"
                        placeholder="e.g., IT Department"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="position" className="text-sm font-medium">Position</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                      <Input
                        id="position"
                        value={formData.position}
                        onChange={handleInputChange}
                        className="pl-9 h-10 text-sm w-full"
                        placeholder="e.g., System Administrator"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="office" className="text-sm font-medium">Office Location</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                      <Input
                        id="office"
                        value={formData.office}
                        onChange={handleInputChange}
                        className="pl-9 h-10 text-sm w-full"
                        placeholder="e.g., Main Office, Floor 3"
                      />
                    </div>
                  </div>
                </div>

                <Separator className="my-2" />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-lg bg-zinc-50 p-4 dark:bg-zinc-900/50">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-zinc-400" />
                    <span className="text-zinc-500">Joined:</span>
                    <span className="font-medium text-zinc-900 dark:text-white truncate">
                      {formatDate(profile?.createdAt)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-zinc-400" />
                    <span className="text-zinc-500">Last Login:</span>
                    <span className="font-medium text-zinc-900 dark:text-white truncate">
                      {formatDate(profile?.lastLogin)}
                    </span>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="flex justify-end gap-3 p-6 pt-0">
                {isEditing && (
                  <Button
                    type="button"
                    variant="outline"
                    className="h-10 px-6"
                    onClick={() => {
                      if (profile) {
                        setFormData({
                          fullName: profile.fullName || "",
                          email: profile.email || "",
                          phone: profile.phone || "",
                          department: profile.department || "",
                          position: profile.position || "",
                          office: profile.office || "",
                        });
                        setIsEditing(false);
                      }
                    }}
                  >
                    Cancel
                  </Button>
                )}
                <Button type="submit" disabled={saving} className="h-10 px-6">
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      {isEditing ? 'Save Changes' : 'Edit Profile'}
                    </>
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security">
          <Card className="border shadow-sm">
            <form onSubmit={handleChangePassword}>
              <CardHeader className="p-6 pb-4">
                <CardTitle className="text-lg">Change Password</CardTitle>
                <CardDescription className="text-sm">
                  Update your password to keep your account secure
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4 p-6 pt-0">
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="currentPassword" className="text-sm font-medium">Current Password *</Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={(e) =>
                        setPasswordData({
                          ...passwordData,
                          currentPassword: e.target.value,
                        })
                      }
                      className="h-10 text-sm w-full"
                      placeholder="Enter your current password"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="newPassword" className="text-sm font-medium">New Password *</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) =>
                        setPasswordData({
                          ...passwordData,
                          newPassword: e.target.value,
                        })
                      }
                      className="h-10 text-sm w-full"
                      placeholder="Enter your new password"
                      required
                    />
                    <p className="text-xs text-zinc-500">
                      Password must be at least 8 characters long
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="confirmPassword" className="text-sm font-medium">Confirm New Password *</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) =>
                        setPasswordData({
                          ...passwordData,
                          confirmPassword: e.target.value,
                        })
                      }
                      className="h-10 text-sm w-full"
                      placeholder="Confirm your new password"
                      required
                    />
                  </div>
                </div>

                <div className="rounded-lg bg-yellow-50 p-4 text-sm text-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800">
                  <p className="font-semibold">Password Requirements:</p>
                  <ul className="mt-1.5 list-inside list-disc space-y-1 text-xs">
                    <li>At least 8 characters long</li>
                    <li>Contains uppercase and lowercase letters</li>
                    <li>Contains at least one number</li>
                    <li>Contains at least one special character</li>
                  </ul>
                </div>
              </CardContent>

              <CardFooter className="flex justify-end gap-3 p-6 pt-0">
                <Button
                  type="button"
                  variant="outline"
                  className="h-10 px-6"
                  onClick={() => {
                    setPasswordData({
                      currentPassword: "",
                      newPassword: "",
                      confirmPassword: "",
                    });
                  }}
                >
                  Clear
                </Button>
                <Button type="submit" disabled={saving} className="h-10 px-6">
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Changing...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Change Password
                    </>
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
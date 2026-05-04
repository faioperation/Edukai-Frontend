"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPatch, apiPost } from "@/lib/api";
import { toast } from "react-hot-toast";
import { Loader2, User, Mail, Phone, MapPin, Save, Shield, Lock, KeyRound, Eye, EyeOff } from "lucide-react";
import { motion } from "framer-motion";

export default function SettingsPage() {
  const queryClient = useQueryClient();

  // Fetch Profile
  const { data: profileResponse, isLoading, isError } = useQuery({
    queryKey: ["adminProfile"],
    queryFn: () => apiGet("/users/profile"), 
  });

  const profile = profileResponse?.data || {};

  // Form States
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    contactNo: "",
    gender: "",
    country: "",
  });

  const [passwordData, setPasswordData] = useState({
    oldPassword: "",
    newPassword: "",
  });

  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  useEffect(() => {
    if (profileResponse?.data) {
      setFormData({
        firstName: profile.firstName || "",
        lastName: profile.lastName || "",
        contactNo: profile.contactNo || "",
        gender: profile.gender || "",
        country: profile.country || "",
      });
    }
  }, [profileResponse, profile]);

  // Mutations
  const updateProfileMutation = useMutation({
    mutationFn: (updatedData) => apiPatch("/users/update-profile", updatedData),
    onSuccess: () => {
      toast.success("Profile updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["adminProfile"] });
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to update profile.");
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: (passData) => apiPost("/users/change-password", passData),
    onSuccess: () => {
      toast.success("Password changed successfully!");
      setPasswordData({ oldPassword: "", newPassword: "" });
    },
    onError: (error) => {
      let msg = error?.data?.message || error?.message;
      if (msg === "API not found" || msg?.includes("API not found") || error?.status === 404) {
        msg = "Incorrect current password.";
      }
      toast.error(msg || "Failed to change password.");
    },
  });

  // Handlers
  const handleProfileChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handlePasswordChange = (e) => {
    setPasswordData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleProfileSubmit = (e) => {
    e.preventDefault();
    updateProfileMutation.mutate(formData);
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (passwordData.oldPassword === passwordData.newPassword) {
      toast.error("New password must be different from the old password.");
      return;
    }
    if (passwordData.newPassword.length < 6) {
      toast.error("New password must be at least 6 characters.");
      return;
    }
    changePasswordMutation.mutate(passwordData);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex min-h-[400px] w-full flex-col items-center justify-center text-red-500">
        <Shield className="mb-2 h-10 w-10 opacity-50" />
        <p className="text-lg font-medium">Failed to load profile</p>
        <p className="text-sm opacity-80">Please try refreshing the page.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl p-4 md:p-8">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-8"
      >
        <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          Admin Settings
        </h2>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Manage your personal profile and account security.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Profile Information Form */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="lg:col-span-2"
        >
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/50">
            <div className="border-b border-slate-200 bg-slate-50/50 px-6 py-5 dark:border-slate-800 dark:bg-slate-900/50">
              <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white">
                <User className="h-5 w-5 text-indigo-500" />
                Profile Information
              </h3>
            </div>

            <form onSubmit={handleProfileSubmit} className="p-6 md:p-8">
              <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2">
                
                {/* First Name */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    First Name
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleProfileChange}
                    required
                    className="w-full rounded-xl border border-slate-300 bg-transparent px-4 py-2.5 text-sm transition-colors placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:focus:border-indigo-500"
                    placeholder="e.g. Super"
                  />
                </div>

                {/* Last Name */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Last Name
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleProfileChange}
                    required
                    className="w-full rounded-xl border border-slate-300 bg-transparent px-4 py-2.5 text-sm transition-colors placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:focus:border-indigo-500"
                    placeholder="e.g. Admin"
                  />
                </div>

                {/* Email - Readonly */}
                <div className="space-y-2 sm:col-span-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      value={profile.email || ""}
                      disabled
                      className="w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 pl-10 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-400"
                    />
                  </div>
                </div>

                {/* Contact Number */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Contact Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      name="contactNo"
                      value={formData.contactNo}
                      onChange={handleProfileChange}
                      className="w-full rounded-xl border border-slate-300 bg-transparent px-4 py-2.5 pl-10 text-sm transition-colors placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:focus:border-indigo-500"
                      placeholder="e.g. +44 20 7123 4567"
                    />
                  </div>
                </div>

                {/* Gender */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Gender
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleProfileChange}
                    className="w-full appearance-none rounded-xl border border-slate-300 bg-transparent px-4 py-2.5 text-sm transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-950 dark:focus:border-indigo-500"
                  >
                    <option value="" disabled>Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* Country */}
                <div className="space-y-2 sm:col-span-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Country
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      name="country"
                      value={formData.country}
                      onChange={handleProfileChange}
                      className="w-full rounded-xl border border-slate-300 bg-transparent px-4 py-2.5 pl-10 text-sm transition-colors placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:focus:border-indigo-500"
                      placeholder="e.g. UK"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-8 flex items-center justify-end border-t border-slate-200 pt-6 dark:border-slate-800">
                <button
                  type="submit"
                  disabled={updateProfileMutation.isPending}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70 dark:focus:ring-offset-slate-950"
                >
                  {updateProfileMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  <span>{updateProfileMutation.isPending ? "Saving..." : "Save Profile"}</span>
                </button>
              </div>
            </form>
          </div>
        </motion.div>

        {/* Change Password Form */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="lg:col-span-1"
        >
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/50">
            <div className="border-b border-slate-200 bg-slate-50/50 px-6 py-5 dark:border-slate-800 dark:bg-slate-900/50">
              <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white">
                <Shield className="h-5 w-5 text-indigo-500" />
                Change Password
              </h3>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-6 p-6 md:p-8">
              
              {/* Old Password */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Current Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showOldPassword ? "text" : "password"}
                    name="oldPassword"
                    value={passwordData.oldPassword}
                    onChange={handlePasswordChange}
                    required
                    className="w-full rounded-xl border border-slate-300 bg-transparent px-4 py-2.5 pl-10 pr-10 text-sm transition-colors placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:focus:border-indigo-500"
                    placeholder="Enter current password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowOldPassword(!showOldPassword)}
                    className="absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  >
                    {showOldPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  New Password
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showNewPassword ? "text" : "password"}
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    required
                    minLength={6}
                    className="w-full rounded-xl border border-slate-300 bg-transparent px-4 py-2.5 pl-10 pr-10 text-sm transition-colors placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:focus:border-indigo-500"
                    placeholder="Enter new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  >
                    {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 mt-6">
                <button
                  type="submit"
                  disabled={changePasswordMutation.isPending || !passwordData.oldPassword || !passwordData.newPassword}
                  className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 dark:focus:ring-white dark:focus:ring-offset-slate-950"
                >
                  {changePasswordMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Shield className="h-4 w-4" />
                  )}
                  <span>{changePasswordMutation.isPending ? "Updating..." : "Update Password"}</span>
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

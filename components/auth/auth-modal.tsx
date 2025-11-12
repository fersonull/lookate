"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MapPin, Mail, Lock, User, Eye, EyeOff, CheckCircle } from "lucide-react";
import { ErrorMessage, FieldError } from "@/components/ui/error-message";

interface AuthModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AuthModal({ isOpen, onOpenChange }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    confirmPassword: ""
  });

  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    name?: string;
    confirmPassword?: string;
    general?: string;
  }>({});

  const [validationErrors, setValidationErrors] = useState<any>(null);
  const [successMessage, setSuccessMessage] = useState<string>("");

  const clearErrors = () => {
    setErrors({});
    setValidationErrors(null);
    setSuccessMessage("");
  };

  const resetForm = () => {
    setFormData({ email: "", password: "", name: "", confirmPassword: "" });
    clearErrors();
    setShowPassword(false);
  };

  // Reset form when modal opens/closes or when switching between login/signup
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      resetForm();
    }
    onOpenChange(open);
  };

  // Reset form when switching between login/signup
  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
    resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    clearErrors();

    try {
      if (isLogin) {
        // Handle sign in with NextAuth
        const { signIn } = await import("next-auth/react");
        const result = await signIn("credentials", {
          email: formData.email,
          password: formData.password,
          redirect: false,
        });

        if (result?.error) {
          console.error("Sign in error:", result.error);

          // Parse different error types
          if (result.error === "CredentialsSignin") {
            setErrors({
              general: "Invalid email or password. Please check your credentials and try again."
            });
          } else if (result.error.includes("email")) {
            setErrors({
              email: "Please check your email address."
            });
          } else if (result.error.includes("password")) {
            setErrors({
              password: "Please check your password."
            });
          } else {
            setErrors({
              general: "Sign in failed. Please try again."
            });
          }
        } else {
          // Success - show brief success message then close
          setSuccessMessage("Welcome back! Redirecting...");
          setTimeout(() => {
            resetForm();
            onOpenChange(false);
          }, 1000);
        }
      } else {
        // Handle sign up
        const response = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formData.name,
            email: formData.email,
            password: formData.password,
            confirmPassword: formData.confirmPassword,
          }),
        });

        const data = await response.json();

        if (response.ok) {
          // Sign up successful, now sign in
          const { signIn } = await import("next-auth/react");
          const signInResult = await signIn("credentials", {
            email: formData.email,
            password: formData.password,
            redirect: false,
          });

          if (signInResult?.error) {
            setErrors({
              general: "Account created but sign in failed. Please try signing in manually."
            });
          } else {
            // Success - show success message then close
            setSuccessMessage("Account created successfully! Welcome to lookate!");
            setTimeout(() => {
              resetForm();
              onOpenChange(false);
            }, 1500);
          }
        } else {
          console.error("Sign up error:", data.error);

          // Handle validation errors
          if (data.details) {
            setValidationErrors(data.details);

            // Extract specific field errors
            const newErrors: any = {};
            if (data.details.name?._errors?.length > 0) {
              newErrors.name = data.details.name._errors[0];
            }
            if (data.details.email?._errors?.length > 0) {
              newErrors.email = data.details.email._errors[0];
            }
            if (data.details.password?._errors?.length > 0) {
              newErrors.password = data.details.password._errors[0];
            }
            if (data.details.confirmPassword?._errors?.length > 0) {
              newErrors.confirmPassword = data.details.confirmPassword._errors[0];
            }
            setErrors(newErrors);
          } else {
            // Handle general errors
            if (data.error.includes("already exists")) {
              setErrors({
                email: "An account with this email already exists. Try signing in instead."
              });
            } else {
              setErrors({
                general: data.error
              });
            }
          }
        }
      }
    } catch (error) {
      console.error("Authentication error:", error);
      setErrors({
        general: "Network error. Please check your connection and try again."
      });
    }

    setIsLoading(false);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear field error when user starts typing
    if (errors[field as keyof typeof errors]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px] z-10002 bg-background border shadow-xl opacity-100 backdrop-blur-none">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="h-6 w-6 text-primary" />
            <DialogTitle className="text-2xl">lookate</DialogTitle>
          </div>
          <DialogDescription>
            {isLogin
              ? "Sign in to see where your team members are located"
              : "Join lookate to share your location with your team"
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Success Message */}
          {successMessage && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-green-50 border border-green-200 dark:bg-green-950 dark:border-green-800">
              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 shrink-0" />
              <p className="text-sm text-green-600 dark:text-green-400">{successMessage}</p>
            </div>
          )}

          {/* General Error Message */}
          <ErrorMessage message={errors.general || ""} />

          {!isLogin && (
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={`pl-10 ${errors.name ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                  required={!isLogin}
                  disabled={isLoading || !!successMessage}
                />
              </div>
              <FieldError error={errors.name} />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className={`pl-10 ${errors.email ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                required
                disabled={isLoading || !!successMessage}
              />
            </div>
            <FieldError error={errors.email} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                className={`pl-10 pr-10 ${errors.password ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                required
                disabled={isLoading || !!successMessage}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>
            <FieldError error={errors.password} />
          </div>

          {!isLogin && (
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  className={`pl-10 ${errors.confirmPassword ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                  required={!isLogin}
                  disabled={isLoading || !!successMessage}
                />
              </div>
              <FieldError error={errors.confirmPassword} />
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading || !!successMessage}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                {isLogin ? "Signing in..." : "Creating account..."}
              </div>
            ) : successMessage ? (
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                "Success!"
              </div>
            ) : (
              isLogin ? "Sign In" : "Create Account"
            )}
          </Button>

          <div className="text-center">
            <Button
              type="button"
              variant="ghost"
              onClick={toggleAuthMode}
              className="text-sm"
            >
              {isLogin
                ? "Don't have an account? Sign up"
                : "Already have an account? Sign in"
              }
            </Button>
          </div>
        </form>

        {isLogin && (
          <div className="mt-4 text-center">
            <p className="text-xs text-muted-foreground">
              By signing in, you agree to share your approximate location with team members
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
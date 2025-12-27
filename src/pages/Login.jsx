import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { usePropertyStore } from "@/store/propertyStore";
import { api } from "@/store/api";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [showForgotSent, setShowForgotSent] = useState(false);

  const navigate = useNavigate();
  const login = useAuthStore(state => state.login);
  const resetPropertyStore = usePropertyStore(state => state.reset);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await api.post('auth/login', {
        email,
        password
      }, { auth: false }); // No auth required for login

      // Store token and user data
      const token = response.data?.access_token;
      const userData = response.data?.user;

      // Reset property store to clear any previous user's data
      resetPropertyStore();
      login(token, userData);

      // Redirect based on role - employees go to upload page, others to dashboard
      if (userData?.role === 'employee') {
        navigate("/upload-daily-reports");
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  function handleForgotSubmit(e) {
    e.preventDefault();
    e.stopPropagation();
    setShowForgot(false);
    setShowForgotSent(true);
    setTimeout(() => setShowForgotSent(false), 2500);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-900 to-slate-800">
      <Card className="w-full max-w-md shadow-lg border-0">
        <CardHeader className="text-center flex flex-col items-center space-y-3 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-t-lg">
          <div className="flex flex-col items-center mt-2 mb-2">
            <img
              src="/lovable-uploads/93f720ee-4579-442c-898f-915bbafcab8a.png"
              alt="V-Dash Logo"
              style={{ width: 200, height: "auto" }}
              className="rounded-md drop-shadow-lg mb-2"
            />
            <CardTitle className="text-2xl font-bold text-white drop-shadow-md">
              V-Dash Login
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          {error && (
            <div className="text-red-600 text-sm text-center bg-red-50 p-2 rounded">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email / Username</Label>
              <Input
                id="email"
                type="text"
                placeholder="Enter your email or username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <div className="text-center">
            <Dialog open={showForgot} onOpenChange={setShowForgot}>
              <DialogTrigger asChild>
                <Button variant="link" className="text-sm text-gray-600">
                  Forgot password?
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Reset Password</DialogTitle>
                  <DialogDescription>
                    Enter your email address and we'll send you a link to reset your password.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleForgotSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="forgot-email">Email</Label>
                    <Input
                      id="forgot-email"
                      type="email"
                      placeholder="Enter your email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      required
                    />
                  </div>
                  <DialogFooter>
                    <Button type="submit">Send Reset Link</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {showForgotSent && (
            <div className="text-center text-green-600 text-sm bg-green-50 p-2 rounded">
              Password reset email sent!
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;

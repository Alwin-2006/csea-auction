import { useEffect, useState } from 'react'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "./ui/card"
import { Button } from "./ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@radix-ui/react-label"
import { useNavigate } from "react-router-dom"
import { useUserStore } from "../store.ts";

const API_URL = import.meta.env.VITE_API_URL;

function Login() {
  const nav = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const setUser = useUserStore((state) => state.setUser);
  const user = useUserStore((state) => state.user);

  const handleTraditionalLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Login failed");
        return;
      }

      localStorage.setItem("token", data.token);
      console.log("Token saved");

      setUser(data.user);
      console.log("User store after setUser:", useUserStore.getState().user);
      if (localStorage.getItem("token")) nav("/");

    } catch (err) {
      console.error("Login error:", err);
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
    
  }

  useEffect(() => {
    if (user) {
      nav("/"); 
    }
  }, [user]);
  
  return (
    <div className="w-full flex my-20 justify-center items-center">
      <Card className="w-full max-w-sm bg-gray-300">
        <CardHeader>
          <CardTitle>Login to your account</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleTraditionalLogin}>
            <div className="flex flex-col gap-6">
              {error && <div className="text-red-500 text-sm">{error}</div>}
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                  <a
                    href="#"
                    className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                  >
                    Forgot your password?
                  </a>
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="mt-6">
              <Button
                type="submit"
                className="w-full bg-amber-500 cursor-pointer"
                disabled={loading}
              >
                {loading ? 'Loading...' : 'Login'}
              </Button>
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex-col gap-4">
          <div className="w-full text-center text-sm text-gray-600 mb-2">
            Or continue with
          </div>
          <a href={`${API_URL}/api/auth/google`} className="w-full">
            <Button variant="outline" className="w-full">
              Sign in with Google
            </Button>
          </a>
          <div className="text-sm text-center">
            Don't have an account?{' '}
            <Button
              variant="link"
              onClick={() => nav('/sign-up')}
              className="p-0"
            >
              Sign Up
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}

export default Login

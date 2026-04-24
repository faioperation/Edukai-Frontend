"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FaEye, FaEyeSlash } from "react-icons/fa";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleLogin() {
    if (!email.trim() || !password) {
      setError("Please enter email and password");
      return;
    }

    router.push("/dashboard");
  }

  function onSubmit(e) {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    handleLogin();
    setIsSubmitting(false);
  }

  return (
    <main className="flex min-h-[calc(100vh-0px)] items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border bg-card p-6 shadow-sm">
        <div className="text-center">
          <div className="text-3xl font-semibold tracking-tight text-primary dark:text-primary">
            Edukai
          </div>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight text-primary dark:text-primary">
            Login to Account
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Please enter your email and password to continue
          </p>
        </div>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="email">
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11 w-full rounded-md border bg-background px-3 outline-none focus:ring-2 focus:ring-primary/30 dark:focus:ring-primary/40"
              placeholder="you@example.com"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="password">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11 w-full rounded-md border bg-background px-3 pr-11 outline-none focus:ring-2 focus:ring-primary/30 dark:focus:ring-primary/40"
                placeholder="Enter your password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute inset-y-0 right-0 inline-flex w-11 items-center justify-center text-muted-foreground hover:text-foreground"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4">
            <span className="text-sm text-muted-foreground">Single user login</span>
            <a
              href="#"
              onClick={(e) => e.preventDefault()}
              className="text-sm text-primary hover:underline dark:text-primary"
            >
              Forgot Password?
            </a>
          </div>

          {error ? (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="h-11 w-full rounded-md cursor-pointer bg-primary font-medium text-primary-foreground hover:opacity-95 disabled:opacity-60 dark:bg-primary"
          >
            {isSubmitting ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </main>
  );
}


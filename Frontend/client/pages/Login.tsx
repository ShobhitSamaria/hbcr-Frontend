import { useState, type FormEvent } from "react";
import {
  AlertCircle,
  Eye,
  EyeOff,
  HeartPulse,
  Loader2,
  Lock,
  LogIn,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/auth";

export default function Login() {
  const { session, login } = useAuth();
  const location = useLocation();
  const from =
    (location.state as { from?: { pathname: string } } | null)?.from
      ?.pathname ?? "/";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{
    username?: string;
    password?: string;
  }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Already signed in — send them to the dashboard (or the page they came from).
  if (session?.token) {
    return <Navigate to={from} replace />;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const errors: { username?: string; password?: string } = {};
    if (!username.trim()) errors.username = "Hospital code / username is required";
    if (!password) errors.password = "Password is required";
    setFieldErrors(errors);
    setFormError(null);
    if (Object.keys(errors).length > 0) return;

    setSubmitting(true);
    try {
      await login(username.trim(), password);
      // `session` updates -> the declarative <Navigate to={from}> above fires.
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Unable to sign in. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#0b6b79] via-[#0e7f8c] to-[#103e54] p-4 font-sans">
      <div className="w-full max-w-[420px]">
        {/* Brand */}
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="relative mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-white shadow-lg backdrop-blur">
            <HeartPulse size={28} strokeWidth={2.5} />
            <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-[#0b6b79] bg-[#f6b73c]" />
          </div>
          <p className="text-lg font-extrabold tracking-tight text-white">
            Rajasthan HBCR Cancer Registry Portal
          </p>
          <p className="mt-1.5 text-[11px] font-semibold uppercase tracking-[.18em] text-white/70">
            Hospital Login
          </p>
        </div>

        <div className="rounded-2xl bg-white p-7 shadow-2xl shadow-teal-950/30">
          <h1 className="text-lg font-extrabold tracking-tight text-[#103e54]">
            Sign in to your account
          </h1>
          <p className="mt-1 text-[12px] leading-relaxed text-[#78919a]">
            Enter the hospital code and password provided by the registry office.
          </p>

          {formError && (
            <div
              role="alert"
              className="mt-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-[12px] font-semibold text-red-700"
            >
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-5 space-y-4" noValidate>
            <div>
              <label
                htmlFor="username"
                className="mb-1.5 block text-[12px] font-bold text-[#103e54]"
              >
                Hospital Code / Username
              </label>
              <div className="relative">
                <UserRound
                  size={17}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9db2b9]"
                />
                <input
                  id="username"
                  type="text"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. hospital1"
                  className={`h-11 w-full rounded-xl border bg-[#f8fbfb] pl-10 pr-3.5 text-sm text-[#103e54] outline-none transition placeholder:text-[#b3c3c9] focus:bg-white ${
                    fieldErrors.username
                      ? "border-red-300 focus:ring-2 focus:ring-red-200"
                      : "border-[#dcebef] focus:border-[#0b7d87] focus:ring-2 focus:ring-teal-100"
                  }`}
                />
              </div>
              {fieldErrors.username && (
                <p className="mt-1.5 text-[11px] font-semibold text-red-600">
                  {fieldErrors.username}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-[12px] font-bold text-[#103e54]"
              >
                Password
              </label>
              <div className="relative">
                <Lock
                  size={17}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9db2b9]"
                />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className={`h-11 w-full rounded-xl border bg-[#f8fbfb] pl-10 pr-11 text-sm text-[#103e54] outline-none transition placeholder:text-[#b3c3c9] focus:bg-white ${
                    fieldErrors.password
                      ? "border-red-300 focus:ring-2 focus:ring-red-200"
                      : "border-[#dcebef] focus:border-[#0b7d87] focus:ring-2 focus:ring-teal-100"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-[#8aa0a7] transition hover:bg-slate-100 hover:text-[#103e54]"
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
              {fieldErrors.password && (
                <p className="mt-1.5 text-[11px] font-semibold text-red-600">
                  {fieldErrors.password}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#0b6b79] text-sm font-bold text-white shadow-lg shadow-teal-900/20 transition hover:bg-[#0a5d69] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {submitting ? (
                <>
                  <Loader2 size={17} className="animate-spin" />
                  Signing in…
                </>
              ) : (
                <>
                  <LogIn size={17} />
                  Login
                </>
              )}
            </button>
          </form>

          <div className="mt-5 flex items-center justify-center gap-1.5 text-[11px] font-semibold text-[#8aa0a7]">
            <ShieldCheck size={13} className="text-[#0b7d87]" />
            Secure &amp; encrypted access
          </div>
        </div>

        <p className="mt-6 text-center text-[11px] font-medium text-white/60">
          Authorized registry staff only. All activity is logged.
        </p>
      </div>
    </div>
  );
}

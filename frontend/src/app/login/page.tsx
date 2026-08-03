"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

const ROLE_OPTIONS = [
  { value: "admin", label: "Admin" },
  { value: "wali_kelas", label: "Wali Kelas" },
  { value: "guru_bk", label: "Guru BK" },
];

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("admin");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await api.post("/auth/login", { username, password });
      if (response.data.token) {
        const user = response.data.user;

        // Validate that the selected role matches the actual user role
        if (user.role !== role) {
          setError(`Akun ini bukan ${ROLE_OPTIONS.find(r => r.value === role)?.label}. Silakan pilih peran yang sesuai.`);
          setLoading(false);
          return;
        }

        localStorage.setItem("token", response.data.token);
        localStorage.setItem("user", JSON.stringify(user));

        if (user.role === "wali_kelas") {
          router.push("/dashboard-wali");
        } else if (user.role === "guru_bk") {
          router.push("/dashboard-bk");
        } else {
          router.push("/dashboard");
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Username atau password salah.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-slate-900 p-4 transition-colors duration-300">
      <div className="w-full max-w-sm bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-gray-200 dark:border-slate-700 overflow-hidden transition-colors duration-300">
        {/* Card Header */}
        <div className="flex flex-col items-center pt-10 pb-6 px-8 border-b border-gray-100 dark:border-slate-700">
          <img
            src="/logo.png"
            alt="Logo MTS Islam Arridho"
            className="w-20 h-20 object-contain mb-4"
            onError={(e) => {
              // Fallback graduation cap SVG if no logo
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
          <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-wide text-center transition-colors">
            MTS ISLAM ARRIDHO
          </h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1 font-medium transition-colors">prediksi risiko drop-out</p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="px-8 py-6 space-y-4">
          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg text-sm text-center">
              {error}
            </div>
          )}

          {/* Username */}
          <div>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2.5 bg-white dark:bg-slate-900/50 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all text-sm"
              placeholder="Username"
              required
              autoComplete="username"
            />
          </div>

          {/* Password */}
          <div>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 bg-white dark:bg-slate-900/50 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all text-sm"
              placeholder="Password"
              required
              autoComplete="current-password"
            />
          </div>

          {/* Login Sebagai */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide transition-colors">
              Login Sebagai
            </label>
            <div className="flex gap-2">
              {ROLE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setRole(option.value)}
                  className={`flex-1 py-2 px-2 rounded-lg text-xs font-semibold border transition-all ${
                    role === option.value
                      ? "bg-blue-600 border-blue-600 text-white shadow-sm"
                      : "bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600 text-gray-600 dark:text-slate-300 hover:border-blue-400 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 mt-2 bg-gray-800 dark:bg-blue-600 hover:bg-gray-900 dark:hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors text-sm disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "Memproses..." : "login"}
          </button>
        </form>
      </div>
    </div>
  );
}

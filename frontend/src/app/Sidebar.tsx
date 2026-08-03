"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  GraduationCap,
  Users,
  Activity,
  Database,
  GitBranch,
  FlaskConical,
  ClipboardList,
  LogOut,
  ShieldCheck,
  UserCheck,
  AlertTriangle,
  MessageSquare,
  FileText,
  Bell,
  BarChart2,
  BrainCircuit,
} from "lucide-react";

// ─────────────────────────────────────────────
// NavItem: individual menu link
// ─────────────────────────────────────────────
function NavItem({
  href,
  icon,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
}) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(href + "/");

  return (
    <Link
      href={href}
      className={`flex items-center gap-3 py-2.5 px-3 rounded-xl transition-all duration-200 group ${
        isActive
          ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
          : "text-slate-400 hover:text-white hover:bg-slate-800"
      }`}
    >
      <span className={`shrink-0 transition-transform group-hover:scale-110 ${isActive ? "text-white" : ""}`}>
        {icon}
      </span>
      <span className="text-sm font-medium leading-tight hidden lg:block">{label}</span>
    </Link>
  );
}

// ─────────────────────────────────────────────
// SectionLabel: sub-group header inside nav
// ─────────────────────────────────────────────
function SectionLabel({ label }: { label: string }) {
  return (
    <div className="mt-5 mb-1.5 px-3">
      <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest hidden lg:block">
        {label}
      </p>
      <div className="block lg:hidden border-t border-slate-800 my-1" />
    </div>
  );
}

// ─────────────────────────────────────────────
// ADMIN MENU — Sesuai Use Case Diagram
// ─────────────────────────────────────────────
function AdminMenu() {
  return (
    <>
      <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-3 px-3 hidden lg:block">
        Menu Admin
      </p>
      <nav className="flex flex-col gap-0.5">

        {/* DASHBOARD */}
        <NavItem href="/dashboard" icon={<LayoutDashboard className="w-5 h-5" />} label="Dashboard Admin" />

        {/* KELOLA DATA */}
        <SectionLabel label="Kelola Data" />
        <NavItem href="/admin" icon={<ShieldCheck className="w-5 h-5" />} label="Kelola Admin" />
        <NavItem href="/admin/wali-kelas" icon={<Users className="w-5 h-5" />} label="Wali Kelas" />
        <NavItem href="/admin/guru-bk" icon={<UserCheck className="w-5 h-5" />} label="Guru BK" />
        <NavItem href="/admin/siswa" icon={<GraduationCap className="w-5 h-5" />} label="Kelola Data Siswa" />

        {/* HASIL & PREDIKSI */}
        <SectionLabel label="Hasil Analisis & Prediksi" />
        <NavItem href="/admin/hasil-preprocessing" icon={<FlaskConical className="w-5 h-5" />} label="Hasil Preprocessing Data" />
        <NavItem href="/admin/hasil-c45" icon={<GitBranch className="w-5 h-5" />} label="Hasil C4.5" />
        <NavItem href="/admin/hasil-naive-bayes" icon={<Activity className="w-5 h-5" />} label="Hasil Naive Bayes" />
        <NavItem href="/admin/hasil-hybrid" icon={<Database className="w-5 h-5" />} label="Hasil Hybrid" />
        <NavItem href="/admin/hasil-prediksi" icon={<ClipboardList className="w-5 h-5" />} label="Hasil Prediksi" />

        {/* LAPORAN */}
        <SectionLabel label="Laporan" />
        <NavItem href="/admin/laporan" icon={<FileText className="w-5 h-5" />} label="Laporan Hasil Prediksi" />
      </nav>
    </>
  );
}

// ─────────────────────────────────────────────
// WALI KELAS MENU
// ─────────────────────────────────────────────
function WaliKelasMenu() {
  return (
    <>
      <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-3 px-3 hidden lg:block">
        Menu Wali Kelas
      </p>
      <nav className="flex flex-col gap-0.5">
        <NavItem href="/dashboard-wali" icon={<LayoutDashboard className="w-5 h-5" />} label="Dashboard Wali Kelas" />

        <SectionLabel label="Manajemen" />
        <NavItem href="/wali/siswa" icon={<GraduationCap className="w-5 h-5" />} label="Kelola Data Siswa" />
        <NavItem href="/prediksi" icon={<BrainCircuit className="w-5 h-5" />} label="Simulasi Prediksi" />

        <SectionLabel label="Laporan" />
        <NavItem href="/wali/laporan-risiko" icon={<FileText className="w-5 h-5" />} label="Laporan Hasil Prediksi" />
      </nav>
    </>
  );
}

// ─────────────────────────────────────────────
// GURU BK MENU
// ─────────────────────────────────────────────
function GuruBKMenu() {
  return (
    <>
      <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-3 px-3 hidden lg:block">
        Menu Guru BK
      </p>
      <nav className="flex flex-col gap-0.5">
        <NavItem href="/dashboard-bk" icon={<LayoutDashboard className="w-5 h-5" />} label="Dashboard Guru BK" />

        <SectionLabel label="Manajemen" />
        <NavItem href="/bk/siswa" icon={<GraduationCap className="w-5 h-5" />} label="Kelola Data Siswa" />
        <NavItem href="/bk/hasil-prediksi" icon={<ClipboardList className="w-5 h-5" />} label="Hasil Prediksi" />

        <SectionLabel label="Laporan" />
        <NavItem href="/bk/laporan" icon={<FileText className="w-5 h-5" />} label="Laporan Hasil Prediksi" />
      </nav>
    </>
  );
}

// ─────────────────────────────────────────────
// Main Sidebar Component
// ─────────────────────────────────────────────
export default function Sidebar() {
  const pathname = usePathname();
  const [role, setRole] = useState<string>("admin");

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user.role) setRole(user.role);
      } catch (e) {
        console.error("Failed to parse user role", e);
      }
    }
  }, [pathname]);

  // Hide sidebar on login page
  if (pathname === "/login") return null;

  // Determine which menu to show based on URL or localStorage role
  const effectiveRole =
    pathname.startsWith("/dashboard-wali") || pathname.startsWith("/wali/")
      ? "wali_kelas"
      : pathname.startsWith("/dashboard-bk") || pathname.startsWith("/bk/")
      ? "guru_bk"
      : role;

  return (
    <aside className="w-16 lg:w-56 bg-slate-950 border-r border-slate-800/60 flex-shrink-0 hidden md:flex flex-col transition-all duration-300">
      {/* Header / Logo */}
      <div className="flex flex-col items-center lg:items-start py-5 px-3 border-b border-slate-800/60 gap-2">
        <div className="flex items-center gap-2.5">
          <img src="/logo.png" alt="Logo" className="w-9 h-9 object-contain shrink-0" />
          <div className="hidden lg:block">
            <p className="text-xs font-extrabold text-white leading-tight">MTS ISLAM</p>
            <p className="text-xs font-extrabold text-blue-400 leading-tight">AR-RIDHO</p>
          </div>
        </div>
        <p className="hidden lg:block text-[10px] text-slate-500 leading-tight mt-0.5">
          Sistem Prediksi Drop-Out C4.5
        </p>
      </div>

      {/* Menu Section */}
      <div className="flex-1 overflow-y-auto py-4 px-2 scrollbar-thin scrollbar-thumb-slate-800">
        {effectiveRole === "wali_kelas" && <WaliKelasMenu />}
        {effectiveRole === "guru_bk"   && <GuruBKMenu />}
        {(effectiveRole === "admin" || !["wali_kelas", "guru_bk"].includes(effectiveRole)) && <AdminMenu />}
      </div>

      {/* Bottom: Logout */}
      <div className="border-t border-slate-800/60 p-3">
        <Link
          href="/login"
          onClick={() => {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
          }}
          className="flex items-center gap-3 py-2.5 px-3 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-900/20 transition-colors w-full group"
        >
          <LogOut className="w-5 h-5 shrink-0" />
          <span className="text-sm font-medium hidden lg:block">Logout</span>
        </Link>
      </div>
    </aside>
  );
}

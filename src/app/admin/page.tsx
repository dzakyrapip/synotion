
import { Suspense } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";

import { verifyToken } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";

import LogoutButton from "@/components/LogoutButtons";
import HeroGalleryManager from "@/components/HeroGalleryManager";
import ClassScheduleManager from "@/components/ClassScheduleManager";
import AdminSidebarNav from "@/components/AdminSidebarNav";
import ClassMembersManager from "@/components/ClassMembersManager";
import GalleryManager from "@/components/GalleryManager";

export default function AdminPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-slate-50">
          <p className="text-sm text-slate-500">
            Loading admin dashboard...
          </p>
        </main>
      }
    >
      <AdminContent />
    </Suspense>
  );
}

async function AdminContent() {
  await connection();

  // Authentication
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;

  if (!token || !(await verifyToken(token))) {
    redirect("/login");
  }

  // Fetch photos from Supabase
  const { data: photos, error } = await supabaseAdmin
    .from("hero_photos")
    .select("*")
    .order("display_order", { ascending: true });

  if (error) {
    console.error("Supabase error:", error);

    throw new Error("Gagal mengambil data foto dari database.");
  }

  const totalPhotos = photos.length;

  return (
    <main className="min-h-screen bg-slate-50 text-slate-800">

      {/* Sidebar */}
      <AdminSidebarNav />

      {/* Main Content */}
      <section className="min-h-screen md:ml-64">

        {/* Header */}
        <header id="dashboard" className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-5 md:px-10">

          <div>
            <h1 className="text-xl font-bold md:text-2xl">
              Dashboard
            </h1>

            <p className="mt-1 text-sm text-slate-400">
              Manage your class website.
            </p>
          </div>

          <div className="flex items-center gap-3">

            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold">
                Administrator
              </p>

              <p className="text-xs text-slate-400">
                Website Manager
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-600">
              A
            </div>

          </div>
        </header>

        {/* Dashboard Body */}
        <div className="px-6 py-8 md:px-10">

          {/* Welcome */}
          <div className="mb-8">

            <h2 className="text-2xl font-bold">
              Welcome back, Admin!
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Here's what's happening with your website today.
            </p>

          </div>

          {/* Statistics */}
          <div className="grid gap-5 sm:grid-cols-2">

            {/* Total Photos */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

              <p className="text-sm font-medium text-slate-400">
                Total Photos
              </p>

              <h3 className="mt-3 text-3xl font-bold">
                {totalPhotos}
              </h3>

              <p className="mt-2 text-xs text-slate-400">
                Photos in Hero Gallery
              </p>

            </div>

            {/* Website Status */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

              <p className="text-sm font-medium text-slate-400">
                Website Status
              </p>

              <div className="mt-3 flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-green-500" />

                <h3 className="text-2xl font-bold">
                  Online
                </h3>
              </div>

              <p className="mt-2 text-xs text-slate-400">
                Your website is accessible.
              </p>

            </div>

          </div>

          {/* Hero Gallery Management */}
          <HeroGalleryManager initialPhotos={photos} />

          {/* Class Schedule Management */}
          <ClassScheduleManager />

          {/* Class Member Management */}
          <ClassMembersManager />

          {/* Gallery Management */}
          <GalleryManager />

          {/* Footer */}
          <footer className="mt-12 border-t border-slate-200 py-6 text-center text-xs text-slate-400">
            synotion.a Admin Panel © 2026
          </footer>

        </div>
      </section>
    </main>
  );
}

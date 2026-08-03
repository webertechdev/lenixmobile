"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Loader2, Smartphone } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          // User is logged in, redirect to dashboard
          router.push("/dashboard");
        } else {
          // User is not logged in, redirect to login
          router.push("/login");
        }
      } catch (error) {
        console.error("Auth check error:", error);
        router.push("/login");
      }
    };

    checkAuth();
  }, [router, supabase]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="flex flex-col items-center gap-4">
        <div className="bg-primary p-4 rounded-2xl shadow-lg shadow-primary/20">
          <Smartphone className="h-10 w-10 text-primary-foreground animate-pulse" />
        </div>
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Lenix Mobile
          </h1>
          <p className="text-slate-500 dark:text-slate-400">Redirecting...</p>
        </div>
        <Loader2 className="h-6 w-6 animate-spin text-primary mt-4" />
      </div>
    </div>
  );
}

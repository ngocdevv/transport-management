"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function AccessDeniedPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Redirect non-viewer users or unauthenticated users
  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/auth/login");
      } else if (user.role !== "viewer") {
        router.push("/dashboard");
      }
    }
  }, [user, loading, router]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="flex justify-center mb-6">
          <div className="bg-red-100 p-3 rounded-full">
            <ShieldAlert className="h-12 w-12 text-red-600" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Access Restricted
        </h1>

        <p className="text-gray-600 mb-6">
          As a viewer, you don&apos;t have permission to access the dashboard.
          Please contact your administrator to request elevated privileges.
        </p>

        <div className="border-t border-gray-200 pt-6 mt-6">
          <p className="text-sm text-gray-500 mb-4">
            If you believe this is an error, please contact the system
            administrator.
          </p>

          <Link
            href="/auth/login"
            className="inline-flex items-center text-blue-600 hover:text-blue-800"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axiosInstance from "@/lib/axiosInstance";

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [sessionInfo, setSessionInfo] = useState({
    expiresIn: 0,
    refreshAttemptsLeft: 3,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await axiosInstance.get("/auth/session");
        if (response.data.status === "success") {
          setUser(response.data.data.user);
          // Set initial session expiry (15 minutes in milliseconds)
          setSessionInfo((prev) => ({
            ...prev,
            expiresIn: 15 * 60 * 1000,
          }));
        }
      } catch (error) {
        console.error("Failed to fetch user data:", error);
        router.push("/auth/login");
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [router]);

  useEffect(() => {
    if (!sessionInfo.expiresIn) return;

    const timer = setInterval(() => {
      setSessionInfo((prev) => {
        const newExpiresIn = prev.expiresIn - 1000;

        // If session is about to expire (1 minute left) and we have refresh attempts
        if (newExpiresIn <= 60000 && prev.refreshAttemptsLeft > 0) {
          axiosInstance
            .post("/auth/refresh-token")
            .then(() => {
              // Reset timer to 15 minutes on successful refresh
              return {
                expiresIn: 15 * 60 * 1000,
                refreshAttemptsLeft: prev.refreshAttemptsLeft - 1,
              };
            })
            .catch(() => {
              // If refresh fails, let the session expire
              router.push("/auth/login");
            });
        }

        // If session has expired
        if (newExpiresIn <= 0) {
          clearInterval(timer);
          router.push("/auth/login");
          return prev;
        }

        return { ...prev, expiresIn: newExpiresIn };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [sessionInfo.expiresIn, router]);

  const handleLogout = async () => {
    try {
      await axiosInstance.post("/auth/logout");
      router.push("/auth/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const formatTime = (ms) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100">
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Welcome, {user?.name}!</h1>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              Logout
            </button>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h2 className="text-lg font-semibold mb-4">Session Information</h2>
            <div className="space-y-2">
              <p>
                <span className="font-medium">Session expires in: </span>
                <span
                  className={`${
                    sessionInfo.expiresIn <= 60000
                      ? "text-red-600"
                      : "text-green-600"
                  } font-mono`}
                >
                  {formatTime(sessionInfo.expiresIn)}
                </span>
              </p>
              <p>
                <span className="font-medium">
                  Refresh attempts remaining:{" "}
                </span>
                <span className="text-blue-600">
                  {sessionInfo.refreshAttemptsLeft}
                </span>
              </p>
              <p>
                <span className="font-medium">Email: </span>
                {user?.email}
              </p>
              <p>
                <span className="font-medium">Role: </span>
                <span className="capitalize">{user?.role}</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axiosInstance from "@/lib/axiosInstance";
import ms from "ms";

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [sessionInfo, setSessionInfo] = useState({
    expiresIn: ms("1m"), // Default to 1 minute
    refreshAttemptsLeft: 3,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await axiosInstance.get("/auth/session");
        if (response.data.status === "success") {
          // Get expiry from response headers or use default (1 minute)
          const expiry = response.headers?.["x-token-expiry"] || "1m";
          setSessionInfo((prev) => ({
            ...prev,
            expiresIn: ms(expiry) || ms("1m"), // Fallback to 1m if parsing fails
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
    const timer = setInterval(() => {
      setSessionInfo((prev) => {
        if (!prev.expiresIn) return prev;

        const newExpiresIn = prev.expiresIn - 1000;

        // If session is about to expire (30 seconds left) and we have refresh attempts
        if (newExpiresIn <= 30000 && prev.refreshAttemptsLeft > 0) {
          axiosInstance
            .post("/auth/refresh-token")
            .then((response) => {
              const expiry = response.headers?.["x-token-expiry"] || "1m";
              setSessionInfo({
                expiresIn: ms(expiry) || ms("1m"), // Fallback to 1m if parsing fails
                refreshAttemptsLeft: prev.refreshAttemptsLeft - 1,
              });
            })
            .catch(() => {
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
  }, [router]);

  const handleLogout = async () => {
    try {
      await axiosInstance.post("/auth/logout");
      router.push("/auth/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const formatTime = (ms) => {
    if (!ms || ms < 0) return "0:00";
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
            <h1 className="text-2xl font-bold">
              Welcome, {user?.name || "User"}!
            </h1>
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
                    sessionInfo.expiresIn <= 30000
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
                <span className="capitalize">{user?.role || "user"}</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

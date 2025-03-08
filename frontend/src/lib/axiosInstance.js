import axios from "axios";
import createAuthRefreshInterceptor from "axios-auth-refresh";

// Create axios instance
const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000",
  withCredentials: true, // Important for sending cookies
  headers: {
    "Content-Type": "application/json",
  },
});

// Function that will be called to refresh authorization
const refreshAuthLogic = async (failedRequest) => {
  try {
    await axiosInstance.post("/auth/refresh-token");
    return Promise.resolve();
  } catch (error) {
    // If refresh token fails, redirect to login
    window.location.href = "/auth/login";
    return Promise.reject(error);
  }
};

// Attach the refresh token logic to the axios instance
createAuthRefreshInterceptor(axiosInstance, refreshAuthLogic, {
  statusCodes: [401], // Array of HTTP Status codes which trigger the refresh
});

// Add a response interceptor for handling errors
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle errors that aren't related to authentication
    if (error.response?.status === 404) {
      console.error("Resource not found");
    } else if (error.response?.status === 500) {
      console.error("Server error");
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;

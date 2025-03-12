import axios from "axios";
import createAuthRefreshInterceptor from "axios-auth-refresh";

// Create axios instance
const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Function that will be called to refresh authorization
const refreshAuthLogic = async (failedRequest) => {
  try {
    const response = await axiosInstance.post("/auth/refresh-token");
    // Get new expiry time from response headers
    const newExpiry = response.headers["x-token-expiry"];
    if (newExpiry) {
      // You can store or handle the new expiry time here if needed
      console.log("New token expiry:", newExpiry);
    }
    return Promise.resolve();
  } catch (error) {
    window.location.href = "/auth/login";
    return Promise.reject(error);
  }
};

// Attach the refresh token logic to the axios instance
createAuthRefreshInterceptor(axiosInstance, refreshAuthLogic, {
  statusCodes: [401],
});

// Add a response interceptor for handling errors and headers
axiosInstance.interceptors.response.use(
  (response) => {
    // Log token expiry from headers for debugging
    const tokenExpiry = response.headers["x-token-expiry"];
    if (tokenExpiry) {
      console.log("Token expiry from response:", tokenExpiry);
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 404) {
      console.error("Resource not found");
    } else if (error.response?.status === 500) {
      console.error("Server error");
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;

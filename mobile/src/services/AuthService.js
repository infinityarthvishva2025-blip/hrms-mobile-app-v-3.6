import api from './api';

const AuthService = {
    // HRMS Login - Updated endpoint and response handling
    login: async ({ identifier, password }) => {
        try {
            const response = await api.post('/auth/login', {
                UserId: identifier,  // Changed from email to UserId
                Password: password    // Capitalized as per API contract
            });

            const { token, role, employeeId, employeeCode, employeeName } = response.data;

            // Return formatted user data with role
            return {
                token,
                user: {
                    role,           // "Employee" or "HR"
                    employeeId,
                    employeeCode,
                    employeeName,
                }
            };
        } catch (error) {
            console.error('Login error:', error.response?.data);
            throw error;
        }
    },

    // 🔹 REGISTER (FINAL STEP)
    register: async (formData) => {
        const response = await api.post("/api/auth/register", formData);
        return response.data;
    },

    // 🔹 SEND OTP FOR REGISTER
    sendRegisterOtp: async (data) => {
        const response = await api.post("/api/auth/register/send-otp", data);
        return response.data;
    },

    // 🔹 VERIFY OTP FOR REGISTER
    verifyRegisterOtp: async (data) => {
        const response = await api.post("/api/auth/register/verify-otp", data);
        return response.data;
    },

    // 🔹 SEND OTP FOR LOGIN
    sendLoginOtp: async (data) => {
        const response = await api.post("/api/auth/login/otp/send", data);
        return response.data;
    },

    // 🔹 VERIFY OTP FOR LOGIN
    verifyLoginOtp: async (data) => {
        const response = await api.post("/api/auth/login/otp/verify", data);
        return response.data;
    },

    // 🔹 Get current user's dashboard profile data
    getProfile: async () => {
        const response = await api.get("/api/dashboard/profile");
        return response.data;
    },

    // 🔹 RESET PASSWORD
    forgotPassword: async (data) => {
        const response = await api.post("/auth/reset-password", data);
        return response.data;
    },
};

export default AuthService;

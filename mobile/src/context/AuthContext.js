import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AuthService from '../services/AuthService';
// DO NOT import AttendanceService here – attendance data must persist on logout

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [registerToken, setRegisterToken] = useState(null);

  useEffect(() => {
    let mounted = true;

    const loadStorageData = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('userToken');
        const storedUser = await AsyncStorage.getItem('userData');

        if (!mounted) return;

        if (storedToken) setToken(storedToken);

        if (storedUser) {
          const userData = JSON.parse(storedUser);
          setUser(userData);
          setRole(userData?.role ?? null);
        } else {
          setUser(null);
          setRole(null);
        }
      } catch (e) {
        console.error('Failed to load storage data', e);
        if (!mounted) return;
        setUser(null);
        setToken(null);
        setRole(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadStorageData();

    return () => {
      mounted = false;
    };
  }, []);

  const login = async (identifier, password) => {
    try {
      const data = await AuthService.login({ identifier, password });
      const { token: authToken, user: authUser } = data;

      await AsyncStorage.setItem('userToken', authToken);
      await AsyncStorage.setItem('userData', JSON.stringify(authUser));

      setToken(authToken);
      setUser(authUser);
      setRole(authUser?.role ?? null);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed',
      };
    }
  };

  const sendLoginOtp = async (identifier) => {
    try {
      const data = await AuthService.sendLoginOtp({ identifier });
      return { success: true, message: data?.message || 'OTP sent successfully' };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to send OTP',
      };
    }
  };

  const loginWithOtp = async (identifier, otp) => {
    try {
      const data = await AuthService.verifyLoginOtp({ identifier, otp });
      const { token: authToken, user: authUser } = data;

      await AsyncStorage.setItem('userToken', authToken);
      await AsyncStorage.setItem('userData', JSON.stringify(authUser));

      setToken(authToken);
      setUser(authUser);
      setRole(authUser?.role ?? null);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'OTP Login failed',
      };
    }
  };

  const signup = async (name, email, mobile, password, rm_referral, confirmpass) => {
    try {
      const data = await AuthService.register({
        name,
        email,
        mobile,
        password,
        confirm_password: confirmpass,
        rm_referral: rm_referral || '',
      });
      return { success: true, message: data?.message || 'OTP verification required.', data };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Registration failed';
      if (
        errorMessage.toLowerCase().includes('otp') ||
        errorMessage.toLowerCase().includes('verification required')
      ) {
        return { success: true, message: 'OTP verification required.' };
      }
      return { success: false, message: errorMessage };
    }
  };

  const sendOtp = async (mobile) => {
    try {
      const data = await AuthService.sendRegisterOtp({ mobile });
      return { success: true, message: data?.message || 'OTP sent successfully' };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to send OTP';
      if (
        errorMessage.toLowerCase().includes('already in use') ||
        errorMessage.toLowerCase().includes('already exists')
      ) {
        return {
          success: false,
          message:
            'This mobile number is already registered. Please use a different number or login.',
          stopFlow: true,
        };
      }
      return { success: false, message: errorMessage };
    }
  };

  const verifyOtp = async (mobile, otp) => {
    try {
      const data = await AuthService.verifyRegisterOtp({ mobile, otp });
      const { message, registerToken: rt } = data;
      if (!rt) throw new Error('No register token received from server');
      setRegisterToken(rt);
      return { success: true, message: message || 'OTP verified successfully', registerToken: rt };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Invalid OTP' };
    }
  };

  const completeRegistration = async (userData, rt) => {
    try {
      const data = await AuthService.register({ ...userData, registerToken: rt });
      const { message, user: registeredUser, token: receivedToken } = data;

      const finalToken = receivedToken || rt;
      if (!finalToken) throw new Error('Register token missing');

      await AsyncStorage.setItem('userToken', finalToken);
      await AsyncStorage.setItem('userData', JSON.stringify(registeredUser));

      setToken(finalToken);
      setUser(registeredUser);
      setRole(registeredUser?.role ?? null);
      setRegisterToken(null);

      return {
        success: true,
        message: message || 'Registration successful!',
        user: registeredUser,
        token: finalToken,
      };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Failed to complete registration' };
    }
  };

  const fetchUserProfile = async () => {
    try {
      const data = await AuthService.getProfile();
      const { user: profileUser } = data;

      if (profileUser) {
        await AsyncStorage.setItem('userData', JSON.stringify(profileUser));
        setUser(profileUser);
        setRole(profileUser?.role ?? null);
        return { success: true, user: profileUser };
      }
      return { success: false, message: 'No user data received' };
    } catch (error) {
      console.error('Fetch profile error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch user profile',
      };
    }
  };

  const resetPassword = async (employeeCode, newPassword, confirmPassword) => {
    try {
      const data = await AuthService.forgotPassword({
        employeeCode,
        newPassword,
        confirmPassword,
      });
      return { success: true, message: data?.message || 'Password reset successfully' };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to reset password',
      };
    }
  };

  // --- LOGOUT: clears ONLY auth data, NOT attendance data ---
  const logout = async () => {
    try {
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('userData');
    } catch (e) {
      console.error('Logout error:', e);
    }
    setToken(null);
    setUser(null);
    setRole(null);
    setRegisterToken(null);
  };

  const value = useMemo(
    () => ({
      user,
      token,
      role,
      loading,
      registerToken,
      login,
      signup,
      loginWithOtp,
      sendLoginOtp,
      logout,
      sendOtp,
      verifyOtp,
      completeRegistration,
      fetchUserProfile,
      resetPassword,
    }),
    [user, token, role, loading, registerToken]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);

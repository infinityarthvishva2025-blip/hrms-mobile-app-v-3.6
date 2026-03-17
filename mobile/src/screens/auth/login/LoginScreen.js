import React, { useState, useCallback, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    ActivityIndicator,
    Keyboard,
    TouchableOpacity,
    Image,
    Modal,
    Dimensions
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import theme from '../../../constants/theme';
import { useAuth } from '../../../context/AuthContext';
import GradientButton from '../../../components/common/GradientButton';

const { width, height: SCREEN_HEIGHT } = Dimensions.get('window');

const LoginScreen = () => {
    const { login, resetPassword } = useAuth();

    // Login Form State
    const [userId, setUserId] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Suggestion State
    const [storedCode, setStoredCode] = useState('');
    const [showSuggestion, setShowSuggestion] = useState(false);

    // Forgot Password Modal State
    const [forgotModalVisible, setForgotModalVisible] = useState(false);
    const [forgotEmpCode, setForgotEmpCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showForgotPasswords, setShowForgotPasswords] = useState(false);
    const [forgotLoading, setForgotLoading] = useState(false);
    const [forgotError, setForgotError] = useState('');
    const [forgotSuccess, setForgotSuccess] = useState('');

    // Load stored employee code on mount
    useEffect(() => {
        const loadStoredCode = async () => {
            try {
                const code = await AsyncStorage.getItem('lastEmployeeCode');
                if (code) setStoredCode(code);
            } catch (error) {
                console.log('Failed to load stored code', error);
            }
        };
        loadStoredCode();
    }, []);

    // Pre-fill forgot password field with current userId when modal opens
    useEffect(() => {
        if (forgotModalVisible) {
            setForgotEmpCode(userId || storedCode);
        }
    }, [forgotModalVisible, userId, storedCode]);

    const handleLogin = useCallback(async () => {
        Keyboard.dismiss();
        setError('');

        if (!userId.trim() || !password) {
            setError('Please enter both Employee Code and Password');
            return;
        }

        setLoading(true);
        try {
            const result = await login(userId.trim(), password);
            if (result.success) {
                // Store employee code on successful login
                await AsyncStorage.setItem('lastEmployeeCode', userId.trim());
            } else {
                setError(result.message || 'Login failed');
            }
        } catch (err) {
            setError('An unexpected error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    }, [userId, password, login]);

    const handleForgotPassword = useCallback(async () => {
        setForgotError('');
        setForgotSuccess('');

        if (!forgotEmpCode.trim() || !newPassword || !confirmPassword) {
            setForgotError('All fields are required');
            return;
        }

        if (newPassword !== confirmPassword) {
            setForgotError('Passwords do not match');
            return;
        }

        if (newPassword.length < 6) {
            setForgotError('Password must be at least 6 characters');
            return;
        }

        setForgotLoading(true);
        try {
            const result = await resetPassword(forgotEmpCode.trim(), newPassword, confirmPassword);
            if (result.success) {
                setForgotSuccess('Password reset successfully!');
                setTimeout(() => {
                    closeForgotModal();
                }, 1000);
            } else {
                setForgotError(result.message || 'Failed to reset password');
            }
        } catch (err) {
            setForgotError('An unexpected error occurred. Please try again.');
        } finally {
            setForgotLoading(false);
        }
    }, [forgotEmpCode, newPassword, confirmPassword, resetPassword]);

    const closeForgotModal = useCallback(() => {
        setForgotModalVisible(false);
        setForgotEmpCode('');
        setNewPassword('');
        setConfirmPassword('');
        setForgotError('');
        setForgotSuccess('');
    }, []);

    const openForgotModal = useCallback(() => {
        setForgotModalVisible(true);
    }, []);

    // Suggestion handlers
    const handleFocusEmployee = () => {
        if (storedCode && !userId) {
            setShowSuggestion(true);
        }
    };

    const handleChangeEmployee = (text) => {
        setUserId(text);
        if (text) setShowSuggestion(false);
    };

    const handleSuggestionPress = () => {
        setUserId(storedCode);
        setShowSuggestion(false);
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <LinearGradient
                colors={['#F5F7FA', '#FFFFFF']}
                style={styles.backgroundGradient}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Header with Logo and Welcome Back */}
                    <View style={styles.header}>
                        <Image
                            source={require('../../../../assets/images/infinity-logo.png')}
                            style={styles.logo}
                            resizeMode="contain"
                        />
                        <Text style={styles.welcomeText}>Welcome Back</Text>
                    </View>

                    <View style={styles.content}>
                        {/* Login Card */}
                        <View style={[styles.card, theme.shadow.large]}>
                            {error ? (
                                <View style={styles.errorContainer}>
                                    <Ionicons name="alert-circle" size={20} color="#B91C1C" />
                                    <Text style={styles.errorText}>{error}</Text>
                                </View>
                            ) : null}

                            {/* Employee Code Input with Suggestion */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>EMPLOYEE CODE</Text>
                                <View style={[styles.inputWrapper, userId && styles.inputFilled]}>
                                    <Ionicons name="person-outline" size={20} color={userId ? theme.colors.primary : '#94A3B8'} style={styles.inputIcon} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="e.g. IA000**"
                                        value={userId}
                                        onChangeText={handleChangeEmployee}
                                        onFocus={handleFocusEmployee}
                                        onBlur={() => setShowSuggestion(false)}
                                        autoCapitalize="characters"
                                        autoCorrect={false}
                                        placeholderTextColor="#94A3B8"
                                    />
                                </View>
                                {showSuggestion && storedCode && (
                                    <TouchableOpacity style={styles.suggestionChip} onPress={handleSuggestionPress}>
                                        <Ionicons name="time-outline" size={16} color={theme.colors.primary} />
                                        <Text style={styles.suggestionText}>Use last used: {storedCode}</Text>
                                    </TouchableOpacity>
                                )}
                            </View>

                            {/* Password Input */}
                            <View style={styles.inputGroup}>
                                <View style={styles.labelRow}>
                                    <Text style={styles.label}>PASSWORD</Text>
                                    <TouchableOpacity onPress={openForgotModal}>
                                        <Text style={styles.forgotPassLink}>Forgot?</Text>
                                    </TouchableOpacity>
                                </View>
                                <View style={[styles.inputWrapper, password && styles.inputFilled]}>
                                    <Ionicons name="lock-closed-outline" size={20} color={password ? theme.colors.primary : '#94A3B8'} style={styles.inputIcon} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="••••••••"
                                        value={password}
                                        onChangeText={setPassword}
                                        secureTextEntry={!showPassword}
                                        placeholderTextColor="#94A3B8"
                                    />
                                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                        <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#94A3B8" />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Login Button */}
                            <GradientButton
                                title="Secure Login"
                                onPress={handleLogin}
                                disabled={loading}
                                loading={loading}
                                style={styles.loginButton}
                                textStyle={styles.loginButtonText}
                                icon={!loading && <Ionicons name="shield-checkmark-outline" size={20} color="#FFF" />}
                            />

                            <View style={styles.divider}>
                                <View style={styles.dividerLine} />
                                <Text style={styles.dividerText}>SECURED ACCESS</Text>
                                <View style={styles.dividerLine} />
                            </View>
                        </View>

                        <Text style={styles.copyright}>
                            Designed & Secured by Infinity HRMS{'\n'}© 2026 Core Workforce Systems
                        </Text>
                    </View>
                </ScrollView>
            </LinearGradient>

            {/* Forgot Password Modal (unchanged logic, updated styling) */}
            <Modal
                visible={forgotModalVisible}
                animationType="none"
                transparent={true}
                statusBarTranslucent={true}
                onRequestClose={closeForgotModal}
            >
                <KeyboardAvoidingView behavior="padding" style={styles.modalKAV}>
                    <TouchableOpacity style={styles.modalDismissArea} activeOpacity={1} onPress={closeForgotModal} />
                    <View style={styles.modalContent}>
                        <View style={styles.dragHandle} />
                        <View style={styles.modalHeader}>
                            <View>
                                <Text style={styles.modalTitle}>Reset Password</Text>
                                <Text style={styles.modalSubtitle}>Enter your details to set a new password</Text>
                            </View>
                            <TouchableOpacity onPress={closeForgotModal} style={styles.closeButton}>
                                <Ionicons name="close" size={20} color="#64748B" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                            {forgotError ? (
                                <View style={styles.modalErrorContainer}>
                                    <Ionicons name="alert-circle" size={16} color="#B91C1C" />
                                    <Text style={styles.modalErrorText}>{forgotError}</Text>
                                </View>
                            ) : null}

                            {forgotSuccess ? (
                                <View style={styles.modalSuccessContainer}>
                                    <Ionicons name="checkmark-circle" size={16} color="#166534" />
                                    <Text style={styles.modalSuccessText}>{forgotSuccess}</Text>
                                </View>
                            ) : null}

                            <View style={styles.modalInputGroup}>
                                <Text style={styles.modalLabel}>Employee Code</Text>
                                <View style={styles.modalInputWrapper}>
                                    <Ionicons name="id-card-outline" size={16} color={theme.colors.primary} style={styles.modalInputIcon} />
                                    <TextInput
                                        style={styles.modalInput}
                                        placeholder="e.g. IA00087"
                                        value={forgotEmpCode}
                                        onChangeText={setForgotEmpCode}
                                        autoCapitalize="characters"
                                        placeholderTextColor="#94A3B8"
                                    />
                                </View>
                            </View>

                            <View style={styles.modalInputGroup}>
                                <Text style={styles.modalLabel}>New Password</Text>
                                <View style={styles.modalInputWrapper}>
                                    <Ionicons name="lock-closed-outline" size={16} color={theme.colors.primary} style={styles.modalInputIcon} />
                                    <TextInput
                                        style={styles.modalInput}
                                        placeholder="At least 6 characters"
                                        value={newPassword}
                                        onChangeText={setNewPassword}
                                        secureTextEntry={!showForgotPasswords}
                                        placeholderTextColor="#94A3B8"
                                    />
                                </View>
                            </View>

                            <View style={styles.modalInputGroup}>
                                <Text style={styles.modalLabel}>Confirm Password</Text>
                                <View style={styles.modalInputWrapper}>
                                    <Ionicons name="shield-checkmark-outline" size={16} color={theme.colors.primary} style={styles.modalInputIcon} />
                                    <TextInput
                                        style={styles.modalInput}
                                        placeholder="Re-enter new password"
                                        value={confirmPassword}
                                        onChangeText={setConfirmPassword}
                                        secureTextEntry={!showForgotPasswords}
                                        placeholderTextColor="#94A3B8"
                                    />
                                    <TouchableOpacity onPress={() => setShowForgotPasswords(!showForgotPasswords)}>
                                        <Ionicons name={showForgotPasswords ? 'eye-outline' : 'eye-off-outline'} size={18} color="#94A3B8" />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <View style={styles.modalActionRow}>
                                <TouchableOpacity onPress={closeForgotModal} style={styles.modalCancelButton}>
                                    <Text style={styles.modalCancelText}>Cancel</Text>
                                </TouchableOpacity>
                                <GradientButton
                                    title={forgotLoading ? 'Processing...' : 'Update Password'}
                                    onPress={handleForgotPassword}
                                    disabled={forgotLoading || !!forgotSuccess}
                                    loading={forgotLoading}
                                    style={styles.modalSubmitButton}
                                />
                            </View>
                            <View style={{ height: Platform.OS === 'ios' ? 24 : 16 }} />
                        </ScrollView>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F7FA',
    },
    backgroundGradient: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
    },
    header: {
        alignItems: 'center',
        paddingTop: Platform.OS === 'ios' ? 100 : 40,
        paddingBottom: 20,
    },
    logo: {
        width: 140,
        height: 56,
        marginBottom: 12,
    },
    welcomeText: {
        fontSize: 28,
        fontWeight: '700',
        color: '#1E293B',
        letterSpacing: -0.5,
    },
    content: {
        flex: 1,
        paddingHorizontal: 24,
        paddingBottom: 40,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 32,
        padding: 28,
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.08,
        shadowRadius: 24,
        elevation: 8,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FEF2F2',
        padding: 12,
        borderRadius: 16,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#FEE2E2',
        gap: 8,
    },
    errorText: {
        flex: 1,
        color: '#B91C1C',
        fontSize: 14,
        fontWeight: '600',
    },
    inputGroup: {
        marginBottom: 20,
    },
    labelRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    label: {
        fontSize: 12,
        fontWeight: '700',
        color: '#64748B',
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },
    forgotPassLink: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.primary,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        borderRadius: 20,
        paddingHorizontal: 16,
        height: 56,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    inputFilled: {
        borderColor: theme.colors.primary,
        backgroundColor: '#FFFFFF',
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: '#1E293B',
        fontWeight: '500',
    },
    suggestionChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EFF6FF',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 30,
        marginTop: 8,
        alignSelf: 'flex-start',
        gap: 6,
        borderWidth: 1,
        borderColor: '#DBEAFE',
    },
    suggestionText: {
        fontSize: 14,
        color: theme.colors.primary,
        fontWeight: '600',
    },
    loginButton: {
        marginTop: 8,
        borderRadius: 20,
        height: 56,
    },
    loginButtonText: {
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 32,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#F1F5F9',
    },
    dividerText: {
        fontSize: 11,
        color: '#94A3B8',
        fontWeight: '700',
        textTransform: 'uppercase',
        marginHorizontal: 12,
    },
    copyright: {
        textAlign: 'center',
        marginTop: 32,
        color: '#94A3B8',
        fontSize: 12,
        lineHeight: 18,
        fontWeight: '500',
    },
    // Modal Styles
    modalKAV: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        justifyContent: 'flex-end',
    },
    modalDismissArea: {
        flex: 1,
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        maxHeight: SCREEN_HEIGHT * 0.9,
        paddingHorizontal: 24,
        paddingTop: 12,
        paddingBottom: 0,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -8 },
        shadowOpacity: 0.08,
        shadowRadius: 24,
        elevation: 24,
    },
    dragHandle: {
        width: 40,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#E2E8F0',
        alignSelf: 'center',
        marginBottom: 16,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: '#1E293B',
        marginBottom: 4,
    },
    modalSubtitle: {
        fontSize: 14,
        color: '#64748B',
    },
    closeButton: {
        backgroundColor: '#F1F5F9',
        borderRadius: 10,
        padding: 6,
    },
    modalErrorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FEF2F2',
        padding: 12,
        borderRadius: 16,
        marginBottom: 16,
        gap: 8,
        borderWidth: 1,
        borderColor: '#FEE2E2',
    },
    modalErrorText: {
        flex: 1,
        color: '#B91C1C',
        fontSize: 14,
        fontWeight: '600',
    },
    modalSuccessContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F0FDF4',
        padding: 12,
        borderRadius: 16,
        marginBottom: 16,
        gap: 8,
        borderWidth: 1,
        borderColor: '#DCFCE7',
    },
    modalSuccessText: {
        flex: 1,
        color: '#166534',
        fontSize: 14,
        fontWeight: '600',
    },
    modalInputGroup: {
        marginBottom: 16,
    },
    modalLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: '#64748B',
        marginBottom: 6,
        textTransform: 'uppercase',
    },
    modalInputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        borderRadius: 20,
        paddingHorizontal: 16,
        height: 52,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    modalInputIcon: {
        marginRight: 12,
    },
    modalInput: {
        flex: 1,
        fontSize: 16,
        color: '#1E293B',
        fontWeight: '500',
    },
    modalActionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginTop: 24,
        marginBottom: 20,
    },
    modalCancelButton: {
        flex: 1,
        height: 52,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F1F5F9',
        borderRadius: 20,
    },
    modalCancelText: {
        fontSize: 16,
        color: '#475569',
        fontWeight: '600',
    },
    modalSubmitButton: {
        flex: 2,
        height: 52,
        borderRadius: 20,
    },
});

export default LoginScreen;
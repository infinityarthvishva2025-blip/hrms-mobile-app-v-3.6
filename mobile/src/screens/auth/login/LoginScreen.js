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
import { Ionicons } from '@expo/vector-icons';
import theme from '../../../constants/theme';
import { useAuth } from '../../../context/AuthContext';
import GradientButton from '../../../components/common/GradientButton';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const LoginScreen = () => {
    const { login, resetPassword } = useAuth();

    // Login Form State
    const [userId, setUserId] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Forgot Password Modal State
    const [forgotModalVisible, setForgotModalVisible] = useState(false);
    const [forgotEmpCode, setForgotEmpCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showForgotPasswords, setShowForgotPasswords] = useState(false);
    const [forgotLoading, setForgotLoading] = useState(false);
    const [forgotError, setForgotError] = useState('');
    const [forgotSuccess, setForgotSuccess] = useState('');

    // Pre-fill forgot password field with current userId when modal opens
    useEffect(() => {
        if (forgotModalVisible) {
            setForgotEmpCode(userId);
        }
    }, [forgotModalVisible, userId]);

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
            if (!result.success) {
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

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <LinearGradient
                colors={['#F9FAFB', '#F3F4F6']}
                style={styles.backgroundGradient}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Header Background (Premium Immersive) */}
                    <LinearGradient
                        colors={['#1E293B', '#0F172A']}
                        style={styles.headerBackground}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        <View style={styles.headerCircle1} />
                        <View style={styles.headerCircle2} />

                        <View style={styles.logoWrapper}>
                            <View style={styles.logoBg}>
                                <Image
                                    source={require('../../../../assets/images/infinity-logo.png')}
                                    style={styles.logo}
                                    resizeMode="contain"
                                />
                            </View>
                        </View>

                        <View style={styles.headerInfo}>
                            <Text style={styles.brandTitle}>INFINITY <Text style={styles.brandSub}>HRMS</Text></Text>
                            <Text style={styles.headerSubtitle}>Enterprise Identity Access</Text>
                        </View>
                    </LinearGradient>

                    <View style={styles.content}>
                        {/* Welcome Header */}
                        <View style={styles.welcomeContainer}>
                            <Text style={styles.welcomeTitle}>Welcome Back</Text>
                            <Text style={styles.welcomeSubtitle}>Enter your credentials to access your workspace</Text>
                        </View>

                        {/* Login Card (Premium Floating) */}
                        <View style={[styles.card, theme.shadow.large]}>
                            {error ? (
                                <View style={styles.errorContainer}>
                                    <View style={styles.errorIconBg}>
                                        <Ionicons name="alert-circle" size={18} color="#B91C1C" />
                                    </View>
                                    <Text style={styles.errorText}>{error}</Text>
                                </View>
                            ) : null}

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>EMPLOYEE CODE</Text>
                                <View style={[styles.inputWrapper, userId ? styles.inputFilled : null]}>
                                    <View style={styles.iconContainer}>
                                        <Ionicons name="person" size={18} color={userId ? theme.colors.primary : '#94A3B8'} />
                                    </View>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="e.g. IA00087"
                                        value={userId}
                                        onChangeText={setUserId}
                                        autoCapitalize="characters"
                                        autoCorrect={false}
                                        importantForAutofill="noExcludeDescendants"
                                        placeholderTextColor="#94A3B8"
                                    />
                                </View>
                            </View>

                            <View style={styles.inputGroup}>
                                <View style={styles.labelRow}>
                                    <Text style={styles.label}>PASSWORD</Text>
                                    <TouchableOpacity
                                        onPress={openForgotModal}
                                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                    >
                                        <Text style={styles.forgotPassLink}>Forgot password?</Text>
                                    </TouchableOpacity>
                                </View>
                                <View style={[styles.inputWrapper, password ? styles.inputFilled : null]}>
                                    <View style={styles.iconContainer}>
                                        <Ionicons name="lock-closed" size={18} color={password ? theme.colors.primary : '#94A3B8'} />
                                    </View>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="••••••••"
                                        value={password}
                                        onChangeText={setPassword}
                                        secureTextEntry={!showPassword}
                                        autoCorrect={false}
                                        importantForAutofill="noExcludeDescendants"
                                        placeholderTextColor="#94A3B8"
                                    />
                                    <TouchableOpacity
                                        onPress={() => setShowPassword(prev => !prev)}
                                        style={styles.eyeIcon}
                                    >
                                        <Ionicons
                                            name={showPassword ? 'eye-off' : 'eye'}
                                            size={20}
                                            color="#94A3B8"
                                        />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <TouchableOpacity
                                onPress={handleLogin}
                                disabled={loading}
                                style={styles.loginBtnWrapper}
                                activeOpacity={0.8}
                            >
                                <LinearGradient
                                    colors={loading ? ['#CBD5E1', '#94A3B8'] : theme.colors.gradientPrimary}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.loginBtnGradient}
                                >
                                    {loading ? (
                                        <ActivityIndicator color="#FFF" />
                                    ) : (
                                        <>
                                            <Text style={styles.loginBtnText}>Secure Login</Text>
                                            <Ionicons name="shield-checkmark" size={18} color="#FFF" style={styles.btnIcon} />
                                        </>
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>

                            <View style={styles.divider}>
                                <View style={styles.dividerLine} />
                                <View style={styles.securityBadge}>
                                    <Ionicons name="lock-closed" size={10} color="#94A3B8" />
                                    <Text style={styles.dividerText}>SECURED ACCESS</Text>
                                </View>
                                <View style={styles.dividerLine} />
                            </View>
                        </View>

                        <Text style={styles.copyrightText}>
                            Designed & Secured by <Text style={{ fontWeight: '700', color: '#64748B' }}>Infinity HRMS</Text>{'\n'}
                            © 2026 Core Workforce Systems
                        </Text>
                    </View>
                </ScrollView>
            </LinearGradient>

            {/* Forgot Password Modal */}
            <Modal
                visible={forgotModalVisible}
                animationType="none"
                transparent={true}
                onRequestClose={closeForgotModal}
            >
                <View style={styles.modalOverlay}>
                    <TouchableOpacity
                        style={styles.modalDismissArea}
                        activeOpacity={1}
                        onPress={closeForgotModal}
                    />
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        style={styles.modalContentWrapper}
                    >
                        <View style={styles.modalContent}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>Reset password</Text>
                                <TouchableOpacity onPress={closeForgotModal} style={styles.closeButton}>
                                    <Ionicons name="close" size={22} color={theme.colors.text} />
                                </TouchableOpacity>
                            </View>

                            {forgotError ? (
                                <View style={styles.modalErrorContainer}>
                                    <Ionicons name="alert-circle" size={16} color={theme.colors.error} />
                                    <Text style={styles.modalErrorText}>{forgotError}</Text>
                                </View>
                            ) : null}

                            {forgotSuccess ? (
                                <View style={styles.successContainer}>
                                    <Ionicons name="checkmark-circle" size={16} color={theme.colors.success} />
                                    <Text style={styles.successText}>{forgotSuccess}</Text>
                                </View>
                            ) : null}

                            <View style={styles.modalInputGroup}>
                                <Text style={styles.modalLabel}>Employee Code</Text>
                                <View style={styles.modalInputWrapper}>
                                    <Ionicons name="id-card-outline" size={16} color={theme.colors.textSecondary} style={styles.modalIcon} />
                                    <TextInput
                                        style={styles.modalInput}
                                        placeholder="Enter your employee code"
                                        value={forgotEmpCode}
                                        onChangeText={setForgotEmpCode}
                                        autoCapitalize="characters"
                                        autoCorrect={false}
                                        placeholderTextColor={theme.colors.textTertiary}
                                    />
                                </View>
                            </View>

                            <View style={styles.modalInputGroup}>
                                <Text style={styles.modalLabel}>New Password</Text>
                                <View style={styles.modalInputWrapper}>
                                    <Ionicons name="lock-closed-outline" size={16} color={theme.colors.textSecondary} style={styles.modalIcon} />
                                    <TextInput
                                        style={styles.modalInput}
                                        placeholder="At least 6 characters"
                                        value={newPassword}
                                        onChangeText={setNewPassword}
                                        secureTextEntry={!showForgotPasswords}
                                        placeholderTextColor={theme.colors.textTertiary}
                                    />
                                </View>
                            </View>

                            <View style={styles.modalInputGroup}>
                                <Text style={styles.modalLabel}>Confirm Password</Text>
                                <View style={styles.modalInputWrapper}>
                                    <Ionicons name="shield-checkmark-outline" size={16} color={theme.colors.textSecondary} style={styles.modalIcon} />
                                    <TextInput
                                        style={styles.modalInput}
                                        placeholder="Re-enter new password"
                                        value={confirmPassword}
                                        onChangeText={setConfirmPassword}
                                        secureTextEntry={!showForgotPasswords}
                                        placeholderTextColor={theme.colors.textTertiary}
                                    />
                                    <TouchableOpacity onPress={() => setShowForgotPasswords(!showForgotPasswords)}>
                                        <Ionicons
                                            name={showForgotPasswords ? "eye-outline" : "eye-off-outline"}
                                            size={16}
                                            color={theme.colors.textSecondary}
                                        />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <View style={styles.modalActionRow}>
                                <TouchableOpacity
                                    onPress={closeForgotModal}
                                    style={styles.modalCancelButton}
                                >
                                    <Text style={styles.modalCancelText}>Cancel</Text>
                                </TouchableOpacity>

                                <View style={{ flex: 2 }}>
                                    <GradientButton
                                        title={forgotLoading ? "Processing..." : "Update Password"}
                                        onPress={handleForgotPassword}
                                        disabled={forgotLoading || !!forgotSuccess}
                                        loading={forgotLoading}
                                        style={styles.modalSubmitButton}
                                    />
                                </View>
                            </View>
                        </View>
                    </KeyboardAvoidingView>
                </View>
            </Modal>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    backgroundGradient: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
    },
    headerBackground: {
        height: 280,
        justifyContent: 'center',
        alignItems: 'center',
        paddingBottom: 40,
        position: 'relative',
        overflow: 'hidden',
    },
    headerCircle1: {
        position: 'absolute',
        width: 300,
        height: 300,
        borderRadius: 150,
        backgroundColor: 'rgba(79, 70, 229, 0.15)',
        top: -100,
        right: -50,
    },
    headerCircle2: {
        position: 'absolute',
        width: 200,
        height: 200,
        borderRadius: 100,
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        bottom: -50,
        left: -30,
    },
    logoWrapper: {
        marginTop: Platform.OS === 'ios' ? 40 : 20,
    },
    logoBg: {
        backgroundColor: '#FFF',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
        elevation: 10,
    },
    logo: {
        width: 120,
        height: 48,
    },
    headerInfo: {
        alignItems: 'center',
        marginTop: 20,
    },
    brandTitle: {
        fontSize: 18,
        fontWeight: '900',
        color: '#FFF',
        letterSpacing: 2,
    },
    brandSub: {
        fontWeight: '400',
        color: 'rgba(255,255,255,0.7)',
    },
    headerSubtitle: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.6)',
        marginTop: 4,
        textTransform: 'uppercase',
        letterSpacing: 1,
        fontWeight: '600',
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
        marginTop: -50,
    },
    welcomeContainer: {
        marginBottom: 24,
        alignItems: 'center',
    },
    welcomeTitle: {
        fontSize: 28,
        fontWeight: '900',
        color: '#FFF',
        marginBottom: 6,
        letterSpacing: -0.5,
    },
    welcomeSubtitle: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.7)',
        fontWeight: '500',
        textAlign: 'center',
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 32,
        padding: 28,
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.1,
        shadowRadius: 30,
        elevation: 15,
        borderWidth: 1,
        borderColor: 'rgba(241, 245, 249, 0.8)',
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FEF2F2',
        padding: 14,
        borderRadius: 16,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#FEE2E2',
    },
    errorIconBg: {
        width: 32,
        height: 32,
        borderRadius: 10,
        backgroundColor: '#FFF',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },
    errorText: {
        flex: 1,
        color: '#B91C1C',
        fontSize: 13,
        fontWeight: '700',
    },
    inputGroup: {
        marginBottom: 24,
    },
    labelRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    label: {
        fontSize: 10,
        fontWeight: '800',
        color: '#94A3B8',
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    forgotPassLink: {
        fontSize: 12,
        fontWeight: '700',
        color: theme.colors.primary,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        borderRadius: 16,
        paddingHorizontal: 16,
        height: 58,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    inputFilled: {
        borderColor: theme.colors.primary,
        backgroundColor: '#FFF',
    },
    iconContainer: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: '#FFF',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    input: {
        flex: 1,
        fontSize: 15,
        color: '#1E293B',
        fontWeight: '600',
        height: '100%',
    },
    eyeIcon: {
        padding: 8,
    },
    loginBtnWrapper: {
        marginTop: 8,
        borderRadius: 18,
        overflow: 'hidden',
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 8,
    },
    loginBtnGradient: {
        flexDirection: 'row',
        height: 58,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 18,
    },
    loginBtnText: {
        fontSize: 16,
        fontWeight: '900',
        color: '#FFF',
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    btnIcon: {
        marginLeft: 10,
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
    securityBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 100,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        marginHorizontal: 12,
        gap: 6,
    },
    dividerText: {
        fontSize: 9,
        color: '#94A3B8',
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    copyrightText: {
        textAlign: 'center',
        marginTop: 40,
        paddingBottom: 40,
        color: '#94A3B8',
        fontSize: 11,
        lineHeight: 18,
        fontWeight: '500',
    },

    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.7)',
        justifyContent: 'flex-end',
    },
    modalDismissArea: {
        flex: 1,
    },
    modalContentWrapper: {
        width: '100%',
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        padding: 32,
        paddingBottom: Platform.OS === 'ios' ? 48 : 32,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 20,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 28,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: '900',
        color: '#1E293B',
        letterSpacing: -0.5,
    },
    closeButton: {
        backgroundColor: '#F1F5F9',
        borderRadius: 12,
        padding: 8,
    },
    modalErrorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FEF2F2',
        padding: 12,
        borderRadius: 14,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#FEE2E2',
    },
    modalErrorText: {
        flex: 1,
        color: '#B91C1C',
        fontSize: 13,
        fontWeight: '700',
        marginLeft: 10,
    },
    successContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F0FDF4',
        padding: 14,
        borderRadius: 14,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#DCFCE7',
    },
    successText: {
        flex: 1,
        color: '#166534',
        fontSize: 13,
        fontWeight: '700',
        marginLeft: 10,
    },
    modalInputGroup: {
        marginBottom: 20,
    },
    modalLabel: {
        fontSize: 10,
        fontWeight: '800',
        color: '#94A3B8',
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    modalInputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        borderRadius: 14,
        paddingHorizontal: 14,
        height: 52,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    modalIcon: {
        marginRight: 10,
    },
    modalInput: {
        flex: 1,
        fontSize: 15,
        color: '#1E293B',
        fontWeight: '600',
        height: '100%',
    },
    modalActionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        marginTop: 20,
    },
    modalSubmitButton: {
        height: 54,
        borderRadius: 16,
    },
    modalCancelButton: {
        flex: 1,
        height: 54,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F1F5F9',
        borderRadius: 16,
    },
    modalCancelText: {
        fontSize: 15,
        color: '#64748B',
        fontWeight: '700',
    },
});

export default LoginScreen;
/**
 * EditProfileScreen.js
 * ─────────────────────────────────────────────────────────────
 * Edit Employee Profile – sends ALL fields as JSON.
 *  • Stores full original employee object.
 *  • Pre‑fills every field (including password, if returned).
 *  • Merges changes with original data before submit.
 *  • Handles date fields correctly: converts placeholder "-" to null.
 *  • Includes all fields from the backend requirement.
 * ─────────────────────────────────────────────────────────────
 */
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Platform,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import theme from '../../constants/theme';
import EmployeeService from '../../services/employee/EmployeeService';



///////////////////////////

const PickerField = ({ label, value, options, onChange }) => {
    const [open, setOpen] = useState(false);
    return (
        <View style={styles.fieldWrap}>
            {open && (
                <View style={styles.pickerDropdown}>
                    {options.map(opt => (
                        <TouchableOpacity
                            key={opt}
                            style={[styles.pickerOption, value === opt && styles.pickerOptionSelected]}
                            onPress={() => { onChange(opt); setOpen(false); }}
                        >
                            <Text style={[styles.pickerOptionText, value === opt && styles.pickerOptionTextSelected]}>{opt}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            )}
        </View>
    );
};

const filed = ({label , value , onChange ,multiline = false , keyboardType = 'default' , editable = true , secureTextEntry = false , autoCapitalize = 'characters'})=>(
    <View  style={styles.fieldWrap}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <TextInput
        style = {[styles.input , multiline && styles.inputMulti , !editable && styles.inputReadonly]}
        value={value ?? ''}
        onChangeText={onChange}
        multiline={multiline}
        numberOfLines={multiline ? 3: 1}
        keyboardType={keyboardType}
        editable={editable}
        secureTextEntry={secureTextEntry}
        autoCapitalize={autoCapitalize}
        placeholderTextColor="#9CA3AF"
        />

    </View>
)

// ─── Picker-like selector ───────────────────────────────────


// ─── Text input with auto-uppercase ─────────────────────────


// ─── Password input with toggle ─────────────────────────────
const PasswordField = ({ label, value, onChange }) => {
    const [show, setShow] = useState(false);
    return (
        <View style={styles.fieldWrap}>
            <Text style={styles.fieldLabel}>{label}</Text>
            <View style={styles.passwordRow}>
                <TextInput
                    style={[styles.input, styles.passwordInput]}
                    value={value ?? ''}
                    onChangeText={onChange}
                    secureTextEntry={!show}
                    autoCapitalize="none"
                    placeholderTextColor="#9CA3AF"
                />
                <TouchableOpacity style={styles.eyeBtn} onPress={() => setShow(!show)}>
                    <Ionicons name={show ? 'eye-off-outline' : 'eye-outline'} size={20} color="#6B7280" />
                </TouchableOpacity>
            </View>
        </View>
    );
};

// ─── Section card ───────────────────────────────────────────
const SectionCard = ({ title, icon, children }) => (
    <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
            <View style={styles.sectionIconBg}>
                <Ionicons name={icon} size={16} color={theme.colors.primary} />
            </View>
            <Text style={styles.sectionTitle}>{title}</Text>
        </View>
        <View style={styles.sectionBody}>{children}</View>
    </View>
);

// ─── Format date for input (YYYY-MM-DD) ─────────────────────
const dateToInput = (d) => {
    if (!d || d === '-') return '';
    try {
        const date = new Date(d);
        if (isNaN(date.getTime())) return '';
        return date.toISOString().split('T')[0];
    } catch {
        return '';
    }
};

// ─── Main Screen ─────────────────────────────────────────────
const EditProfileScreen = ({ navigation, route }) => {
    const insets = useSafeAreaInsets();
    const { employeeId } = route.params || {};

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [originalEmployee, setOriginalEmployee] = useState(null);
    const [form, setForm] = useState(null);
    const [confirmPassword, setConfirmPassword] = useState('');
    const [sameAddress, setSameAddress] = useState(false);

    // ── Load employee data and store full original ──
    const loadEmployee = useCallback(async () => {
        try {
            const data = await EmployeeService.getEmployeeById(employeeId);
            setOriginalEmployee(data);

            // Initialize form with ALL fields from original
            const initialForm = { ...data };

            // Ensure password field is pre-filled (if API returns it)
            if (!initialForm.password) initialForm.password = '';

            // For confirmPassword, we use the same password
            setConfirmPassword(initialForm.password);

            setForm(initialForm);
        } catch (err) {
            Alert.alert('Error', 'Failed to load employee data');
            navigation.goBack();
        } finally {
            setLoading(false);
        }
    }, [employeeId]);

    useEffect(() => { loadEmployee(); }, [loadEmployee]);

    // Generic field updater
    const setField = (key) => (value) => {
        setForm(prev => ({ ...prev, [key]: value }));
    };

    // Same address checkbox
    useEffect(() => {
        if (sameAddress && form) {
            setForm(prev => ({ ...prev, permanentAddress: prev.address }));
        }
    }, [sameAddress, form?.address]);

    // ── Submit ──
    const handleSave = async () => {
        if (form.password && form.password !== confirmPassword) {
            Alert.alert('Error', 'Passwords do not match');
            return;
        }

        setSaving(true);
        try {
            // Start with the original employee object (ensures ALL fields are present)
            const payload = { ...originalEmployee };

            // Override with edited form values
            Object.keys(form).forEach(key => {
                // Special handling for date fields
                if (key === 'doB_Date' || key === 'joiningDate' || key === 'lastAffectedDate' || key === 'lastCompOffEarnedDate') {
                    let newValue = form[key];

                    // If the value is the placeholder "-", convert to null
                    if (newValue === '-') {
                        payload[key] = null;
                        return;
                    }

                    // If the field is empty, send null
                    if (!newValue) {
                        payload[key] = null;
                        return;
                    }

                    // Check if the date part changed
                    const originalValue = originalEmployee[key];
                    const originalDatePart = originalValue && originalValue !== '-' ? dateToInput(originalValue) : '';
                    const newDatePart = dateToInput(newValue);

                    if (originalDatePart === newDatePart && originalValue && originalValue !== '-') {
                        // Date unchanged – keep original full ISO (preserves time)
                        payload[key] = originalValue;
                    } else {
                        // Date changed – use new date with 00:00:00
                        const dateOnly = dateToInput(newValue);
                        payload[key] = dateOnly ? `${dateOnly}T00:00:00` : null;
                    }
                } else {
                    // For all other fields, simply override
                    payload[key] = form[key];
                }
            });

            // Ensure confirmPassword is included (may not be in original)
            payload.confirmPassword = form.password ? confirmPassword : null;

            // Convert numeric strings to numbers where appropriate
            const numericFields = [
                'totalExperienceYears', 'salary', 'hscPercent', 'graduationPercent',
                'postGraduationPercent', 'compOffBalance', 'failedLoginAttempts'
            ];
            numericFields.forEach(field => {
                if (payload[field] !== undefined && payload[field] !== null) {
                    payload[field] = Number(payload[field]) || 0;
                }
            });

            // Send JSON payload
            await EmployeeService.updateEmployeeJson(employeeId, payload);

            Alert.alert('Success', 'Profile updated successfully!', [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]);
        } catch (err) {
            const msg = err?.response?.data?.message || err?.message || 'Update failed';
            Alert.alert('Error', msg);
        } finally {
            setSaving(false);
        }
    };

    // ── Loading ──
    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={styles.loadingText}>Loading employee data...</Text>
            </View>
        );
    }

    if (!form || !originalEmployee) return null;

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.headerBgContainer}>
                <LinearGradient
                    colors={theme.colors.gradientHeader}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                    style={[styles.headerGradient, { paddingTop: insets.top + 10 }]}
                >
                    <View style={styles.headerTop}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                            <Ionicons name="arrow-back" size={24} color="#FFF" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitleText}>Edit Profile</Text>
                        <View style={{ width: 44 }} />
                    </View>
                    <View style={styles.headerSubRow}>
                        <Ionicons name="person-circle" size={18} color="rgba(255,255,255,0.8)" />
                        <Text style={styles.headerSubText}>{form.name}  ·  {form.employeeCode}</Text>
                    </View>
                </LinearGradient>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
            >
                {/* ── 1. Basic Details ── */}
                <SectionCard title="Basic Details" icon="person-outline">
                    <FieldInput label="Employee Code" value={form.employeeCode} onChange={setField('employeeCode')} editable={false} />
                    <FieldInput label="Full Name" value={form.name} onChange={setField('name')} />
                    <FieldInput label="Email" value={form.email} onChange={setField('email')} keyboardType="email-address" autoCapitalize="none" />
                    <FieldInput label="Mobile Number" value={form.mobileNumber} onChange={setField('mobileNumber')} keyboardType="phone-pad" />
                    <FieldInput label="Alternate Mobile" value={form.alternateMobileNumber} onChange={setField('alternateMobileNumber')} keyboardType="phone-pad" />
                    <PasswordField label="Password" value={form.password} onChange={setField('password')} />
                    <PasswordField label="Confirm Password" value={confirmPassword} onChange={setConfirmPassword} />
                </SectionCard>

                {/* ── 2. Personal Details ── */}
                <SectionCard title="Personal Details" icon="happy-outline">
                    <PickerField label="Gender" value={form.gender} onChange={setField('gender')}
                        options={['Male', 'Female', 'Other']} />
                    <FieldInput label="Father's Name" value={form.fatherName} onChange={setField('fatherName')} />
                    <FieldInput label="Mother's Name" value={form.motherName} onChange={setField('motherName')} />
                    <FieldInput label="Date of Birth (YYYY-MM-DD)" value={dateToInput(form.doB_Date)} onChange={(val) => setField('doB_Date')(val)} />
                    <PickerField label="Marital Status" value={form.maritalStatus} onChange={setField('maritalStatus')}
                        options={['Single', 'Married', 'Divorced', 'Widowed']} />
                    <FieldInput label="Current Address" value={form.address} onChange={(v) => {
                        setField('address')(v);
                        if (sameAddress) setForm(prev => ({ ...prev, address: v, permanentAddress: v }));
                    }} multiline />
                    <View style={styles.switchRow}>
                        <Switch
                            value={sameAddress}
                            onValueChange={setSameAddress}
                            trackColor={{ true: theme.colors.primary }}
                        />
                        <Text style={styles.switchLabel}>Permanent address same as current</Text>
                    </View>
                    <FieldInput label="Permanent Address" value={form.permanentAddress} onChange={setField('permanentAddress')} multiline editable={!sameAddress} />
                </SectionCard>

                {/* ── 3. Experience ── */}
                <SectionCard title="Experience Details" icon="briefcase-outline">
                    <PickerField label="Experience Type" value={form.experienceType} onChange={setField('experienceType')}
                        options={['Fresher', 'Experienced']} />
                    <FieldInput label="Total Experience (Years)" value={String(form.totalExperienceYears ?? '0')} onChange={setField('totalExperienceYears')} keyboardType="numeric" />
                    <FieldInput label="Last Company Name" value={form.lastCompanyName} onChange={setField('lastCompanyName')} />
                    <FieldInput label="Experience Certificate File Path" value={form.experienceCertificateFilePath} onChange={setField('experienceCertificateFilePath')} />
                </SectionCard>

                {/* ── 4. Health ── */}
                <SectionCard title="Health Information" icon="fitness-outline">
                    <PickerField label="Pre-existing Disease?" value={form.hasDisease} onChange={setField('hasDisease')}
                        options={['No', 'Yes']} />
                    {form.hasDisease === 'Yes' && <>
                        <FieldInput label="Disease Name" value={form.diseaseName} onChange={setField('diseaseName')} />
                        <FieldInput label="Disease Type" value={form.diseaseType} onChange={setField('diseaseType')} />
                        <FieldInput label="Since" value={form.diseaseSince} onChange={setField('diseaseSince')} />
                        <FieldInput label="Medicines Required" value={form.medicinesRequired} onChange={setField('medicinesRequired')} />
                        <FieldInput label="Doctor Name" value={form.doctorName} onChange={setField('doctorName')} />
                        <FieldInput label="Doctor Contact" value={form.doctorContact} onChange={setField('doctorContact')} keyboardType="phone-pad" />
                        <FieldInput label="Last Affected Date (YYYY-MM-DD)" value={dateToInput(form.lastAffectedDate)} onChange={setField('lastAffectedDate')} />
                    </>}
                    <FieldInput label="Medical Document File Path" value={form.medicalDocumentFilePath} onChange={setField('medicalDocumentFilePath')} />
                </SectionCard>

                {/* ── 5. Job Details ── */}
                <SectionCard title="Job Details" icon="business-outline">
                    <FieldInput label="Joining Date (YYYY-MM-DD)" value={dateToInput(form.joiningDate)} onChange={setField('joiningDate')} />
                    <FieldInput label="Department" value={form.department} onChange={setField('department')} />
                    <FieldInput label="Position" value={form.position} onChange={setField('position')} />
                    <PickerField label="Role" value={form.role} onChange={setField('role')}
                        options={['Intern', 'Employee', 'HR', 'Manager', 'GM', 'VP', 'Director']} />
                    <FieldInput label="Reporting Manager" value={form.reportingManager} onChange={setField('reportingManager')} />
                    <FieldInput label="Manager ID" value={String(form.managerId ?? '')} onChange={setField('managerId')} keyboardType="numeric" editable={false} />
                    <FieldInput label="Salary" value={String(form.salary ?? '0')} onChange={setField('salary')} keyboardType="numeric" />
                </SectionCard>

                {/* ── 6. Education ── */}
                <SectionCard title="Education" icon="school-outline">
                    <FieldInput label="12th Percentage" value={String(form.hscPercent ?? '0')} onChange={setField('hscPercent')} keyboardType="numeric" />
                    <FieldInput label="Graduation Course" value={form.graduationCourse} onChange={setField('graduationCourse')} />
                    <FieldInput label="Graduation %" value={String(form.graduationPercent ?? '0')} onChange={setField('graduationPercent')} keyboardType="numeric" />
                    <FieldInput label="Post Graduation Course" value={form.postGraduationCourse} onChange={setField('postGraduationCourse')} />
                    <FieldInput label="Post Graduation %" value={String(form.postGraduationPercent ?? '0')} onChange={setField('postGraduationPercent')} keyboardType="numeric" />
                    <FieldInput label="10th Marksheet File Path" value={form.tenthMarksheetFilePath} onChange={setField('tenthMarksheetFilePath')} />
                    <FieldInput label="12th Marksheet File Path" value={form.twelfthMarksheetFilePath} onChange={setField('twelfthMarksheetFilePath')} />
                    <FieldInput label="Graduation Marksheet File Path" value={form.graduationMarksheetFilePath} onChange={setField('graduationMarksheetFilePath')} />
                    <FieldInput label="Post Graduation Marksheet File Path" value={form.postGraduationMarksheetFilePath} onChange={setField('postGraduationMarksheetFilePath')} />
                </SectionCard>

                {/* ── 7. ID Proofs ── */}
                <SectionCard title="ID Proofs" icon="card-outline">
                    <FieldInput label="Aadhaar Number" value={form.aadhaarNumber} onChange={setField('aadhaarNumber')} keyboardType="numeric" />
                    <FieldInput label="PAN Number" value={form.panNumber} onChange={setField('panNumber')} />
                    <FieldInput label="Aadhaar File Path" value={form.aadhaarFilePath} onChange={setField('aadhaarFilePath')} />
                    <FieldInput label="PAN File Path" value={form.panFilePath} onChange={setField('panFilePath')} />
                </SectionCard>

                {/* ── 8. Bank Details ── */}
                <SectionCard title="Bank Details" icon="wallet-outline">
                    <FieldInput label="Account Holder Name" value={form.accountHolderName} onChange={setField('accountHolderName')} />
                    <FieldInput label="Bank Name" value={form.bankName} onChange={setField('bankName')} />
                    <FieldInput label="Account Number" value={form.accountNumber} onChange={setField('accountNumber')} keyboardType="numeric" />
                    <FieldInput label="IFSC" value={form.ifsc} onChange={setField('ifsc')} />
                    <FieldInput label="Branch" value={form.branch} onChange={setField('branch')} />
                    <FieldInput label="Passbook File Path" value={form.passbookFilePath} onChange={setField('passbookFilePath')} />
                </SectionCard>

                {/* ── 9. Emergency Contact ── */}
                <SectionCard title="Emergency Contact" icon="medkit-outline">
                    <FieldInput label="Contact Name" value={form.emergencyContactName} onChange={setField('emergencyContactName')} />
                    <FieldInput label="Relationship" value={form.emergencyContactRelationship} onChange={setField('emergencyContactRelationship')} />
                    <FieldInput label="Mobile" value={form.emergencyContactMobile} onChange={setField('emergencyContactMobile')} keyboardType="phone-pad" />
                    <FieldInput label="Address" value={form.emergencyContactAddress} onChange={setField('emergencyContactAddress')} multiline />
                </SectionCard>

                {/* Hidden fields – already included via originalEmployee merge */}
                <View style={{ display: 'none' }}>
                    <FieldInput label="Password Hash" value={form.passwordHash} onChange={() => { }} editable={false} />
                    <FieldInput label="Created At" value={form.createdAt} onChange={() => { }} editable={false} />
                    <FieldInput label="Status" value={form.status} onChange={() => { }} editable={false} />
                    <FieldInput label="Deactive Reason" value={form.deactiveReason} onChange={() => { }} editable={false} />
                    <FieldInput label="Comp Off Balance" value={String(form.compOffBalance)} onChange={() => { }} editable={false} />
                    <FieldInput label="Last Comp Off Earned Date" value={form.lastCompOffEarnedDate} onChange={() => { }} editable={false} />
                    <FieldInput label="Failed Login Attempts" value={String(form.failedLoginAttempts)} onChange={() => { }} editable={false} />
                    <FieldInput label="Lockout End UTC" value={form.lockoutEndUtc} onChange={() => { }} editable={false} />
                </View>

                {/* ── Save Button ── */}
                <TouchableOpacity
                    style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
                    onPress={handleSave}
                    disabled={saving}
                >
                    {saving
                        ? <ActivityIndicator color="#FFF" />
                        : <>
                            <Ionicons name="checkmark-circle-outline" size={20} color="#FFF" />
                            <Text style={styles.saveBtnText}>Save Changes</Text>
                        </>
                    }
                </TouchableOpacity>

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
};

// ─────────────────────────────────────────────────────────────
// Styles (unchanged)
// ─────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' },
    loadingText: { marginTop: 12, color: '#64748B', fontSize: 14, fontWeight: '600' },

    headerBgContainer: {
        overflow: 'hidden',
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        backgroundColor: theme.colors.primary,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 6,
    },
    headerGradient: { paddingBottom: 24 },
    headerTop: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, marginBottom: 12,
    },
    backButton: {
        width: 44, height: 44, borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center',
    },
    headerTitleText: { fontSize: 18, fontWeight: '800', color: '#FFF', letterSpacing: 0.5 },
    headerSubRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingBottom: 4 },
    headerSubText: { fontSize: 13, color: 'rgba(255,255,255,0.85)', fontWeight: '600' },

    scrollContent: { padding: 16, paddingTop: 24, paddingBottom: 40 },

    sectionCard: {
        backgroundColor: '#FFF', borderRadius: 24, marginBottom: 20,
        overflow: 'hidden', borderWidth: 1, borderColor: '#F1F5F9',
        shadowColor: '#0F172A', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04, shadowRadius: 10, elevation: 3,
    },
    sectionHeader: {
        flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20,
        paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F8FAFC',
        backgroundColor: '#F8FAFC',
    },
    sectionIconBg: {
        width: 32, height: 32, borderRadius: 10, backgroundColor: '#EFF6FF',
        alignItems: 'center', justifyContent: 'center', marginRight: 12,
    },
    sectionTitle: { fontSize: 14, fontWeight: '800', color: '#1E293B', letterSpacing: 0.5 },
    sectionBody: { padding: 20 },

    fieldWrap: { marginBottom: 18 },
    fieldLabel: { fontSize: 10, fontWeight: '800', color: '#94A3B8', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1.2 },
    input: {
        borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12,
        paddingHorizontal: 16, paddingVertical: Platform.OS === 'ios' ? 14 : 10,
        fontSize: 14, color: '#1E293B', backgroundColor: '#F8FAFC',
        fontWeight: '500',
    },
    inputMulti: { minHeight: 100, textAlignVertical: 'top' },
    inputReadonly: { backgroundColor: '#F1F5F9', color: '#64748B', borderColor: '#F1F5F9' },

    passwordRow: { flexDirection: 'row', alignItems: 'center' },
    passwordInput: { flex: 1, borderTopRightRadius: 0, borderBottomRightRadius: 0 },
    eyeBtn: {
        borderWidth: 1, borderColor: '#E2E8F0', borderLeftWidth: 0,
        borderTopRightRadius: 12, borderBottomRightRadius: 12,
        paddingHorizontal: 16, paddingVertical: Platform.OS === 'ios' ? 14 : 11,
        backgroundColor: '#FFF',
    },

    pickerBtn: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    pickerText: { fontSize: 14, color: '#1E293B', fontWeight: '500' },
    pickerPlaceholder: { fontSize: 14, color: '#94A3B8' },
    pickerDropdown: {
        borderWidth: 1, borderColor: '#F1F5F9', borderRadius: 12,
        backgroundColor: '#FFF', marginTop: 8, overflow: 'hidden',
        shadowColor: '#0F172A', shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1, shadowRadius: 20, elevation: 10,
        zIndex: 999,
    },
    pickerOption: { paddingVertical: 14, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#F8FAFC' },
    pickerOptionSelected: { backgroundColor: '#EFF6FF' },
    pickerOptionText: { fontSize: 14, color: '#334155', fontWeight: '500' },
    pickerOptionTextSelected: { color: theme.colors.primary, fontWeight: '700' },

    switchRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 12, backgroundColor: '#F8FAFC', padding: 12, borderRadius: 12 },
    switchLabel: { fontSize: 13, color: '#475569', flex: 1, fontWeight: '600' },

    saveBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
        backgroundColor: theme.colors.primary, borderRadius: 16,
        paddingVertical: 18, marginTop: 12,
        shadowColor: theme.colors.primary, shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3, shadowRadius: 12, elevation: 6,
    },
    saveBtnDisabled: { opacity: 0.6 },
    saveBtnText: { fontSize: 16, fontWeight: '800', color: '#FFF', letterSpacing: 0.5 },
});

export default EditProfileScreen;
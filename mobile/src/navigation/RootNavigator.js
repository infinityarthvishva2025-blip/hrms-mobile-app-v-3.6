import { NavigationContainer } from '@react-navigation/native';
import { ActivityIndicator, View } from 'react-native';
import theme from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import EmployeeNavigator from './EmployeeNavigator';
import HRNavigator from './HRNavigator';
import AuthStack from './AuthStack';

const RootNavigator = () => {
    const { token, role, loading } = useAuth();

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background }}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    const renderNavigator = () => {
        // Not logged in → show auth screens
        if (!token) {
            return <AuthStack />;
        }

        switch (role) {
            // Pure employee — standard employee tabs
            case 'Employee':
                case 'Intern':
                return <EmployeeNavigator />;

            // Manager = Employee + Daily Report Inbox
            // Uses EmployeeNavigator (which conditionally shows DailyReportInbox for Manager)
            case 'Manager':
                return <EmployeeNavigator />;

            // Admin-level roles — HR navigator (has all employee screens + admin screens)
            case 'HR':
            case 'Director':
            case 'VP':
            case 'GM':
                return <HRNavigator />;

            // Unknown role — safe fallback
            default:
                console.warn(`Unknown role "${role}", defaulting to Employee navigation`);
                return <EmployeeNavigator />;
        }
    };

    return (
        <NavigationContainer>
            {renderNavigator()}
        </NavigationContainer>
    );
};

export default RootNavigator;
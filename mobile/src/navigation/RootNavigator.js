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

    // Role-based navigation
    const renderNavigator = () => {
        // // Not logged in - show auth screens
        // return <AuthStack />;
        // // return <EmployeeNavigator />;
        // // return <HRNavigator />;

        // If no token → show auth screens
        if (!token) {
            // return <AuthStack />;
             return <EmployeeNavigator />;
        }

        // Logged in - show role-based navigation
        if (role === 'Employee') {
            return <EmployeeNavigator />;
        } else if (role === 'HR') {
            return <HRNavigator />;
        } else {
            // Fallback to Employee if role is undefined
            console.warn('Unknown role, defaulting to Employee navigation');
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

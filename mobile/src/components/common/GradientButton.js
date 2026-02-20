import React from 'react';
import { Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import theme from '../../constants/theme';

const GradientButton = ({
    onPress,
    title,
    colors = theme.colors.gradientPrimary, // Use theme gradient
    start = { x: 0, y: 0 },
    end = { x: 1, y: 0 },
    style,
    textStyle,
    disabled = false,
    loading = false,
    icon
}) => {
    return (
        <TouchableOpacity
            activeOpacity={0.8}
            onPress={onPress}
            disabled={disabled || loading}
            style={[styles.container, style]}
        >
            <LinearGradient
                colors={disabled ? ['#d1d5db', '#9ca3af'] : colors}
                start={start}
                end={end}
                style={styles.gradient}
            >
                {loading ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <>
                        {icon && icon}
                        <Text style={[styles.text, textStyle, icon && { marginLeft: 8 }]}>
                            {title}
                        </Text>
                    </>
                )}
            </LinearGradient>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        borderRadius: 16,
        overflow: 'hidden',
        width: '100%',
    },
    gradient: {
        paddingVertical: 14,
        paddingHorizontal: 20,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
    },
    text: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        letterSpacing: 0.5,
    },
});

export default GradientButton;
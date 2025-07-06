import { useEffect } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { Slot } from 'expo-router';
import { useAuth, AuthProvider } from '@/src/context/AuthContext';

const InitialLayout = () => {
    const { accessToken, isLoading } = useAuth();
    const segments = useSegments();
    const router = useRouter();

    useEffect(() => {
        if (isLoading) return;

        const inAuthGroup = segments[0] === '(app)';

        if (accessToken && !inAuthGroup) {
            router.replace('/(app)/(tabs)');
        } else if (!accessToken && inAuthGroup) {
            router.replace('/login');
        }
    }, [accessToken, isLoading, segments]);

    return <Slot />;
};

export default function RootLayout() {
    return (
        <AuthProvider>
            <InitialLayout />
        </AuthProvider>
    );
}
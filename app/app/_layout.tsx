import { useEffect } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { Slot } from 'expo-router';
import { useAuth, AuthProvider } from '@/src/context/AuthContext';

const InitialLayout = () => {
    const { userToken, isLoading } = useAuth();
    const segments = useSegments();
    const router = useRouter();

    useEffect(() => {
        if (isLoading) return;

        const inAuthGroup = segments[0] === '(app)';

        if (userToken && !inAuthGroup) {
            router.replace('/(app)/(tabs)');
        } else if (!userToken && inAuthGroup) {
            router.replace('/login');
        }
    }, [userToken, isLoading, segments]);

    return <Slot />;
};

export default function RootLayout() {
    return (
        <AuthProvider>
            <InitialLayout />
        </AuthProvider>
    );
}
'use client';

import React, { useEffect } from 'react';
import OneSignal from 'react-onesignal';

export function OneSignalProvider({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        const initializeOneSignal = async () => {
            const oneSignalAppId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
            if (oneSignalAppId) {
                await OneSignal.init({ appId: oneSignalAppId });
            } else {
                console.warn("OneSignal App ID is not configured. Push notifications will not be enabled.");
            }
        };

        initializeOneSignal();
    }, []);

    return <>{children}</>;
}

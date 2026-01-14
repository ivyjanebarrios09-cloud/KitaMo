'use client';

import { useEffect } from 'react';
import OneSignal from 'react-onesignal';

export default function OneSignalInit() {
  useEffect(() => {
    OneSignal.init({
      appId: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID!,
      allowLocalhostAsSecureOrigin: true, // remove in production if you want
      notifyButton: {
        enable: true,
      },
    });
  }, []);

  return null;
}

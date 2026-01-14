'use server';
/**
 * @fileOverview A flow for sending push notifications via OneSignal.
 *
 * - sendNotification - A function that sends a push notification to specified users.
 * - SendNotificationInput - The input type for the sendNotification function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import fetch from 'node-fetch';

const SendNotificationInputSchema = z.object({
  title: z.string().describe('The title of the notification.'),
  message: z.string().describe('The content of the notification.'),
  userIds: z.array(z.string()).describe('An array of user IDs to send the notification to.'),
  url: z.string().optional().describe('A URL to open when the notification is clicked.'),
});

export type SendNotificationInput = z.infer<typeof SendNotificationInputSchema>;

export async function sendNotification(input: SendNotificationInput): Promise<void> {
  return sendNotificationFlow(input);
}

const sendNotificationFlow = ai.defineFlow(
  {
    name: 'sendNotificationFlow',
    inputSchema: SendNotificationInputSchema,
    outputSchema: z.void(),
  },
  async (input) => {
    const { title, message, userIds, url } = input;

    const ONE_SIGNAL_APP_ID = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
    const ONE_SIGNAL_REST_API_KEY = process.env.ONESIGNAL_REST_API_KEY;

    if (!ONE_SIGNAL_APP_ID || !ONE_SIGNAL_REST_API_KEY) {
      console.error('OneSignal environment variables are not set.');
      return;
    }

    const notification = {
      app_id: ONE_SIGNAL_APP_ID,
      headings: { en: title },
      contents: { en: message },
      include_external_user_ids: userIds,
      // This targets users by the external_user_id we set during login
      target_channel: 'push',
      web_url: url,
    };

    try {
      const response = await fetch('https://onesignal.com/api/v1/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Authorization': `Basic ${ONE_SIGNAL_REST_API_KEY}`,
        },
        body: JSON.stringify(notification),
      });

      const data = await response.json();
      if (data.errors) {
        console.error('Error sending notification:', data.errors);
      } else {
        console.log('Successfully sent notification:', data);
      }
    } catch (error) {
      console.error('Failed to send notification:', error);
    }
  }
);

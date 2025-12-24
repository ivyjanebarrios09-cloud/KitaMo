# **App Name**: KitaClone

## Core Features:

- Landing Page: Display a clean landing page with app name, description, and call-to-action buttons for login and register.
- Login: Authenticate users with email and password using Firebase Authentication. Persist login state and redirect to the dashboard upon successful login.
- Registration: Allow new users to register with email and password, storing their information in Firestore. Handle password confirmation and error handling.
- Dashboard: Display user-specific data fetched from Firestore upon successful login. Implement session persistence with Firebase Auth to maintain the user's logged-in state, accessible only when authenticated.
- Authentication Middleware: Implement middleware to protect routes, redirecting unauthenticated users to the login page for enhanced security and controlled access.

## Style Guidelines:

- Primary color: Deep blue (#3F51B5) for a professional and trustworthy feel.
- Background color: Very light blue (#F0F4FF), almost white, to keep the design airy and clean.
- Accent color: Violet (#7E57C2) to highlight interactive elements and CTAs, offering a unique twist.
- Body and headline font: 'Inter' for a modern, neutral, and readable interface.
- Mobile-first, responsive layout with soft rounded cards and buttons for a modern, user-friendly interface. Ensure fast loading and smooth transitions.
- Use a consistent set of simple, modern icons throughout the interface to enhance usability.
- Add subtle animations on button hover and page transitions for a smooth and engaging user experience.
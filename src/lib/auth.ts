import { auth } from '@/firebase/server';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';

export async function login(email: string, password: string) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const idToken = await userCredential.user.getIdToken();
    
    // Set the cookie
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token: idToken }),
    });

    if (!response.ok) {
      throw new Error('Failed to set session cookie');
    }

    return userCredential.user;
  } catch (error) {
    throw error;
  }
}

export async function logout() {
  try {
    await signOut(auth);
    await fetch('/api/auth/logout', {
      method: 'POST',
    });
  } catch (error) {
    throw error;
  }
} 
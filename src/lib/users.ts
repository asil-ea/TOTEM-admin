import { db } from '@/firebase/server';
import { collection, doc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { generateTOTPSecret } from './totp';

interface NewUser {
  name: string;
  role: string;
}

function generateUID() {
  // Generate a random 8-character alphanumeric string
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let uid = '';
  for (let i = 0; i < 8; i++) {
    uid += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return uid;
}

export async function addUser(environment: string, userData: NewUser) {
  try {
    const uid = generateUID();
    const secret = generateTOTPSecret();
    const userRef = doc(collection(db, environment, 'users', 'data'), uid);
    
    await setDoc(userRef, {
      name: userData.name,
      role: userData.role,
      active: true,
      secret,
      uid,
    });

    return { success: true, secret, uid };
  } catch (error) {
    console.error('Error adding user:', error);
    throw new Error('Failed to add user');
  }
}

export async function toggleUserStatus(environment: string, uid: string, active: boolean) {
  try {
    const userRef = doc(db, environment, 'users', 'data', uid);
    await updateDoc(userRef, { active });
    return { success: true };
  } catch (error) {
    console.error('Error updating user status:', error);
    throw new Error('Failed to update user status');
  }
}

export async function deleteUser(environment: string, uid: string) {
  try {
    const userRef = doc(db, environment, 'users', 'data', uid);
    await deleteDoc(userRef);
    return { success: true };
  } catch (error) {
    console.error('Error deleting user:', error);
    throw new Error('Failed to delete user');
  }
} 
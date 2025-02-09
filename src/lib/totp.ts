import { authenticator } from 'otplib';

export function generateTOTPSecret() {
  return authenticator.generateSecret();
}

export function generateTOTPQRCodeUrl(secret: string, uid: string, issuer: string) {
  return authenticator.keyuri(`${uid}`, issuer, secret);
}

export function verifyTOTP(token: string, secret: string): boolean {
  try {
    return authenticator.verify({ token, secret });
  } catch {
    return false;
  }
} 
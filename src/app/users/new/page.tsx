'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import { addUser, deleteUser } from '@/lib/users';
import { generateTOTPQRCodeUrl, verifyTOTP } from '@/lib/totp';
import { useEnvironment } from '@/hooks/useEnvironment';
import { auth } from '@/firebase/server';
import { MainNav } from '@/components/layout/main-nav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, ArrowLeft, Copy, Check } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export default function NewUserPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    role: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<{ url: string; secret: string; uid: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState(false);
  const [showQRDialog, setShowQRDialog] = useState(false);
  const { environment } = useEnvironment(auth.currentUser?.email);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!environment) {
      setError('Environment not found');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const result = await addUser(environment, formData);
      const qrCodeUrl = generateTOTPQRCodeUrl(result.secret, result.uid, environment);
      setQrCode({ url: qrCodeUrl, secret: result.secret, uid: result.uid });
      setShowQRDialog(true);
    } catch (err) {
      console.error('Error adding user:', err);
      setError('Failed to add user');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerification = () => {
    if (!qrCode) return;

    const isValid = verifyTOTP(verificationCode, qrCode.secret);
    if (isValid) {
      setIsVerified(true);
      setVerificationError(null);
    } else {
      setVerificationError('Invalid verification code. Please try again.');
    }
  };

  const copySecret = () => {
    if (qrCode?.secret) {
      navigator.clipboard.writeText(qrCode.secret);
    }
  };

  const handleCloseDialog = async () => {
    if (!isVerified && qrCode && environment) {
      try {
        await deleteUser(environment, qrCode.uid);
      } catch (error) {
        console.error('Error cleaning up unverified user:', error);
      }
    }
    setShowQRDialog(false);
    if (!isVerified) {
      router.back();
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <MainNav userEmail={auth.currentUser?.email} onLogout={() => router.push('/login')} />
      
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-2xl font-semibold tracking-tight">Add New User</h2>
            <p className="text-sm text-muted-foreground">
              Create a new user and set up their TOTP authentication.
            </p>
          </div>
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </div>

        <Card>
          <form onSubmit={handleSubmit}>
            <CardHeader>
              <CardTitle>User Details</CardTitle>
              <CardDescription>
                Fill in the user&apos;s information to create their account.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter user's full name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, role: value }))}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Employee">Employee</SelectItem>
                    <SelectItem value="Admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create User
              </Button>
            </CardFooter>
          </form>
        </Card>

        <Dialog open={showQRDialog} onOpenChange={handleCloseDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>TOTP Setup</DialogTitle>
              <DialogDescription>
                Scan the QR code with an authenticator app to set up TOTP authentication. You must verify the code to complete registration.
              </DialogDescription>
            </DialogHeader>
            {qrCode && (
              <div className="space-y-6">
                <div className="flex flex-col items-center space-y-2">
                  <div className="p-2 bg-white rounded-lg">
                    <QRCodeSVG value={qrCode.url} size={200} />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    User ID: <span className="font-mono">{qrCode.uid}</span>
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <Input
                    value={qrCode.secret}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={copySecret}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>

                {!isVerified ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Verification Code</Label>
                      <div className="flex space-x-2">
                        <Input
                          value={verificationCode}
                          onChange={(e) => setVerificationCode(e.target.value)}
                          placeholder="Enter 6-digit code"
                          maxLength={6}
                        />
                        <Button onClick={handleVerification}>
                          Verify
                        </Button>
                      </div>
                    </div>
                    {verificationError && (
                      <Alert variant="destructive">
                        <AlertDescription>{verificationError}</AlertDescription>
                      </Alert>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center space-y-4">
                    <div className="flex items-center space-x-2 text-green-600">
                      <Check className="h-5 w-5" />
                      <span className="font-medium">TOTP Verified Successfully</span>
                    </div>
                    <Button onClick={() => router.back()}>
                      Done
                    </Button>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
} 
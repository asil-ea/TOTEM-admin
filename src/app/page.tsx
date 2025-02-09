'use client';

import { useRouter } from 'next/navigation';
import { logout } from '@/lib/auth';
import { useEffect, useState } from 'react';
import { auth } from '@/firebase/server';
import { onAuthStateChanged } from 'firebase/auth';
import { useEnvironment } from '@/hooks/useEnvironment';
import { useUsers } from '@/hooks/useUsers';
import { useAccessLogs } from '@/hooks/useAccessLogs';
import { MainNav } from '@/components/layout/main-nav';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, UserPlus, MoreVertical, Power, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toggleUserStatus, deleteUser } from '@/lib/users';

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState(auth.currentUser);
  const { environment, loading: envLoading, error: envError } = useEnvironment(user?.email);
  const { users, loading: usersLoading, error: usersError, mutate: mutateUsers } = useUsers(environment);
  const { logs, loading: logsLoading, error: logsError } = useAccessLogs(environment);
  const [selectedUser, setSelectedUser] = useState<{ uid: string; name: string } | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push('/login');
      } else {
        setUser(user);
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  };

  const handleToggleStatus = async (uid: string, active: boolean) => {
    if (!environment) return;
    
    try {
      setIsActionLoading(true);
      await toggleUserStatus(environment, uid, !active);
      mutateUsers();
    } catch (error) {
      console.error('Failed to toggle user status:', error);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!environment || !selectedUser) return;
    
    try {
      setIsActionLoading(true);
      await deleteUser(environment, selectedUser.uid);
      setShowDeleteDialog(false);
      mutateUsers();
    } catch (error) {
      console.error('Failed to delete user:', error);
    } finally {
      setIsActionLoading(false);
      setSelectedUser(null);
    }
  };

  if (!user) return null;

  const isLoading = envLoading || usersLoading || logsLoading;
  const hasError = envError || usersError || logsError;

  return (
    <div className="flex min-h-screen flex-col">
      <MainNav userEmail={user.email} onLogout={handleLogout} />
      
      <div className="flex-1 space-y-4 p-8 pt-6">
        {isLoading ? (
          <div className="flex h-[200px] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : hasError ? (
          <Alert variant="destructive">
            <AlertDescription>
              {envError || usersError || logsError}
            </AlertDescription>
          </Alert>
        ) : (
          <Tabs defaultValue="users" className="space-y-4">
            <div className="flex items-center justify-between">
              <TabsList>
                <TabsTrigger value="users">Users</TabsTrigger>
                <TabsTrigger value="logs">Access Logs</TabsTrigger>
              </TabsList>
              <Button onClick={() => router.push('/users/new')}>
                <UserPlus className="mr-2 h-4 w-4" />
                Add New User
              </Button>
            </div>
            
            <TabsContent value="users" className="space-y-4">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>UID</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.uid}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>{user.role}</TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            user.active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {user.active ? 'Active' : 'Inactive'}
                          </span>
                        </TableCell>
                        <TableCell className="font-mono">{user.uid}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                disabled={isActionLoading}
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => handleToggleStatus(user.uid, user.active)}
                              >
                                <Power className="mr-2 h-4 w-4" />
                                {user.active ? 'Deactivate' : 'Activate'}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => {
                                  setSelectedUser({ uid: user.uid, name: user.name });
                                  setShowDeleteDialog(true);
                                }}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
            
            <TabsContent value="logs" className="space-y-4">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>User ID</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>
                          {log.timestamp.toDate().toLocaleString()}
                        </TableCell>
                        <TableCell className="font-mono">{log.uid}</TableCell>
                        <TableCell>{log.action}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedUser?.name}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isActionLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteUser}
              disabled={isActionLoading}
            >
              {isActionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

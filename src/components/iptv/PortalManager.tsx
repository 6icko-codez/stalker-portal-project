'use client';

import React, { useState } from 'react';
import { useIPTVStore } from '@/lib/stores/useIPTVStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

export function PortalManager() {
  const { portals, activePortal, addPortal, removePortal, setActivePortal, updatePortal } =
    useIPTVStore();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFindingMAC, setIsFindingMAC] = useState(false);
  const [macAttempts, setMacAttempts] = useState(0);
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    macAddress: '',
    timezone: 'UTC',
  });

  const generateMAC = async () => {
    try {
      const response = await axios.get('/api/iptv/mac/generate');
      if (response.data.success) {
        setFormData((prev) => ({ ...prev, macAddress: response.data.macAddress }));
        toast.success('MAC address generated');
      }
    } catch (error) {
      toast.error('Failed to generate MAC address');
    }
  };

  const findWorkingMAC = async () => {
    if (!formData.url) {
      toast.error('Please enter a Portal URL first');
      return;
    }

    setIsFindingMAC(true);
    setMacAttempts(0);

    // Show progress toast
    const progressToast = toast.loading('Searching for working MAC address...');

    try {
      const response = await axios.post('/api/iptv/mac/generate-real', {
        portalUrl: formData.url,
        timezone: formData.timezone,
      });

      if (response.data.success) {
        setFormData((prev) => ({ ...prev, macAddress: response.data.macAddress }));
        toast.success(
          `Found working MAC after ${response.data.attempts} attempt(s)!`,
          { id: progressToast }
        );
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || 'Failed to find working MAC address';
      const attempts = error.response?.data?.attempts;
      toast.error(
        attempts ? `${errorMsg} (${attempts} attempts)` : errorMsg,
        { id: progressToast }
      );
    } finally {
      setIsFindingMAC(false);
      setMacAttempts(0);
    }
  };

  const testPortal = async (portal: typeof formData) => {
    setIsLoading(true);
    try {
      const response = await axios.post('/api/iptv/stalker/handshake', {
        portalUrl: portal.url,
        macAddress: portal.macAddress,
        timezone: portal.timezone,
      });

      if (response.data.success) {
        toast.success('Portal connection successful!');
        return true;
      }
      return false;
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Connection failed');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.url || !formData.macAddress) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsLoading(true);

    // Test connection first
    const isConnected = await testPortal(formData);

    const newPortal = {
      id: Date.now().toString(),
      name: formData.name,
      url: formData.url,
      macAddress: formData.macAddress,
      timezone: formData.timezone,
      isActive: true,
      status: isConnected ? ('connected' as const) : ('error' as const),
    };

    addPortal(newPortal);
    setActivePortal(newPortal);
    setIsOpen(false);
    setFormData({ name: '', url: '', macAddress: '', timezone: 'UTC' });
    setIsLoading(false);

    if (isConnected) {
      toast.success('Portal added successfully!');
    }
  };

  const handleTestConnection = async (portal: any) => {
    updatePortal(portal.id, { status: 'unknown' });
    const isConnected = await testPortal(portal);
    updatePortal(portal.id, {
      status: isConnected ? 'connected' : 'error',
    });
  };

  const handleDelete = (portalId: string) => {
    removePortal(portalId);
    toast.success('Portal removed');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Portal Management</h2>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Portal
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add Stalker Portal</DialogTitle>
              <DialogDescription>
                Enter your portal details to connect to your IPTV service
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Portal Name</Label>
                <Input
                  id="name"
                  placeholder="My IPTV Portal"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="url">Portal URL</Label>
                <Input
                  id="url"
                  placeholder="http://example.com:8080"
                  value={formData.url}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, url: e.target.value }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="mac">MAC Address</Label>
                <div className="flex gap-2">
                  <Input
                    id="mac"
                    placeholder="00:1A:79:XX:XX:XX"
                    value={formData.macAddress}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, macAddress: e.target.value }))
                    }
                  />
                  <Button type="button" variant="outline" onClick={generateMAC}>
                    Generate
                  </Button>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={findWorkingMAC}
                  disabled={isFindingMAC || !formData.url}
                  className="w-full"
                >
                  {isFindingMAC ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Finding Working MAC...
                    </>
                  ) : (
                    'Find Working MAC'
                  )}
                </Button>
                <p className="text-xs text-muted-foreground">
                  {isFindingMAC
                    ? 'Testing random MAC addresses against the portal...'
                    : 'Automatically finds a valid MAC address for your portal'}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Input
                  id="timezone"
                  placeholder="UTC"
                  value={formData.timezone}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, timezone: e.target.value }))
                  }
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={isLoading} className="flex-1">
                  {isLoading ? 'Testing...' : 'Add Portal'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsOpen(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {portals.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <WifiOff className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              No portals configured. Add a portal to get started.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {portals.map((portal) => (
            <Card
              key={portal.id}
              className={
                activePortal?.id === portal.id
                  ? 'ring-2 ring-primary'
                  : ''
              }
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {portal.name}
                      {portal.status === 'connected' ? (
                        <Wifi className="w-4 h-4 text-green-500" />
                      ) : portal.status === 'error' ? (
                        <WifiOff className="w-4 h-4 text-red-500" />
                      ) : null}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {portal.url}
                    </CardDescription>
                  </div>
                  <Badge
                    variant={
                      portal.status === 'connected'
                        ? 'default'
                        : portal.status === 'error'
                        ? 'destructive'
                        : 'secondary'
                    }
                  >
                    {portal.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">MAC:</span>{' '}
                    <code className="text-xs bg-muted px-1 py-0.5 rounded">
                      {portal.macAddress}
                    </code>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Timezone:</span>{' '}
                    {portal.timezone}
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setActivePortal(portal)}
                    disabled={activePortal?.id === portal.id}
                  >
                    {activePortal?.id === portal.id ? 'Active' : 'Activate'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleTestConnection(portal)}
                  >
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(portal.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

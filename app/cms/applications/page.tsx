'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAdminSession } from '@/hooks/useAdminSession';
import { ApplicationsListPanel } from './components/ApplicationsListPanel';
import { ApplicationDetailsPanel } from './components/ApplicationDetailsPanel';
import type { Application } from './types';

export default function ApplicationsPage() {
  const router = useRouter();
  const { admin, isLoading: isAuthLoading } = useAdminSession();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [showDeclineDialog, setShowDeclineDialog] = useState(false);
  const [declineReason, setDeclineReason] = useState('');
  const [pendingDeclineId, setPendingDeclineId] = useState<number | null>(null);
  const [messageDialog, setMessageDialog] = useState<{ open: boolean; title: string; message: string }>({
    open: false,
    title: '',
    message: '',
  });
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    confirmLabel: string;
    confirmVariant: 'default' | 'destructive';
  }>({
    open: false,
    title: '',
    description: '',
    confirmLabel: 'Confirm',
    confirmVariant: 'default',
  });
  const [pendingConfirmAction, setPendingConfirmAction] = useState<
    { type: 'approve'; id: number } | { type: 'status'; id: number; status: 'pending' | 'deleted' } | null
  >(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [dateFromFilter, setDateFromFilter] = useState<string>('');
  const [dateToFilter, setDateToFilter] = useState<string>('');

  useEffect(() => {
    if (!isAuthLoading && admin === null) {
      router.push('/cms/login');
    }
  }, [admin, isAuthLoading, router]);

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/applications');
        if (!response.ok) {
          setError('Failed to fetch applications');
          return;
        }

        const data = await response.json();
        setApplications(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, []);

  const getFilteredApplications = () => {
    return applications.filter((app) => {
      if (statusFilter && app.status !== statusFilter) return false;
      
      if (dateFromFilter) {
        const appDate = new Date(app.createdAt).toLocaleDateString('en-CA');
        if (appDate < dateFromFilter) return false;
      }
      
      if (dateToFilter) {
        const appDate = new Date(app.createdAt).toLocaleDateString('en-CA');
        if (appDate > dateToFilter) return false;
      }
      
      return true;
    });
  };

  const refreshApplications = async () => {
    const appResponse = await fetch('/api/applications');
    if (!appResponse.ok) return false;
    const updatedApps = await appResponse.json();
    setApplications(Array.isArray(updatedApps) ? updatedApps : []);
    setSelectedApplication(null);
    return true;
  };

  const approveApplication = async (id: number) => {
    try {
      const response = await fetch('/api/applications/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId: id,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        setMessageDialog({
          open: true,
          title: 'Error',
          message: `Failed to approve application: ${error.error || 'Unknown error'}`,
        });
        return;
      }

      await refreshApplications();

      setMessageDialog({
        open: true,
        title: 'Success',
        message: 'Application approved and email sent successfully',
      });
    } catch (error) {
      console.error('Error approving application:', error);
      setMessageDialog({
        open: true,
        title: 'Error',
        message: 'Failed to approve application',
      });
    }
  };

  const handleApprove = (id: number) => {
    setPendingConfirmAction({ type: 'approve', id });
    setConfirmDialog({
      open: true,
      title: 'Approve Application',
      description: 'Are you sure you want to approve this application?',
      confirmLabel: 'Approve',
      confirmVariant: 'default',
    });
  };

  const handleDeclineClick = (id: number) => {
    setPendingDeclineId(id);
    setDeclineReason('');
    setShowDeclineDialog(true);
  };

  const handleDeclineSubmit = async () => {
    if (!declineReason.trim()) {
      setMessageDialog({
        open: true,
        title: 'Missing Information',
        message: 'Please select a reason for declining',
      });
      return;
    }

    try {
      const response = await fetch('/api/applications/decline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId: pendingDeclineId,
          reason: declineReason,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        setMessageDialog({
          open: true,
          title: 'Error',
          message: `Failed to decline application: ${error.error || 'Unknown error'}`,
        });
        return;
      }

      await refreshApplications();

      setMessageDialog({
        open: true,
        title: 'Success',
        message: 'Application declined and email sent successfully',
      });
      setShowDeclineDialog(false);
      setDeclineReason('');
      setPendingDeclineId(null);
    } catch (error) {
      console.error('Error declining application:', error);
      setMessageDialog({
        open: true,
        title: 'Error',
        message: 'Failed to decline application',
      });
    }
  };

  const setApplicationStatus = async (id: number, status: 'pending' | 'deleted') => {
    try {
      const response = await fetch('/api/applications/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId: id,
          status,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        setMessageDialog({
          open: true,
          title: 'Error',
          message: `Failed to update status: ${error.error || 'Unknown error'}`,
        });
        return;
      }

      await refreshApplications();
      setMessageDialog({
        open: true,
        title: 'Success',
        message:
          status === 'deleted'
            ? 'Application deleted successfully'
            : 'Application status updated to pending',
      });
    } catch (error) {
      console.error('Error updating application status:', error);
      setMessageDialog({
        open: true,
        title: 'Error',
        message: 'Failed to update application status',
      });
    }
  };

  const handleSetStatus = (id: number, status: 'pending' | 'deleted') => {
    const isDelete = status === 'deleted';
    setPendingConfirmAction({ type: 'status', id, status });
    setConfirmDialog({
      open: true,
      title: isDelete ? 'Delete Application' : 'Set Pending Status',
      description: isDelete
        ? 'Are you sure you want to mark this application as deleted?'
        : 'Are you sure you want to set this application to pending?',
      confirmLabel: isDelete ? 'Delete' : 'Set Pending',
      confirmVariant: isDelete ? 'destructive' : 'default',
    });
  };

  const handleConfirmAction = async () => {
    if (!pendingConfirmAction) return;

    const action = pendingConfirmAction;
    setConfirmDialog((prev) => ({ ...prev, open: false }));
    setPendingConfirmAction(null);

    if (action.type === 'approve') {
      await approveApplication(action.id);
      return;
    }

    await setApplicationStatus(action.id, action.status);
  };

  if (isAuthLoading) {
    return null;
  }

  if (!admin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[92rem] mx-auto px-4 md:px-6 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Rental Applications</h1>
            <p className="text-sm text-gray-600 mt-1">Manage tenant rental applications</p>
          </div>
          <Link href="/cms" className="text-blue-600 hover:underline">
            ← Back to CMS
          </Link>
        </div>

        {error && (
          <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded mb-6">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading applications...</p>
          </div>
        ) : applications.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-600 mb-4">No applications yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-screen">
            <ApplicationsListPanel
              applications={getFilteredApplications()}
              selectedApplicationId={selectedApplication?.id ?? null}
              statusFilter={statusFilter}
              dateFromFilter={dateFromFilter}
              dateToFilter={dateToFilter}
              onStatusFilterChange={setStatusFilter}
              onDateFromFilterChange={setDateFromFilter}
              onDateToFilterChange={setDateToFilter}
              onClearDateFilters={() => {
                setDateFromFilter('');
                setDateToFilter('');
              }}
              onSelectApplication={setSelectedApplication}
            />
            <div className="lg:col-span-2">
              <ApplicationDetailsPanel
                selectedApplication={selectedApplication}
                onApprove={handleApprove}
                onDecline={handleDeclineClick}
                onSetPending={(id) => handleSetStatus(id, 'pending')}
                onDelete={(id) => handleSetStatus(id, 'deleted')}
              />
            </div>
          </div>
        )}

        {/* Decline Dialog */}
        <Dialog open={showDeclineDialog} onOpenChange={setShowDeclineDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Decline Application</DialogTitle>
              <DialogDescription>
                Please select a reason for declining this application.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-4">
              {[
                'Low household income',
                'Maxed out occupancy',
                'Pending approval for another applicant',
                'Other'
              ].map((reason) => (
                <label key={reason} className="flex items-center p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="radio"
                    name="decline-reason"
                    value={reason}
                    checked={declineReason === reason}
                    onChange={(e) => setDeclineReason(e.target.value)}
                    className="w-4 h-4 text-red-600 border-gray-300 focus:ring-red-500"
                  />
                  <span className="ml-3 text-sm text-gray-900">{reason}</span>
                </label>
              ))}
            </div>

            <DialogFooter>
              <Button
                onClick={() => {
                  setShowDeclineDialog(false);
                  setDeclineReason('');
                  setPendingDeclineId(null);
                }}
                variant="outline"
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeclineSubmit}
                variant="destructive"
                disabled={!declineReason.trim()}
              >
                Decline
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Confirmation Dialog */}
        <Dialog
          open={confirmDialog.open}
          onOpenChange={(open) => {
            setConfirmDialog((prev) => ({ ...prev, open }));
            if (!open) {
              setPendingConfirmAction(null);
            }
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{confirmDialog.title}</DialogTitle>
              <DialogDescription>{confirmDialog.description}</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setConfirmDialog((prev) => ({ ...prev, open: false }));
                  setPendingConfirmAction(null);
                }}
              >
                Cancel
              </Button>
              <Button variant={confirmDialog.confirmVariant} onClick={handleConfirmAction}>
                {confirmDialog.confirmLabel}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Message Dialog */}
        <Dialog open={messageDialog.open} onOpenChange={(open) => setMessageDialog({ ...messageDialog, open })}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{messageDialog.title}</DialogTitle>
            </DialogHeader>
            <p className="text-gray-700">{messageDialog.message}</p>
            <DialogFooter>
              <Button onClick={() => setMessageDialog({ ...messageDialog, open: false })}>
                OK
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

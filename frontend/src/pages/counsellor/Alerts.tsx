import React, { useEffect, useState } from 'react';
import { Button, Table, Spinner, Badge, Modal, Input } from '@/components/common';
import api from '@/services/api';
import toast from 'react-hot-toast';

export default function CounsellorAlerts() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<any>(null);
  const [remark, setRemark] = useState('');

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const res = await api.get('/counsellor/alerts');
      setAlerts(res.data.data?.alerts || res.data.data || []);
    } catch {
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAlerts(); }, []);

  const handleAddRemark = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAlert) return;
    try {
      await api.put(`/counsellor/alerts/${selectedAlert.id}`, { remarks: remark, resolved: true });
      toast.success('Remark added and alert resolved');
      setModalOpen(false);
      fetchAlerts();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error updating alert');
    }
  };

  const columns = [
    { key: 'student', header: 'Student', render: (item: any) => item.student?.user?.name || '-' },
    { key: 'type', header: 'Type', render: (item: any) => <Badge variant={item.type === 'LOW_ATTENDANCE' ? 'warning' : 'danger'}>{item.type}</Badge> },
    { key: 'message', header: 'Message', render: (item: any) => item.message },
    { key: 'resolved', header: 'Status', render: (item: any) => <Badge variant={item.resolved ? 'success' : 'warning'}>{item.resolved ? 'Resolved' : 'Pending'}</Badge> },
    {
      key: 'actions',
      header: 'Actions',
      render: (item: any) => !item.resolved ? (
        <Button size="sm" onClick={() => { setSelectedAlert(item); setRemark(''); setModalOpen(true); }}>Add Remark</Button>
      ) : null,
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Alerts</h1>
      {loading ? <Spinner /> : <Table columns={columns} data={alerts} />}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Add Remark">
        <form onSubmit={handleAddRemark} className="space-y-4">
          <p className="text-sm text-gray-600">Student: {selectedAlert?.student?.user?.name || '-'}</p>
          <p className="text-sm text-gray-600">Alert: {selectedAlert?.message || '-'}</p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Remark</label>
            <textarea className="w-full border rounded-md px-3 py-2 text-sm" rows={3} value={remark} onChange={(e) => setRemark(e.target.value)} required />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="secondary" onClick={() => setModalOpen(false)} type="button">Cancel</Button>
            <Button type="submit">Save & Resolve</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

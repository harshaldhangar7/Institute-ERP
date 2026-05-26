import React, { useEffect, useState } from 'react';
import { Button, Input, Modal, Table, Spinner, Badge } from '@/components/common';
import api from '@/services/api';
import toast from 'react-hot-toast';

export default function CounsellorFees() {
  const [fees, setFees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedFee, setSelectedFee] = useState<any>(null);
  const [paymentAmount, setPaymentAmount] = useState('');

  const fetchFees = async () => {
    setLoading(true);
    try {
      const res = await api.get('/counsellor/fees');
      setFees(res.data.data?.fees || res.data.data || []);
    } catch {
      setFees([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchFees(); }, []);

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFee) return;
    try {
      await api.post(`/counsellor/fees/${selectedFee.id}/payment`, { amount: Number(paymentAmount) });
      toast.success('Payment recorded');
      setModalOpen(false);
      fetchFees();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error recording payment');
    }
  };

  const columns = [
    { key: 'student', header: 'Student', render: (item: any) => item.student?.user?.name || '-' },
    { key: 'amount', header: 'Amount', render: (item: any) => `$${item.amount || 0}` },
    { key: 'dueDate', header: 'Due Date', render: (item: any) => item.dueDate?.split('T')[0] || '-' },
    {
      key: 'status',
      header: 'Status',
      render: (item: any) => <Badge variant={item.status === 'PAID' ? 'success' : item.status === 'OVERDUE' ? 'danger' : 'warning'}>{item.status}</Badge>,
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (item: any) => item.status !== 'PAID' ? (
        <Button size="sm" onClick={() => { setSelectedFee(item); setPaymentAmount(''); setModalOpen(true); }}>Record Payment</Button>
      ) : null,
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Fee Management</h1>
      {loading ? <Spinner /> : <Table columns={columns} data={fees} />}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Record Payment">
        <form onSubmit={handlePayment} className="space-y-4">
          <p className="text-sm text-gray-600">Student: {selectedFee?.student?.user?.name || '-'}</p>
          <p className="text-sm text-gray-600">Due Amount: ${selectedFee?.amount || 0}</p>
          <Input label="Payment Amount" type="number" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} required />
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="secondary" onClick={() => setModalOpen(false)} type="button">Cancel</Button>
            <Button type="submit">Record Payment</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

import React, { useEffect, useState, useCallback } from 'react';
import { Button, Input, Modal, Table, Spinner, Select, Card } from '@/components/common';
import { QRCodeSVG } from 'qrcode.react';
import api from '@/services/api';
import toast from 'react-hot-toast';

export default function TrainerLectures() {
  const [lectures, setLectures] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [activeLecture, setActiveLecture] = useState<any>(null);
  const [qrValue, setQrValue] = useState('');
  const [form, setForm] = useState({ topic: '', batchId: '', date: '' });

  const fetchLectures = async () => {
    setLoading(true);
    try {
      const res = await api.get('/trainer/lectures');
      setLectures(res.data.data?.lectures || res.data.data || []);
    } catch {
      setLectures([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchBatches = async () => {
    try {
      const res = await api.get('/trainer/batches');
      setBatches(res.data.data?.batches || res.data.data || []);
    } catch {
      setBatches([]);
    }
  };

  useEffect(() => { fetchLectures(); fetchBatches(); }, []);

  // QR code refresh every 10 seconds
  useEffect(() => {
    if (!activeLecture) return;
    const generateQr = () => {
      const timestamp = Date.now();
      const value = JSON.stringify({ lectureId: activeLecture.id, timestamp, token: Math.random().toString(36).substring(7) });
      setQrValue(value);
    };
    generateQr();
    const interval = setInterval(generateQr, 10000);
    return () => clearInterval(interval);
  }, [activeLecture]);

  const handleStartLecture = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/trainer/lectures', { ...form, status: 'ACTIVE' });
      toast.success('Lecture started');
      setModalOpen(false);
      const lecture = res.data.data;
      setActiveLecture(lecture);
      fetchLectures();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error starting lecture');
    }
  };

  const handleEndLecture = async () => {
    if (!activeLecture) return;
    try {
      await api.put(`/trainer/lectures/${activeLecture.id}`, { status: 'COMPLETED' });
      toast.success('Lecture ended');
      setActiveLecture(null);
      setQrValue('');
      fetchLectures();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error ending lecture');
    }
  };

  const columns = [
    { key: 'topic', header: 'Topic', render: (item: any) => item.topic },
    { key: 'batch', header: 'Batch', render: (item: any) => item.batch?.name || '-' },
    { key: 'date', header: 'Date', render: (item: any) => item.date?.split('T')[0] || '-' },
    { key: 'status', header: 'Status', render: (item: any) => item.status || '-' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Lectures</h1>
        <Button onClick={() => { setForm({ topic: '', batchId: '', date: new Date().toISOString().split('T')[0] }); setModalOpen(true); }}>
          Start New Lecture
        </Button>
      </div>

      {activeLecture && (
        <Card title={`Active Lecture: ${activeLecture.topic}`}>
          <div className="flex flex-col items-center space-y-4">
            <p className="text-sm text-gray-600">QR Code refreshes every 10 seconds. Students scan to mark attendance.</p>
            <div className="p-4 bg-white border-2 border-gray-200 rounded-lg">
              <QRCodeSVG value={qrValue} size={256} />
            </div>
            <Button variant="danger" onClick={handleEndLecture}>End Lecture</Button>
          </div>
        </Card>
      )}

      {loading ? <Spinner /> : <Table columns={columns} data={lectures} />}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Start New Lecture">
        <form onSubmit={handleStartLecture} className="space-y-4">
          <Input label="Topic" value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} required />
          <Select label="Batch" value={form.batchId} onChange={(e) => setForm({ ...form, batchId: e.target.value })} options={batches.map((b: any) => ({ value: b.id, label: b.name }))} />
          <Input label="Date" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="secondary" onClick={() => setModalOpen(false)} type="button">Cancel</Button>
            <Button type="submit">Start</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

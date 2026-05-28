import React, { useEffect, useState } from 'react';
import { Button, Input, Modal, Table, Spinner, Select, Card } from '@/components/common';
import { QRCodeSVG } from 'qrcode.react';
import api from '@/services/api';
import toast from 'react-hot-toast';

export default function TrainerLectures() {
  const [lectures, setLectures] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [modules, setModules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [activeLecture, setActiveLecture] = useState<any>(null);
  const [qrValue, setQrValue] = useState('');
  const [showQr, setShowQr] = useState(false);
  const [qrTimeLeft, setQrTimeLeft] = useState(0);
  const [form, setForm] = useState({
    topics: '',
    batchId: '',
    moduleId: '',
    date: '',
    startTime: '',
  });

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

  const fetchModulesForBatch = async (batchId: string) => {
    if (!batchId) {
      setModules([]);
      return;
    }
    try {
      const res = await api.get(`/trainer/batches/${batchId}/modules`);
      const data = res.data.data || [];
      setModules(data);
    } catch {
      setModules([]);
    }
  };

  useEffect(() => { fetchLectures(); fetchBatches(); }, []);

  // When batch changes, fetch its modules
  const handleBatchChange = (batchId: string) => {
    setForm((prev) => ({ ...prev, batchId, moduleId: '' }));
    fetchModulesForBatch(batchId);
  };

  // QR code refresh every 10 seconds, available for 5 minutes after ending lecture
  useEffect(() => {
    if (!showQr) return;
    const generateQr = () => {
      const timestamp = Date.now();
      const value = JSON.stringify({ lectureId: activeLecture?.id, timestamp, token: Math.random().toString(36).substring(7) });
      setQrValue(value);
    };
    generateQr();
    const refreshInterval = setInterval(generateQr, 10000);

    // 5 minute countdown
    setQrTimeLeft(300);
    const countdownInterval = setInterval(() => {
      setQrTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          clearInterval(refreshInterval);
          setShowQr(false);
          setQrValue('');
          setActiveLecture(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(refreshInterval);
      clearInterval(countdownInterval);
    };
  }, [showQr]);

  const handleStartLecture = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.batchId) {
      toast.error('Please select a batch');
      return;
    }
    if (!form.moduleId) {
      toast.error('Please select a module');
      return;
    }
    try {
      const res = await api.post('/trainer/lectures', form);
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
      await api.put(`/trainer/lectures/${activeLecture.id}/end`);
      toast.success('Lecture ended. QR code available for 5 minutes.');
      setShowQr(true);
      fetchLectures();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error ending lecture');
    }
  };

  const openStartModal = () => {
    const now = new Date();
    const timeStr = now.toTimeString().slice(0, 5);
    setForm({
      topics: '',
      batchId: '',
      moduleId: '',
      date: now.toISOString().split('T')[0],
      startTime: timeStr,
    });
    setModules([]);
    setModalOpen(true);
  };

  const columns = [
    { key: 'topic', header: 'Topic', render: (item: any) => item.topics || '-' },
    { key: 'batch', header: 'Batch', render: (item: any) => item.batch?.name || '-' },
    { key: 'module', header: 'Module', render: (item: any) => item.module?.name || '-' },
    { key: 'date', header: 'Date', render: (item: any) => item.date?.split('T')[0] || '-' },
    { key: 'startTime', header: 'Time', render: (item: any) => item.startTime ? `${item.startTime} - ${item.endTime || '...'}` : '-' },
    { key: 'duration', header: 'Duration', render: (item: any) => {
      if (!item.duration) return '-';
      const hours = Math.floor(item.duration / 60);
      const mins = item.duration % 60;
      return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
    }},
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Lectures</h1>
        <Button onClick={openStartModal}>Start New Lecture</Button>
      </div>

      {activeLecture && !showQr && (
        <Card title={`Active Lecture: ${activeLecture.topics || 'Untitled'}`}>
          <div className="flex flex-col items-center space-y-4">
            <p className="text-sm text-gray-600">Lecture is in progress. Click "End Lecture" to generate QR code for attendance.</p>
            <Button variant="danger" onClick={handleEndLecture}>End Lecture</Button>
          </div>
        </Card>
      )}

      {showQr && (
        <Card title="Scan QR Code for Attendance">
          <div className="flex flex-col items-center space-y-4">
            <p className="text-sm text-gray-600">
              Students can scan this QR code to mark attendance. Expires in{' '}
              <span className="font-semibold text-indigo-600">
                {Math.floor(qrTimeLeft / 60)}:{String(qrTimeLeft % 60).padStart(2, '0')}
              </span>
            </p>
            <div className="p-4 bg-white border-2 border-gray-200 rounded-lg">
              <QRCodeSVG value={qrValue} size={256} />
            </div>
            <Button variant="secondary" onClick={() => { setShowQr(false); setQrValue(''); setActiveLecture(null); }}>
              Dismiss
            </Button>
          </div>
        </Card>
      )}

      {loading ? <Spinner /> : <Table columns={columns} data={lectures} />}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Start New Lecture">
        <form onSubmit={handleStartLecture} className="space-y-4">
          <Input label="Topic" value={form.topics} onChange={(e) => setForm({ ...form, topics: e.target.value })} required />
          <Select
            label="Batch"
            value={form.batchId}
            onChange={(e) => handleBatchChange(e.target.value)}
            options={batches.map((b: any) => ({ value: b.id, label: b.name }))}
          />
          <Select
            label="Module"
            value={form.moduleId}
            onChange={(e) => setForm({ ...form, moduleId: e.target.value })}
            options={modules.map((m: any) => ({ value: m.moduleId || m.module?.id || m.id, label: m.module?.name || m.name }))}
          />
          {form.batchId && modules.length === 0 && (
            <p className="text-xs text-amber-600">No modules assigned to this batch. Please assign modules from Admin panel first.</p>
          )}
          <Input label="Date" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
          <Input label="Start Time" type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} required />
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="secondary" onClick={() => setModalOpen(false)} type="button">Cancel</Button>
            <Button type="submit">Start</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

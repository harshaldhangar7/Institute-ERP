import React, { useEffect, useState, useRef } from 'react';
import { Button, Card, Spinner, Badge, Table } from '@/components/common';
import api from '@/services/api';
import toast from 'react-hot-toast';

export default function StudentAttendance() {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [marking, setMarking] = useState(false);
  const scannerRef = useRef<any>(null);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await api.get('/student/attendance');
      setHistory(res.data.data?.records || res.data.data?.attendance || []);
    } catch {
      setHistory([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchHistory(); }, []);

  const startScanner = async () => {
    setScanning(true);
    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      const scanner = new Html5Qrcode('qr-reader');
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        async (decodedText) => {
          try {
            const data = JSON.parse(decodedText);
            await api.post('/attendance/mark', { lectureId: data.lectureId, qrToken: data.token });
            toast.success('Attendance marked successfully!');
            scanner.stop();
            setScanning(false);
            fetchHistory();
          } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to mark attendance');
          }
        },
        () => {}
      );
    } catch {
      toast.error('Could not access camera');
      setScanning(false);
    }
  };

  const stopScanner = () => {
    if (scannerRef.current) {
      scannerRef.current.stop();
      scannerRef.current = null;
    }
    setScanning(false);
  };

  const markOnline = async () => {
    setMarking(true);
    try {
      await api.post('/student/attendance/mark');
      toast.success('Attendance marked');
      fetchHistory();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error marking attendance');
    } finally {
      setMarking(false);
    }
  };

  const columns = [
    { key: 'date', header: 'Date', render: (item: any) => item.lecture?.date?.split('T')[0] || item.markedAt?.split('T')[0] || '-' },
    { key: 'topic', header: 'Topic', render: (item: any) => item.lecture?.topic || '-' },
    { key: 'status', header: 'Status', render: (item: any) => <Badge variant={item.status === 'PRESENT' ? 'success' : 'danger'}>{item.status}</Badge> },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Attendance</h1>

      <Card title="Mark Attendance">
        <div className="flex flex-col items-center space-y-4">
          {scanning ? (
            <>
              <div id="qr-reader" className="w-full max-w-sm" />
              <Button variant="danger" onClick={stopScanner}>Stop Scanner</Button>
            </>
          ) : (
            <div className="flex gap-4">
              <Button onClick={startScanner}>Scan QR Code</Button>
              <Button variant="secondary" onClick={markOnline} loading={marking}>Mark Online</Button>
            </div>
          )}
        </div>
      </Card>

      <Card title="Attendance History">
        {loading ? <Spinner /> : <Table columns={columns} data={history} />}
      </Card>
    </div>
  );
}

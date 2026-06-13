import React, { useEffect, useState, useRef } from 'react';
import { Button, Card, Spinner, Badge, Table } from '@/components/common';
import api from '@/services/api';
import toast from 'react-hot-toast';

export default function StudentAttendance() {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
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

  // Just flip into scanning mode so the #qr-reader element gets rendered.
  // The scanner itself is started by the effect below, once the DOM node exists.
  const startScanner = () => setScanning(true);

  // Start the camera only after the #qr-reader container is actually in the DOM.
  useEffect(() => {
    if (!scanning) return;

    let cancelled = false;

    const run = async () => {
      // Camera APIs require a secure context (HTTPS or localhost).
      if (!window.isSecureContext && window.location.hostname !== 'localhost') {
        toast.error('Camera requires HTTPS (or localhost). Open the site over https://.');
        setScanning(false);
        return;
      }
      if (!navigator.mediaDevices?.getUserMedia) {
        toast.error('Camera not supported in this browser.');
        setScanning(false);
        return;
      }

      try {
        const { Html5Qrcode } = await import('html5-qrcode');
        if (cancelled) return;
        const scanner = new Html5Qrcode('qr-reader');
        scannerRef.current = scanner;
        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          async (decodedText) => {
            try {
              const data = JSON.parse(decodedText);
              await api.post('/attendance/mark-qr', {
                lectureId: data.lectureId,
                token: data.token,
                timestamp: data.timestamp,
              });
              toast.success('Attendance marked successfully!');
              await scanner.stop();
              scannerRef.current = null;
              setScanning(false);
              fetchHistory();
            } catch (err: any) {
              toast.error(err.response?.data?.error || err.response?.data?.message || 'Failed to mark attendance');
            }
          },
          () => {}
        );
      } catch (err: any) {
        if (cancelled) return;
        // Surface the real reason instead of a blanket message.
        const name = err?.name;
        let message = 'Could not access camera';
        if (name === 'NotAllowedError') message = 'Camera permission denied. Allow access and retry.';
        else if (name === 'NotFoundError') message = 'No camera found on this device.';
        else if (name === 'NotReadableError') message = 'Camera is already in use by another app.';
        else if (err?.message) message = err.message;
        // eslint-disable-next-line no-console
        console.error('QR scanner start failed:', err);
        toast.error(message);
        setScanning(false);
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [scanning]);

  const stopScanner = () => {
    const scanner = scannerRef.current;
    if (scanner) {
      // stop() returns a promise; ignore failures if it was never running.
      Promise.resolve(scanner.stop()).catch(() => {});
      scannerRef.current = null;
    }
    setScanning(false);
  };

  // Ensure the camera is released if the user navigates away mid-scan.
  useEffect(() => {
    return () => {
      const scanner = scannerRef.current;
      if (scanner) {
        Promise.resolve(scanner.stop()).catch(() => {});
        scannerRef.current = null;
      }
    };
  }, []);

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

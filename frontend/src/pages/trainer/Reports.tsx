import React, { useEffect, useState } from 'react';
import { Button, Select, Card, Spinner } from '@/components/common';
import api from '@/services/api';
import toast from 'react-hot-toast';

export default function TrainerReports() {
  const [batches, setBatches] = useState<any[]>([]);
  const [selectedBatch, setSelectedBatch] = useState('');
  const [reportType, setReportType] = useState('attendance');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchBatches = async () => {
      try {
        const res = await api.get('/trainer/batches');
        setBatches(res.data.data?.batches || res.data.data || []);
      } catch {
        setBatches([]);
      }
    };
    fetchBatches();
  }, []);

  const handleDownload = async (format: string) => {
    if (!selectedBatch) {
      toast.error('Please select a batch');
      return;
    }
    setLoading(true);
    try {
      const res = await api.get(`/reports/${reportType}`, {
        params: { batchId: selectedBatch, format },
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${reportType}-report.${format === 'pdf' ? 'pdf' : 'xlsx'}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Report downloaded');
    } catch (err: any) {
      toast.error('Error downloading report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Reports</h1>

      <Card>
        <div className="space-y-4">
          <Select
            label="Select Batch"
            value={selectedBatch}
            onChange={(e) => setSelectedBatch(e.target.value)}
            options={batches.map((b: any) => ({ value: b.id, label: b.name }))}
          />
          <Select
            label="Report Type"
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            options={[
              { value: 'attendance', label: 'Attendance Report' },
              { value: 'marks', label: 'Marks Report' },
              { value: 'progress', label: 'Batch Progress Report' },
            ]}
          />
          <div className="flex gap-3 pt-4">
            <Button onClick={() => handleDownload('pdf')} loading={loading}>Download PDF</Button>
            <Button variant="secondary" onClick={() => handleDownload('excel')} loading={loading}>Download Excel</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

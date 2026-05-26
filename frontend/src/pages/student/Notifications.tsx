import React, { useEffect, useState } from 'react';
import { Button, Spinner, Card, Badge } from '@/components/common';
import api from '@/services/api';
import toast from 'react-hot-toast';

export default function StudentNotifications() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data.data?.notifications || res.data.data || []);
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchNotifications(); }, []);

  const markAsRead = async (id: string) => {
    try {
      await api.put(`/notifications/${id}/read`);
      toast.success('Marked as read');
      fetchNotifications();
    } catch {
      toast.error('Error updating notification');
    }
  };

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
      {notifications.length === 0 ? (
        <Card><p className="text-gray-500 text-center">No notifications</p></Card>
      ) : (
        <div className="space-y-3">
          {notifications.map((n: any) => (
            <Card key={n.id} className={n.read ? 'opacity-60' : ''}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-sm">{n.title}</h3>
                    {!n.read && <Badge variant="info">New</Badge>}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{n.message}</p>
                  <p className="text-xs text-gray-400 mt-1">{n.createdAt?.split('T')[0] || ''}</p>
                </div>
                {!n.read && (
                  <Button size="sm" variant="ghost" onClick={() => markAsRead(n.id)}>Mark Read</Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { Button, Input, Modal, Table, Spinner } from '@/components/common';
import api from '@/services/api';
import toast from 'react-hot-toast';

export default function AdminCourses() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: '', description: '' });

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/courses');
      setCourses(res.data.data?.courses || res.data.data || []);
    } catch {
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCourses(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editing) {
        await api.put(`/admin/courses/${editing.id}`, form);
        toast.success('Course updated');
      } else {
        await api.post('/admin/courses', form);
        toast.success('Course created');
      }
      setModalOpen(false);
      setEditing(null);
      fetchCourses();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error saving course');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this course? Batches will be unlinked but not deleted.')) return;
    try {
      await api.delete(`/admin/courses/${id}`);
      toast.success('Course deleted');
      fetchCourses();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error deleting course');
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', description: '' });
    setModalOpen(true);
  };

  const openEdit = (course: any) => {
    setEditing(course);
    setForm({ name: course.name || '', description: course.description || '' });
    setModalOpen(true);
  };

  const columns = [
    { key: 'name', header: 'Name', render: (item: any) => item.name },
    { key: 'description', header: 'Description', render: (item: any) => item.description || '-' },
    { key: 'batches', header: 'Batches', render: (item: any) => item.batches?.map((b: any) => b.name).join(', ') || '-' },
    {
      key: 'actions',
      header: 'Actions',
      render: (item: any) => (
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" onClick={() => openEdit(item)}>Edit</Button>
          <Button size="sm" variant="danger" onClick={() => handleDelete(item.id)}>Delete</Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Courses</h1>
        <Button onClick={openCreate}>Add Course</Button>
      </div>

      {loading ? <Spinner /> : <Table columns={columns} data={courses} />}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Course' : 'Add Course'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <Input label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="secondary" onClick={() => setModalOpen(false)} type="button">Cancel</Button>
            <Button type="submit">{editing ? 'Update' : 'Create'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

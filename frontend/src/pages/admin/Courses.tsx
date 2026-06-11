import React, { useEffect, useState } from 'react';
import { Button, Input, Modal, Table, Spinner, Card, Badge } from '@/components/common';
import { MultiSelect } from '@/components/common/MultiSelect';
import api from '@/services/api';
import toast from 'react-hot-toast';

export default function AdminCourses() {
  const [courses, setCourses] = useState<any[]>([]);
  const [modules, setModules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: '', description: '', duration: '', moduleIds: [] as string[] });

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

  const fetchModules = async () => {
    try {
      const res = await api.get('/admin/modules');
      setModules(res.data.data?.modules || res.data.data || []);
    } catch {
      setModules([]);
    }
  };

  useEffect(() => { fetchCourses(); fetchModules(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        name: form.name,
        description: form.description || undefined,
        duration: form.duration ? Number(form.duration) : undefined,
        moduleIds: form.moduleIds,
      };
      if (editing) {
        await api.put(`/admin/courses/${editing.id}`, payload);
        toast.success('Course updated');
      } else {
        await api.post('/admin/courses', payload);
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
    if (!confirm('Delete this course? Batches linked to it will be unlinked.')) return;
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
    setForm({ name: '', description: '', duration: '', moduleIds: [] });
    setModalOpen(true);
  };

  const openEdit = (course: any) => {
    setEditing(course);
    setForm({
      name: course.name || '',
      description: course.description || '',
      duration: course.duration?.toString() || '',
      moduleIds: course.modules?.map((m: any) => m.id) || [],
    });
    setModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Courses</h1>
        <Button onClick={openCreate}>Create Course</Button>
      </div>

      {loading ? <Spinner /> : courses.length === 0 ? (
        <Card>
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">No courses created yet. Create a course to group modules together.</p>
            <Button onClick={openCreate}>Create Your First Course</Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {courses.map((course: any) => (
            <Card key={course.id}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{course.name}</h3>
                  {course.description && <p className="text-sm text-gray-500 mt-1">{course.description}</p>}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" onClick={() => openEdit(course)}>Edit</Button>
                  <Button size="sm" variant="danger" onClick={() => handleDelete(course.id)}>Delete</Button>
                </div>
              </div>

              <div className="flex items-center gap-4 mb-3 text-sm text-gray-600">
                {course.duration && <span>Duration: {course.duration} hrs</span>}
                <span>{course.modules?.length || 0} modules</span>
                <span>{course.batchCount || 0} batch{(course.batchCount || 0) !== 1 ? 'es' : ''} running</span>
              </div>

              {course.modules?.length > 0 && (
                <div className="border-t pt-3">
                  <p className="text-xs font-medium text-gray-500 uppercase mb-2">Modules (in order)</p>
                  <div className="flex flex-wrap gap-2">
                    {course.modules.map((mod: any, idx: number) => (
                      <span key={mod.id} className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded text-sm">
                        <span className="text-xs text-indigo-400">{idx + 1}.</span>
                        {mod.name}
                        {mod.duration && <span className="text-xs text-indigo-400">({mod.duration}h)</span>}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {course.batches?.length > 0 && (
                <div className="border-t pt-3 mt-3">
                  <p className="text-xs font-medium text-gray-500 uppercase mb-2">Batches using this course</p>
                  <div className="flex flex-wrap gap-2">
                    {course.batches.map((batch: any) => (
                      <Badge key={batch.id} variant={batch.isActive ? 'success' : 'default'}>{batch.name}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Course' : 'Create Course'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Course Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="e.g. Full Stack Web Development" />
          <Input label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Brief description of the course" />
          <Input label="Total Duration (hours)" type="number" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} placeholder="e.g. 480" />
          <MultiSelect
            label="Modules (select in order)"
            options={modules.map((m: any) => ({ value: m.id, label: `${m.name}${m.duration ? ` (${m.duration}h)` : ''}` }))}
            value={form.moduleIds}
            onChange={(moduleIds) => setForm({ ...form, moduleIds })}
          />
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="secondary" onClick={() => setModalOpen(false)} type="button">Cancel</Button>
            <Button type="submit">{editing ? 'Update' : 'Create'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

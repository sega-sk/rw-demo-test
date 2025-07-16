import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/UI/Button';
import FormField from '../../components/Forms/FormField';
import Input from '../../components/Forms/Input';
import Select from '../../components/Forms/Select';
import NotificationBanner from '../../components/UI/NotificationBanner';
import { apiService } from '../../services/api';

export default function AddUser() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'user',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (alert) setAlert(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlert(null);
    if (!formData.email.trim() || !formData.password.trim()) {
      setAlert({ type: 'error', message: 'Email and password are required.' });
      return;
    }
    setIsSubmitting(true);
    try {
      await apiService.createUser(formData);
      setAlert({ type: 'success', message: 'User created successfully!' });
      setTimeout(() => navigate('/admin/users'), 1200);
    } catch (err: any) {
      setAlert({ type: 'error', message: err?.message || 'Failed to create user. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Add User</h1>
      {alert && (
        <NotificationBanner
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert(null)}
          className="mb-4"
        />
      )}
      <form className="space-y-6 bg-white p-6 rounded-lg shadow" onSubmit={handleSubmit}>
        <FormField label="Email" required>
          <Input
            name="email"
            type="email"
            value={formData.email}
            onChange={handleInputChange}
            required
            autoFocus
          />
        </FormField>
        <FormField label="Password" required>
          <Input
            name="password"
            type="password"
            value={formData.password}
            onChange={handleInputChange}
            required
          />
        </FormField>
        <FormField label="Role" required>
          <Select
            name="role"
            value={formData.role}
            onChange={handleInputChange}
            options={[
              { value: 'user', label: 'User' },
              { value: 'admin', label: 'Admin' },
            ]}
            required
          />
        </FormField>
        <div className="flex justify-end space-x-4">
          <Button variant="outline" type="button" onClick={() => navigate('/admin/users')}>
            Cancel
          </Button>
          <Button type="submit" loading={isSubmitting}>
            Save
          </Button>
        </div>
      </form>
    </div>
  );
}

// This file is already a standalone page for adding a user.

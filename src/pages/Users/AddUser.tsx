import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/UI/Button';
import FormField from '../../components/Forms/FormField';
import Input from '../../components/Forms/Input';
// import { apiService } from '../../services/api'; // Uncomment and implement createUser as needed

export default function AddUser() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    // Add more fields as needed
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // await apiService.createUser(formData);
    alert('User created (demo only)');
    navigate('/admin/users');
  };

  return (
    <div className="max-w-2xl mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Add User</h1>
      <form className="space-y-6" onSubmit={handleSubmit}>
        <FormField label="Name" required>
          <Input
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            required
          />
        </FormField>
        <FormField label="Email" required>
          <Input
            name="email"
            type="email"
            value={formData.email}
            onChange={handleInputChange}
            required
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
        <div className="flex justify-end space-x-4">
          <Button variant="outline" type="button" onClick={() => navigate('/admin/users')}>
            Cancel
          </Button>
          <Button type="submit">
            Save
          </Button>
        </div>
      </form>
    </div>
  );
}

// This file is already a standalone page for adding a user.

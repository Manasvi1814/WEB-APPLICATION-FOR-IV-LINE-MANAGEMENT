import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface Department {
  id: string;
  name: string;
  password: string;
}

const LoginPage: React.FC = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDeptId, setSelectedDeptId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingDepts, setLoadingDepts] = useState(true);

  const navigate = useNavigate();
  const { setDepartment } = useAuth();

  useEffect(() => {
    const loadDepartments = async () => {
      setLoadingDepts(true);
      const { data, error } = await supabase
        .from('departments')
        .select('id, name, password')
        .order('name', { ascending: true });
      if (error) console.error(error);
      else {
        setDepartments(data);
        if (data.length > 0) setSelectedDeptId(data[0].id);
      }
      setLoadingDepts(false);
    };
    loadDepartments();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    const dept = departments.find((d) => d.id === selectedDeptId);
    if (!dept) {
      setError('Please select a department');
      setIsSubmitting(false);
      return;
    }

    if (dept.password !== password) {
      setError('Incorrect password for selected department');
      setIsSubmitting(false);
      return;
    }

    setDepartment({ id: dept.id, name: dept.name });
    navigate('/patients');
  };

  if (loadingDepts) return <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin h-10 w-10 border-b-2 border-blue-600 rounded-full"></div>
  </div>;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md bg-white shadow-xl rounded-lg p-8">
        <h1 className="text-2xl font-bold text-center mb-6">Department Login</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-2">Department</label>
            <select
              id="department"
              value={selectedDeptId}
              onChange={e => setSelectedDeptId(e.target.value)}
              className="w-full border p-2 rounded"
              required
            >
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">Department Password</label>
            <input
              type="password"
              id="password"
              placeholder="Enter department password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full border p-2 rounded"
              required
            />
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition disabled:opacity-50">
            {isSubmitting ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
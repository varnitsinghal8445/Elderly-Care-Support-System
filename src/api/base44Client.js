// Flask Backend API Client
const API_BASE_URL = 'http://localhost:5000/api';

class Base44Client {
  constructor() {
    this.auth = {
      me: async () => {
        const response = await fetch(`${API_BASE_URL}/auth/me`, {
          credentials: 'include'
        });
        if (!response.ok) throw new Error('Failed to fetch user');
        return await response.json();
      },
      updateMe: async (data) => {
        const response = await fetch(`${API_BASE_URL}/auth/me`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error('Failed to update profile');
        return await response.json();
      },
      logout: async () => {
        await fetch(`${API_BASE_URL}/auth/logout`, { 
          method: 'POST',
          credentials: 'include'
        });
        localStorage.clear();
        console.log('Logout called');
        window.location.href = '/login';
      }
    };

    this.entities = {
      Medicine: this.createEntity('medicines'),
      MedicineSchedule: this.createEntity('schedules'),
      Stock: this.createEntity('stocks'),
      IntakeLog: this.createEntity('logs'),
      Notification: this.createEntity('notifications'),
    };
  }

  createEntity(endpoint) {
    return {
      filter: async (filters = {}, sort = '-created_date', limit = null) => {
        const params = new URLSearchParams();
        
        // Add filters as query params
        Object.keys(filters).forEach(key => {
          params.append(key, filters[key]);
        });
        
        if (limit) {
          params.append('limit', limit);
        }

        const response = await fetch(`${API_BASE_URL}/${endpoint}?${params}`, {
          credentials: 'include'
        });
        if (!response.ok) throw new Error(`Failed to fetch ${endpoint}`);
        return await response.json();
      },

      create: async (data) => {
        const response = await fetch(`${API_BASE_URL}/${endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error(`Failed to create ${endpoint}`);
        return await response.json();
      },

      update: async (id, data) => {
        const response = await fetch(`${API_BASE_URL}/${endpoint}/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error(`Failed to update ${endpoint}`);
        return await response.json();
      },

      delete: async (id) => {
        const response = await fetch(`${API_BASE_URL}/${endpoint}/${id}`, {
          method: 'DELETE',
          credentials: 'include'
        });
        if (!response.ok) throw new Error(`Failed to delete ${endpoint}`);
        return await response.json();
      },

      get: async (id) => {
        const response = await fetch(`${API_BASE_URL}/${endpoint}/${id}`, {
          credentials: 'include'
        });
        if (!response.ok) throw new Error(`Failed to get ${endpoint}`);
        return await response.json();
      }
    };
  }
}

export const base44 = new Base44Client();

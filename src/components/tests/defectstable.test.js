import React from 'react';

const { JSDOM } = require('jsdom');
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
global.window = dom.window;
global.document = dom.window.document;
global.navigator = dom.window.navigator;

const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

global.fetch = jest.fn();

const { render, screen, fireEvent, waitFor, act } = require('@testing-library/react');
require('@testing-library/jest-dom');
const DefectsTable = require('../defectstable').default;

jest.mock('../../context/authcontex', () => ({
  useAuth: () => ({
    token: 'test-token',
  }),
}));

jest.mock('lucide-react', () => ({
  Edit2: () => 'EditIcon',
  Trash2: () => 'TrashIcon',
  Loader2: () => 'LoaderIcon',
  Frown: () => 'FrownIcon',
  Eye: () => 'EyeIcon',
  Download: () => 'DownloadIcon',
  Filter: () => 'FilterIcon',
  X: () => 'XIcon',
}));

const mockProjects = [{ project_id: 1, project_name: 'Test Project' }];
const mockUsers = [{ id: 1, username: 'Test User' }];
const mockStatuses = [{ status_id: 1, status_name: 'Open' }];

describe('DefectsTable', () => {
  beforeEach(() => {
    fetch.mockClear();
    localStorageMock.getItem.mockClear();
    
    fetch.mockImplementation((url) => {
      if (url.includes('/api/defects')) {
        return Promise.resolve({
          ok: true,
          json: async () => [],
        });
      }
      if (url.includes('/api/projects')) {
        return Promise.resolve({
          ok: true,
          json: async () => mockProjects,
        });
      }
      if (url.includes('/api/users')) {
        return Promise.resolve({
          ok: true,
          json: async () => mockUsers,
        });
      }
      if (url.includes('/api/defect-statuses')) {
        return Promise.resolve({
          ok: true,
          json: async () => mockStatuses,
        });
      }
      return Promise.reject(new Error(`Unknown URL: ${url}`));
    });
  });

  test('renders without crashing', async () => {
    await act(async () => {
      render(
        <DefectsTable 
          onEdit={jest.fn()} 
          onView={jest.fn()} 
          refreshKey={1} 
        />
      );
    });

    await waitFor(() => {
      expect(screen.getByText(/Отслеживайте и управляйте дефектами/i)).toBeInTheDocument();
    });
  });
});

  test('displays defects after loading', async () => {
    const mockDefects = [
      {
        defect_id: 1,
        title: 'Test Defect 1',
        project_name: 'Test Project',
        priority: 'High',
        status_name: 'Open',
        assignee_name: 'John Doe',
        created_at: '2024-01-01',
      }
    ];

    fetch.mockImplementation((url) => {
      if (url.includes('/api/defects')) {
        return Promise.resolve({
          ok: true,
          json: async () => mockDefects,
        });
      }
      if (url.includes('/api/projects')) {
        return Promise.resolve({
          ok: true,
          json: async () => mockProjects,
        });
      }
      if (url.includes('/api/users')) {
        return Promise.resolve({
          ok: true,
          json: async () => mockUsers,
        });
      }
      if (url.includes('/api/defect-statuses')) {
        return Promise.resolve({
          ok: true,
          json: async () => mockStatuses,
        });
      }
      return Promise.reject(new Error(`Unknown URL: ${url}`));
    });

    await act(async () => {
      render(
        <DefectsTable 
          onEdit={jest.fn()} 
          onView={jest.fn()} 
          refreshKey={1} 
        />
      );
    });

    await waitFor(() => {
      expect(screen.getByText('Test Defect 1')).toBeInTheDocument();
      expect(screen.getByText('Test Project')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    expect(screen.getByText(/Найдено: 1 дефектов/i)).toBeInTheDocument();
  });

  test('shows loading state initially', async () => {
    fetch.mockImplementation((url) => {
      return new Promise((resolve) => {
        setTimeout(() => {
          if (url.includes('/api/defects')) {
            resolve({
              ok: true,
              json: async () => [],
            });
          } else {
            resolve({
              ok: true,
              json: async () => (url.includes('/api/projects') ? mockProjects : 
                               url.includes('/api/users') ? mockUsers : mockStatuses)
            });
          }
        }, 100);
      });
    });

    await act(async () => {
      render(
        <DefectsTable 
          onEdit={jest.fn()} 
          onView={jest.fn()} 
          refreshKey={1} 
        />
      );
    });

    expect(screen.getByText(/Загрузка дефектов/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByText(/Загрузка дефектов/i)).not.toBeInTheDocument();
    });
  });
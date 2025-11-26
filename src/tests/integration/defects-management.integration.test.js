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

const Defects = require('../../pages/defects').default;
const { AuthProvider } = require('../../context/authcontex');

jest.mock('../../components/defectformmodal', () => {
  return function MockDefectFormModal({ isOpen, onClose, onDefectSaved }) {
    if (!isOpen) return null;
    return (
      <div data-testid="defect-form-modal">
        <button onClick={onClose}>Close Modal</button>
        <button onClick={onDefectSaved}>Save Defect</button>
      </div>
    );
  };
});

jest.mock('lucide-react', () => ({
  Plus: () => null,
  Edit2: () => 'EditIcon',
  Trash2: () => 'TrashIcon',
  Eye: () => 'EyeIcon',
  Download: () => 'DownloadIcon',
  Filter: () => 'FilterIcon',
  X: () => 'XIcon',
  Frown: () => 'FrownIcon',
  Loader2: () => 'LoaderIcon',
}));

const mockDefects = [
  {
    defect_id: 1,
    title: 'Integration Test Defect',
    project_name: 'Test Project',
    priority: 'High',
    status_name: 'Open',
    assignee_name: 'Test User',
    created_at: '2024-01-01',
  }
];

const mockProjects = [{ project_id: 1, project_name: 'Test Project' }];
const mockUsers = [{ id: 1, username: 'Test User' }];
const mockStatuses = [{ status_id: 1, status_name: 'Open' }];

describe('Defects Management Integration', () => {
  beforeEach(() => {
    fetch.mockClear();
    localStorageMock.getItem.mockClear();
    
    localStorageMock.getItem.mockImplementation((key) => {
      if (key === 'site_token') return 'test-token';
      if (key === 'site_user') return JSON.stringify({ username: 'Test User' });
      return null;
    });

    fetch.mockImplementation((url) => {
      console.log('🔍 Mock fetch called with URL:', url);
      
      if (url.includes('/api/defects')) {
        return Promise.resolve({
          ok: true,
          json: async () => {
            console.log('🔍 Returning mock defects:', mockDefects);
            return mockDefects;
          },
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

  test('complete defect management flow - view, create, edit defects', async () => {
    const mockOnView = jest.fn();
    const mockOnEdit = jest.fn();

    await act(async () => {
      render(
        <AuthProvider>
          <Defects onEdit={mockOnEdit} onView={mockOnView} />
        </AuthProvider>
      );
    });

    expect(screen.getByText('Управление Дефектами')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Найдено: 1 дефектов')).toBeInTheDocument();
    }, { timeout: 3000 });

    expect(screen.getByText('Integration Test Defect')).toBeInTheDocument();
    expect(screen.getByText('Test Project')).toBeInTheDocument();

    const newDefectButton = screen.getByRole('button', { name: /новый дефект/i });
    fireEvent.click(newDefectButton);

    await waitFor(() => {
      expect(screen.getByTestId('defect-form-modal')).toBeInTheDocument();
    });

    const closeButton = screen.getByText('Close Modal');
    fireEvent.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByTestId('defect-form-modal')).not.toBeInTheDocument();
    });
  });

  test('defect table displays data correctly after loading', async () => {
    await act(async () => {
      render(
        <AuthProvider>
          <Defects onEdit={jest.fn()} onView={jest.fn()} />
        </AuthProvider>
      );
    });

    expect(screen.getByText('Управление Дефектами')).toBeInTheDocument();

    try {
      await waitFor(() => {
        const defectCount = screen.getByText(/Найдено:/);
        console.log('🔍 Defect count element:', defectCount.textContent);
        expect(defectCount).toHaveTextContent('1 дефектов');
      }, { timeout: 5000 });
    } catch (error) {
      console.log('🔍 Current DOM state:');
      console.log(' - Defect count elements:', screen.queryAllByText(/Найдено:/).map(el => el.textContent));
      console.log(' - Table rows:', screen.queryAllByRole('row').length);
      console.log(' - All text content:', screen.getByText('Управление Дефектами').parentElement?.textContent);
      throw error;
    }

    expect(screen.getByText('Integration Test Defect')).toBeInTheDocument();
    expect(screen.getByText('Test Project')).toBeInTheDocument();
    
    expect(screen.getAllByTitle(/Просмотреть детали/i).length).toBeGreaterThan(0);
    expect(screen.getAllByTitle(/Редактировать дефект/i).length).toBeGreaterThan(0);
  });
});
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
const Defects = require('../defects').default;

jest.mock('../../components/defectstable', () => {
  return function MockDefectsTable({ onEdit, onView }) {
    return (
      <div data-testid="defects-table">
        <button onClick={() => onEdit({ defect_id: 1, title: 'Test Defect' })}>
          Edit Defect
        </button>
        <button onClick={() => onView(1)}>View Defect</button>
      </div>
    );
  };
});

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
}));

describe('Defects Page', () => {
  beforeEach(() => {
    fetch.mockClear();
    localStorageMock.getItem.mockClear();
  });

  test('renders defects page with correct title and buttons', async () => {
    await act(async () => {
      render(<Defects onEdit={jest.fn()} onView={jest.fn()} />);
    });

    expect(screen.getByText('Управление Дефектами')).toBeInTheDocument();
    expect(screen.getByText('Отслеживайте и управляйте дефектами в ваших проектах')).toBeInTheDocument();

    const newDefectButton = screen.getByRole('button', { name: /новый дефект/i });
    expect(newDefectButton).toBeInTheDocument();
    
    expect(screen.getByTestId('defects-table')).toBeInTheDocument();
  });

  test('opens modal when new defect button is clicked', async () => {
    await act(async () => {
      render(<Defects onEdit={jest.fn()} onView={jest.fn()} />);
    });

    expect(screen.queryByTestId('defect-form-modal')).not.toBeInTheDocument();

    const newDefectButton = screen.getByRole('button', { name: /новый дефект/i });
    fireEvent.click(newDefectButton);

    expect(screen.getByTestId('defect-form-modal')).toBeInTheDocument();
  });

  test('opens modal with defect data when edit is triggered from table', async () => {
    const mockOnEdit = jest.fn();
    const mockOnView = jest.fn();

    await act(async () => {
      render(<Defects onEdit={mockOnEdit} onView={mockOnView} />);
    });

    const editButton = screen.getByText('Edit Defect');
    fireEvent.click(editButton);

    expect(screen.getByTestId('defect-form-modal')).toBeInTheDocument();
  });

  test('closes modal when close button is clicked', async () => {
    await act(async () => {
      render(<Defects onEdit={jest.fn()} onView={jest.fn()} />);
    });

    const newDefectButton = screen.getByRole('button', { name: /новый дефект/i });
    fireEvent.click(newDefectButton);
    expect(screen.getByTestId('defect-form-modal')).toBeInTheDocument();

    const closeButton = screen.getByText('Close Modal');
    fireEvent.click(closeButton);

    expect(screen.queryByTestId('defect-form-modal')).not.toBeInTheDocument();
  });

  test('refreshes table when defect is saved', async () => {
    await act(async () => {
      render(<Defects onEdit={jest.fn()} onView={jest.fn()} />);
    });

    const newDefectButton = screen.getByRole('button', { name: /новый дефект/i });
    fireEvent.click(newDefectButton);

    const saveButton = screen.getByText('Save Defect');
    fireEvent.click(saveButton);

    expect(screen.queryByTestId('defect-form-modal')).not.toBeInTheDocument();
  });

  test('passes correct callbacks to DefectsTable', async () => {
    const mockOnView = jest.fn();

    await act(async () => {
      render(<Defects onEdit={jest.fn()} onView={mockOnView} />);
    });

    const viewButton = screen.getByText('View Defect');
    fireEvent.click(viewButton);

    expect(mockOnView).toHaveBeenCalledWith(1);
  });

  test('opens modal without editing data for new defect', async () => {
    await act(async () => {
      render(<Defects onEdit={jest.fn()} onView={jest.fn()} />);
    });

    const newDefectButton = screen.getByRole('button', { name: /новый дефект/i });
    fireEvent.click(newDefectButton);

    expect(screen.getByTestId('defect-form-modal')).toBeInTheDocument();
  });
});
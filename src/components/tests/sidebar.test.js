/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Sidebar from '../sidebar';

const mockLogout = jest.fn();
jest.mock('../../context/authcontex', () => ({
  useAuth: () => ({
    user: { username: 'Test User' },
    logout: mockLogout,
  }),
}));

describe('Sidebar', () => {
  beforeEach(() => {
    mockLogout.mockClear();
  });

  test('renders all navigation items correctly', () => {
    render(<Sidebar activeTab="dashboard" setActiveTab={() => {}} />);
    
    expect(screen.getByText(/доска/i)).toBeInTheDocument();
    expect(screen.getByText(/проекты/i)).toBeInTheDocument();
    expect(screen.getByText(/дефекты/i)).toBeInTheDocument();
    expect(screen.getByText(/отчеты/i)).toBeInTheDocument();
  });

  test('renders user information', () => {
    render(<Sidebar activeTab="dashboard" setActiveTab={() => {}} />);
    
    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText('Пользователь')).toBeInTheDocument();
  });

  test('calls setActiveTab when menu item is clicked', () => {
    const mockSetActiveTab = jest.fn();
    render(<Sidebar activeTab="dashboard" setActiveTab={mockSetActiveTab} />);
    
    fireEvent.click(screen.getByText(/проекты/i));
    expect(mockSetActiveTab).toHaveBeenCalledWith('projects');
  });

  test('calls logout when logout button is clicked', () => {
    render(<Sidebar activeTab="dashboard" setActiveTab={() => {}} />);
    
    const logoutButton = screen.getByTitle('Выйти');
    fireEvent.click(logoutButton);
    expect(mockLogout).toHaveBeenCalled();
  });
});
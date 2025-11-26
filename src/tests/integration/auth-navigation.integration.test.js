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

const { AuthProvider, useAuth } = require('../../context/authcontex');
const Sidebar = require('../../components/sidebar').default;

const TestApp = () => {
  const { user, login, logout } = useAuth();
  const [activeTab, setActiveTab] = React.useState('dashboard');

  return (
    <div>
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <div>
        {user ? (
          <div data-testid="user-welcome">Welcome, {user.username}</div>
        ) : (
          <div data-testid="guest-message">Please login</div>
        )}
        <button onClick={() => login('test-token', { username: 'Integration User' })}>
          Simulate Login
        </button>
        <button onClick={logout}>Simulate Logout</button>
      </div>
    </div>
  );
};

describe('Auth + Navigation Integration', () => {
  beforeEach(() => {
    fetch.mockClear();
    localStorageMock.getItem.mockClear();
    localStorageMock.getItem.mockReturnValue(null);
  });

  test('user authentication flows through sidebar navigation', async () => {
    await act(async () => {
      render(
        <AuthProvider>
          <TestApp />
        </AuthProvider>
      );
    });

    expect(screen.getByTestId('guest-message')).toBeInTheDocument();
    expect(screen.getByText('Гость')).toBeInTheDocument();

    const loginButton = screen.getByText('Simulate Login');
    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(screen.getByTestId('user-welcome')).toHaveTextContent('Welcome, Integration User');
      expect(screen.getByText('Integration User')).toBeInTheDocument();
    });

    expect(screen.getByText('Доска')).toBeInTheDocument();
    expect(screen.getByText('Проекты')).toBeInTheDocument();
    expect(screen.getByText('Дефекты')).toBeInTheDocument();
    expect(screen.getByText('Отчеты')).toBeInTheDocument();

    const projectsButton = screen.getByText('Проекты');
    fireEvent.click(projectsButton);

    const logoutButton = screen.getByTitle('Выйти');
    fireEvent.click(logoutButton);

    await waitFor(() => {
      expect(screen.getByTestId('guest-message')).toBeInTheDocument();
      expect(screen.getByText('Гость')).toBeInTheDocument();
    });
  });

  test('sidebar reflects authentication state correctly', async () => {
    localStorageMock.getItem
      .mockReturnValueOnce('existing-token')
      .mockReturnValueOnce(JSON.stringify({ username: 'Existing User' }));

    await act(async () => {
      render(
        <AuthProvider>
          <TestApp />
        </AuthProvider>
      );
    });

    expect(screen.getByText('Existing User')).toBeInTheDocument();
    expect(screen.getByText('Пользователь')).toBeInTheDocument();

    expect(screen.getByText('Доска')).toBeInTheDocument();
    expect(screen.getByText('Дефекты')).toBeInTheDocument();
  });
});
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

const { render, screen, fireEvent, act } = require('@testing-library/react');
require('@testing-library/jest-dom');
const { AuthProvider, useAuth } = require('../authcontex');

const TestComponent = () => {
  const { token, user, isAuthenticated, login, logout } = useAuth();
  
  return (
    <div>
      <div data-testid="token">{token || 'no-token'}</div>
      <div data-testid="user">{user ? JSON.stringify(user) : 'no-user'}</div>
      <div data-testid="isAuthenticated">{isAuthenticated.toString()}</div>
      <button onClick={() => login('test-token', { username: 'Test User', id: 1 })}>
        Login
      </button>
      <button onClick={logout}>Logout</button>
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();
    localStorageMock.clear.mockClear();
  });

  test('AuthProvider renders without crashing', () => {
    localStorageMock.getItem.mockReturnValue(null);

    render(
      <AuthProvider>
        <div>Test Child</div>
      </AuthProvider>
    );
    
    expect(screen.getByText('Test Child')).toBeInTheDocument();
  });

  test('AuthProvider initializes with localStorage data', () => {
    const mockUser = { username: 'Test User', id: 1 };
    localStorageMock.getItem
      .mockReturnValueOnce('test-token') 
      .mockReturnValueOnce(JSON.stringify(mockUser)); 

    render(
      <AuthProvider>
        <div>Test Child</div>
      </AuthProvider>
    );

    expect(screen.getByText('Test Child')).toBeInTheDocument();
    expect(localStorageMock.getItem).toHaveBeenCalledWith('site_token');
    expect(localStorageMock.getItem).toHaveBeenCalledWith('site_user');
  });

  test('provides initial values when no stored data', () => {
    localStorageMock.getItem.mockReturnValue(null);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    

    expect(screen.getByTestId('token')).toHaveTextContent('no-token');
    expect(screen.getByTestId('user')).toHaveTextContent('no-user');
    expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('false');
  });
});
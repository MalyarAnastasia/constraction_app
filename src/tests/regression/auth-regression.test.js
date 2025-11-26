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
const { AuthProvider, useAuth } = require('../../context/authcontex');

const RegressionTestComponent = () => {
  const { token, user, login, logout, isAuthenticated } = useAuth();
  
  return (
    <div>
      <div data-testid="token">{token || 'no-token'}</div>
      <div data-testid="user">{user ? user.username : 'no-user'}</div>
      <div data-testid="auth-status">{isAuthenticated.toString()}</div>
      <button onClick={() => login('regression-token', { username: 'Regression User' })}>
        Login
      </button>
      <button onClick={logout}>Logout</button>
    </div>
  );
};

describe('Auth Regression Tests', () => {
  beforeEach(() => {
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();
    localStorageMock.clear.mockClear();
  });

  test('maintains authentication state after multiple operations', async () => {
    localStorageMock.getItem.mockReturnValue(null);

    await act(async () => {
      render(
        <AuthProvider>
          <RegressionTestComponent />
        </AuthProvider>
      );
    });

    fireEvent.click(screen.getByText('Login'));
    expect(screen.getByTestId('token')).toHaveTextContent('regression-token');
    expect(screen.getByTestId('auth-status')).toHaveTextContent('true');

    fireEvent.click(screen.getByText('Logout'));
    expect(screen.getByTestId('token')).toHaveTextContent('no-token');
    expect(screen.getByTestId('auth-status')).toHaveTextContent('false');

    fireEvent.click(screen.getByText('Login'));
    expect(screen.getByTestId('token')).toHaveTextContent('regression-token');
    expect(screen.getByTestId('auth-status')).toHaveTextContent('true');
  });

  test('performs correct number of localStorage operations', async () => {
    localStorageMock.getItem.mockReturnValue(null);

    await act(async () => {
      render(
        <AuthProvider>
          <RegressionTestComponent />
        </AuthProvider>
      );
    });

    expect(localStorageMock.getItem).toHaveBeenCalledTimes(2);

    fireEvent.click(screen.getByText('Login'));
    expect(localStorageMock.setItem).toHaveBeenCalledTimes(2);
 
    fireEvent.click(screen.getByText('Logout'));
    expect(localStorageMock.removeItem).toHaveBeenCalledTimes(2);
  });
});
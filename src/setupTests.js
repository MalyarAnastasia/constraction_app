import '@testing-library/jest-dom';

global.fetch = jest.fn();

const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true
});
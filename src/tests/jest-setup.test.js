import React from 'react';

test('Jest is working', () => {
  expect(1 + 1).toBe(2);
});

test('React is available', () => {
  expect(React).toBeDefined();
});

test('fetch is mocked', () => {
  expect(global.fetch).toBeDefined();
});
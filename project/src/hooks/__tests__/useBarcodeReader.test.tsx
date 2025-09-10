import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderHook } from '@testing-library/react';
import { useBarcodeReader } from '../useBarcodeReader';

describe('useBarcodeReader', () => {
  it('initializes with no barcode zone', () => {
    const { result } = renderHook(() => useBarcodeReader({
      normalizedZones: [],
      overlayRect: null,
      rotation: 0,
      pageUrls: [],
      currentPage: 0,
      stayNumber: '',
      setStayNumber: () => {},
      autoEnabledDefault: true,
    } as any));
    expect(result.current.hasBarcodeZone).toBe(false);
  });
});

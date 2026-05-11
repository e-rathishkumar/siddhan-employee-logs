import React from 'react';

export const MapContainer = ({ children }: { children: React.ReactNode }) =>
  React.createElement('div', { 'data-testid': 'map-container' }, children);
export const TileLayer = () => null;
export const Circle = () => null;
export const useMap = () => ({});
export const useMapEvents = () => ({});

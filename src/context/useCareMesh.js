import { useContext } from 'react';
import { CareMeshContext } from './careMeshContextInstance';

export const useCareMesh = () => {
  const context = useContext(CareMeshContext);
  if (!context) {
    throw new Error('useCareMesh must be used within a CareMeshProvider');
  }
  return context;
};

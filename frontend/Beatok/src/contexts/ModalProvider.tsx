import React, { useState } from 'react';
import type { ReactNode } from 'react';
import { ModalContext } from './ModalContext';

interface ModalProviderProps {
  children: ReactNode;
}

export const ModalProvider: React.FC<ModalProviderProps> = ({ children }) => {
  const [modalCount, setModalCount] = useState(0);

  const openModal = () => setModalCount((count) => count + 1);
  const closeModal = () => setModalCount((count) => Math.max(0, count - 1));

  const isAnyModalOpen = modalCount > 0;

  return (
    <ModalContext.Provider value={{ isAnyModalOpen, openModal, closeModal }}>
      {children}
    </ModalContext.Provider>
  );
};

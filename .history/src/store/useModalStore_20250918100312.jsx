import { create } from 'zustand'

export const useModalStore = create(set => ({
  modalType: null,
  modalProps: {},
  isOpen: {},
  openModal: (type, props = {}) => set(state => ({ 
    modalType: type, 
    modalProps: props,
    isOpen: { ...state.isOpen, [type]: true }
  })),
  closeModal: (type) => set(state => ({
    modalType: type ? null : state.modalType,
    modalProps: type ? {} : state.modalProps,
    isOpen: type ? { ...state.isOpen, [type]: false } : { ...state.isOpen, [state.modalType]: false }
  }))
}))

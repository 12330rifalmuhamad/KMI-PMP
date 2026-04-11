import { create } from 'zustand'

export const useModalStore = create(set => ({
  modalType: null,
  modalProps: {},
  openModal: (type, props = {}) => set({ modalType: type, modalProps: props }),
  closeModal: () => set({ modalType: null, modalProps: {} })
}))

import { create } from 'zustand'

// Tambahkan tipe modal baru di sini, misal: 'CREATE_DOC', 'CREATE_DASHBOARD', dll.
export const useModalStore = create(set => ({
  modalType: null,
  modalProps: {},
  openModal: (type, props = {}) => set({ modalType: type, modalProps: props }),
  closeModal: () => set({ modalType: null, modalProps: {} })
}))

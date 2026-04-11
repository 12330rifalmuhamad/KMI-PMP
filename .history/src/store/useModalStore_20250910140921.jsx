import { create } from 'zustand'

export const useModalStore = create(set => ({
  // State awal: tidak ada modal yang terbuka
  modalType: null,
  modalProps: {},

  // Aksi untuk membuka modal
  openModal: (type, props = {}) => set({ modalType: type, modalProps: props }),

  // Aksi untuk menutup modal
  closeModal: () => set({ modalType: null, modalProps: {} })
}))

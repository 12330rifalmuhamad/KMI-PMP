import { create } from 'zustand'

export const useModalStore = create(set => ({
  modalType: null,
  modalProps: {},
  openModal: (type, props = {}) => {
    // Log untuk memastikan fungsi ini terpanggil
    console.log(`[ZUSTAND STORE] State sedang diubah menjadi: ${type}`)
    set({ modalType: type, modalProps: props })
  },
  closeModal: () => set({ modalType: null, modalProps: {} })
}))

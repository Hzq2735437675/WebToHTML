import { defineStore } from "pinia"
export const useEditorStore = defineStore('editor', {
  state: () => ({
    isUpdatingFromEditor: false,
  }),
  actions: {
    setIsUpdatingFromEditor(value) {
      this.isUpdatingFromEditor = value;
    },
  },
});
let modals = [];

export const modalRegistry = {
  push: (id, closeFn) => {
    // Remove if already exists to move it to the top
    modals = modals.filter(m => m.id !== id);
    modals.push({ id, closeFn });
  },
  remove: (id) => {
    modals = modals.filter(m => m.id !== id);
  },
  pop: () => {
    const top = modals.pop();
    if (top && typeof top.closeFn === 'function') {
      top.closeFn();
    }
  },
  hasModals: () => modals.length > 0,
};

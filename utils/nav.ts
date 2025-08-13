export function findDrawerParent(nav: any) {
  let parent = nav?.getParent?.();
  while (parent && typeof parent.getState === 'function') {
    const type = parent.getState()?.type;
    if (type === 'drawer') return parent;
    parent = parent.getParent?.();
  }
  return null;
}

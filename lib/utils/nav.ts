type NavLike = { getParent?: () => NavLike | undefined; getState?: () => { type?: string } | undefined };

export function findDrawerParent(nav: NavLike) {
  let parent = nav?.getParent?.();
  while (parent && typeof parent.getState === 'function') {
    const type = parent.getState()?.type;
    if (type === 'drawer') return parent;
    parent = parent.getParent?.();
  }
  return null;
}

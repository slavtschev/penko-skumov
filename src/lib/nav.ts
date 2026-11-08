export type NavKey = 'projects' | 'about' | 'contact';

export interface NavItem {
  key: NavKey;
  label: string;
  href: string;
}

/** Projects, About, Contact -- the three words in the header and the sheet. */
export const nav: NavItem[] = [
  { key: 'projects', label: 'Projects', href: '/projects/' },
  { key: 'about', label: 'About', href: '/about/' },
  { key: 'contact', label: 'Contact', href: '/contact/' },
];

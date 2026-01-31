'use client';

import Link from 'next/link';
import {
  Bug,
  Apple,
  Image,
  Boxes,
  ShoppingBag,
  Link2,
  ArrowUpRight,
  ExternalLink,
} from 'lucide-react';

const links = [
  {
    title: 'Issues',
    description: 'Track bugs and revisions',
    href: '/issues',
    icon: Bug,
    color: 'text-status-error',
    bgColor: 'bg-status-error/10',
    external: false,
  },
  {
    title: 'App Stores',
    description: 'Compliance checklists',
    href: '/apple',
    icon: Apple,
    color: 'text-zinc-300',
    bgColor: 'bg-zinc-500/10',
    external: false,
  },
  {
    title: 'Screenshots',
    description: 'Visual documentation',
    href: '/screenshots',
    icon: Image,
    color: 'text-status-info',
    bgColor: 'bg-status-info/10',
    external: false,
  },
  {
    title: 'Architecture',
    description: 'System overview',
    href: '/architecture',
    icon: Boxes,
    color: 'text-accent',
    bgColor: 'bg-accent/10',
    external: false,
  },
  {
    title: 'Marketplace',
    description: 'Category debug',
    href: '/marketplace',
    icon: ShoppingBag,
    color: 'text-status-warning',
    bgColor: 'bg-status-warning/10',
    external: false,
  },
  {
    title: 'Resources',
    description: 'Links & docs',
    href: '/links',
    icon: Link2,
    color: 'text-status-success',
    bgColor: 'bg-status-success/10',
    external: false,
  },
];

export function QuickLinks() {
  return (
    <div className="card p-5">
      <h3 className="text-sm font-semibold text-zinc-300 mb-4">Quick Access</h3>
      <div className="grid grid-cols-2 gap-3">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              target={link.external ? '_blank' : undefined}
              className="group flex items-start gap-3 p-3 rounded-lg bg-dark-bg/50 border border-transparent hover:border-dark-border hover:bg-dark-hover transition-all duration-200"
            >
              <div className={`p-2 rounded-lg ${link.bgColor} group-hover:scale-110 transition-transform duration-200`}>
                <Icon className={`w-4 h-4 ${link.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <span className="text-sm font-medium text-zinc-200 group-hover:text-white transition-colors">
                    {link.title}
                  </span>
                  {link.external ? (
                    <ExternalLink className="w-3 h-3 text-zinc-500" />
                  ) : (
                    <ArrowUpRight className="w-3 h-3 text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                </div>
                <p className="text-xs text-zinc-500 truncate">{link.description}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

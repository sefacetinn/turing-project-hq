interface QuickLink {
  title: string;
  url: string;
  icon: string;
}

interface QuickLinksProps {
  links: QuickLink[];
}

const iconMap: Record<string, string> = {
  github: '🐙',
  database: '🗄️',
  globe: '🌐',
  figma: '🎨',
  default: '🔗',
};

export function QuickLinks({ links }: QuickLinksProps) {
  return (
    <div className="card p-6">
      <h2 className="text-lg font-semibold mb-4">Quick Links</h2>
      <div className="grid grid-cols-2 gap-3">
        {links.map((link, idx) => (
          <a
            key={idx}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-3 rounded-lg bg-dark-bg border border-dark-border hover:border-accent transition-colors"
          >
            <span className="text-lg">{iconMap[link.icon] || iconMap.default}</span>
            <span className="text-sm font-medium">{link.title}</span>
          </a>
        ))}
      </div>
    </div>
  );
}

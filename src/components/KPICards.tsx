interface KPICardsProps {
  stats: {
    total: number;
    backlog: number;
    inProgress: number;
    done: number;
    p0Count: number;
  };
}

export function KPICards({ stats }: KPICardsProps) {
  const cards = [
    { label: 'Total Issues', value: stats.total, color: 'text-gray-200' },
    { label: 'Backlog', value: stats.backlog, color: 'text-gray-400' },
    { label: 'In Progress', value: stats.inProgress, color: 'text-yellow-400' },
    { label: 'Done', value: stats.done, color: 'text-green-400' },
    { label: 'P0 Critical', value: stats.p0Count, color: 'text-red-400' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      {cards.map((card) => (
        <div key={card.label} className="card p-4">
          <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">
            {card.label}
          </div>
          <div className={`text-2xl font-bold ${card.color}`}>
            {card.value}
          </div>
        </div>
      ))}
    </div>
  );
}

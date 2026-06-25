interface Props {
  title: string;
  description?: string;
  badge?: React.ReactNode;
  children?: React.ReactNode;
}

export function PageHeader({ title, description, badge, children }: Props) {
  return (
    <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-6">
      <div>
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="font-serif text-3xl font-medium tracking-tight text-white">{title}</h1>
          {badge}
        </div>
        {description && <p className="mt-1.5 text-sm text-white/60 max-w-2xl">{description}</p>}
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
}

import type { ReactNode } from 'react';
import { Gauge, Settings, Shield, ToggleLeft } from 'lucide-react';
import type { SectionSchema } from '../../types/policy';

const ICON_MAP: Record<string, typeof Shield> = {
  gauge: Gauge,
  shield: Shield,
  'toggle-left': ToggleLeft,
  settings: Settings,
};

interface SectionGroupProps {
  section: SectionSchema;
  children: ReactNode;
}

export function SectionGroup({ section, children }: SectionGroupProps) {
  const Icon = ICON_MAP[section.icon] ?? Shield;

  return (
    <section className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Icon className="w-4 h-4" />
          {section.title}
        </h3>
        {section.description && (
          <p className="text-xs text-muted-foreground mt-1">{section.description}</p>
        )}
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

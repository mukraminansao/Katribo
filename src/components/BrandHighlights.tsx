import { Icon, type IconName } from './Icon';

const HIGHLIGHTS: [IconName, string, string][] = [
  ['bean', 'Quality Beans', 'Carefully selected'],
  ['heart', 'Crafted with Care', 'Made by our baristas'],
  ['chair', 'A Cozy Space', 'Everyone is welcome'],
  ['wave', 'Good Vibes', 'By the bay'],
];

export function BrandHighlights() {
  return (
    <ul className="brand-highlights" aria-label="The Katribo experience">
      {HIGHLIGHTS.map(([icon, title, detail]) => (
        <li key={title}>
          <Icon name={icon} size={32} className="shrink-0" />
          <div className="min-w-0"><strong>{title}</strong><span>{detail}</span></div>
        </li>
      ))}
    </ul>
  );
}

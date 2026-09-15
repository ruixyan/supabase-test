export function ClientHighlightFields({ vip, designer, onChange }: {
  vip: boolean; designer: boolean;
  onChange: (values: { is_vip: boolean; is_interior_designer: boolean }) => void;
}) {
  return <fieldset className="space-y-2">
    <legend className="text-sm font-semibold">Profile highlights</legend>
    <label className="flex items-center gap-2"><input type="checkbox" checked={vip}
      onChange={(event) => onChange({ is_vip: event.target.checked, is_interior_designer: designer })} />VIP</label>
    <label className="flex items-center gap-2"><input type="checkbox" checked={designer}
      onChange={(event) => onChange({ is_vip: vip, is_interior_designer: event.target.checked })} />Interior Designer</label>
  </fieldset>;
}

export function ClientHighlightBadges({ vip, designer }: { vip: boolean; designer: boolean }) {
  return <div className="my-2 flex flex-wrap gap-2 text-xs font-semibold">
    {vip && <span className="border border-amber-600 bg-amber-100 px-2 py-1 text-amber-900">VIP</span>}
    {designer && <span className="border border-blue-600 bg-blue-100 px-2 py-1 text-blue-900">Interior Designer</span>}
  </div>;
}

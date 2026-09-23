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
    {vip && <span className="border border-[#9c1515] bg-[#9c1515] px-2 py-1 text-white">VIP</span>}
    {designer && <span className="border border-[#9c1515] bg-white px-2 py-1 text-[#9c1515]">Interior Designer</span>}
  </div>;
}

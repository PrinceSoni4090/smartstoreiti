// Official logo assets served from /public/logos.
// Kept as small, self-contained components so they can be dropped into
// the topbar, login page, footer, or any government-branded surface.

export function GovtEmblem({ size = 44, showCaption = false }: { size?: number; showCaption?: boolean }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <img
        src="/logos/cg-govt.svg"
        alt="Government of Chhattisgarh"
        width={size}
        height={size}
        className="object-contain"
        style={{ width: size, height: size }}
      />
      {showCaption && (
        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-600 text-center leading-tight">Govt of<br />Chhattisgarh</span>
      )}
    </div>
  );
}

export function ItiLogo({ size = 44, showCaption = false }: { size?: number; showCaption?: boolean }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <img
        src="/logos/iti.png"
        alt="Industrial Training Institute"
        width={size}
        height={size}
        className="object-contain"
        style={{ width: size, height: size }}
      />
      {showCaption && (
        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-600 text-center leading-tight">Industrial<br />Training Institute</span>
      )}
    </div>
  );
}

export function SkillIndia({ size = 44, showCaption = false }: { size?: number; showCaption?: boolean }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <img
        src="/logos/skill-india.png"
        alt="Skill India — Ministry of Skill Development & Entrepreneurship"
        height={size}
        className="object-contain"
        style={{ height: size, width: 'auto' }}
      />
      {showCaption && (
        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-600 text-center leading-tight">Skill India /<br />Skill Development</span>
      )}
    </div>
  );
}

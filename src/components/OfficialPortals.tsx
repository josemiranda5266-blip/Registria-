import React from 'react';
import { ExternalLink, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { OFFICIAL_PORTAL_LINKS } from '../data/normativeDatabase';

export const OfficialPortals: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-wrap items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <ExternalLink className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-bold text-white font-serif">Directorio de Portales Oficiales Verificados</h2>
          </div>
          <p className="text-xs text-slate-400">
            Enlaces directos a los sitios gubernamentales oficiales del régimen registral del automotor en Argentina.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {OFFICIAL_PORTAL_LINKS.map((link) => (
          <div
            key={link.id}
            className="bg-slate-900 border border-slate-800 hover:border-blue-500/50 rounded-xl p-5 space-y-3 transition-all shadow-sm flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Verificado
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  Rev: {link.verifiedDate}
                </span>
              </div>

              <h3 className="text-sm font-bold text-white">{link.name}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{link.description}</p>
            </div>

            <div className="pt-3 border-t border-slate-800">
              <a
                href={link.url}
                target="_blank"
                rel="noreferrer"
                className="w-full px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
              >
                <span>Acceder al Portal Oficial</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

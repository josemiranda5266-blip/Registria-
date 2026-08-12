import React, { useState } from 'react';
import { Calculator, DollarSign, Info, Download, AlertCircle } from 'lucide-react';
import jsPDF from 'jspdf';

export const FeeCalculator: React.FC = () => {
  const [vehicleValue, setVehicleValue] = useState<number>(15000000);
  const [vehicleOrigin, setVehicleOrigin] = useState<'NACIONAL' | 'IMPORTADO'>('NACIONAL');
  const [province, setProvince] = useState<'CABA' | 'PBA' | 'SANTA_FE' | 'CORDOBA'>('CABA');
  const [procedureType, setProcedureType] = useState<'TRANSFERENCIA' | 'INICIAL_0KM' | 'DUPLICADO'>('TRANSFERENCIA');
  const [includeGestoriaFee, setIncludeGestoriaFee] = useState<boolean>(true);
  const [gestoriaAmount, setGestoriaAmount] = useState<number>(120000);

  // Calculations
  const transferRate = vehicleOrigin === 'NACIONAL' ? 0.015 : 0.02; // 1.5% or 2%
  const arancelBase = vehicleValue * transferRate;

  const sealTaxRateMap = {
    CABA: 0.03, // 3%
    PBA: 0.03, // 3%
    SANTA_FE: 0.025, // 2.5%
    CORDOBA: 0.025, // 2.5%
  };
  const sellosTax = vehicleValue * sealTaxRateMap[province];

  const cedulaFee = 18500;
  const tituloFee = 12000;
  const formulario08Fee = 15000;
  const firmaCertFee = 24000;

  const totalDnrpa = arancelBase + cedulaFee + tituloFee + formulario08Fee + firmaCertFee;
  const totalEstimado = totalDnrpa + sellosTax + (includeGestoriaFee ? gestoriaAmount : 0);

  const exportBudgetPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.setTextColor(11, 25, 44);
    doc.text('REGISTRIA - Presupuesto Estimativo de Aranceles', 14, 20);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Fecha: ${new Date().toLocaleDateString('es-AR')} | Origen: ${vehicleOrigin} | Jurisdicción: ${province}`, 14, 28);
    doc.text('________________________________________________________________________________', 14, 32);

    let yPos = 42;
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text(`Valuación Fiscal del Vehículo: $${vehicleValue.toLocaleString('es-AR')}`, 14, yPos);
    yPos += 10;

    doc.setFontSize(10);
    doc.text(`• Arancel Seccional DNRPA (${transferRate * 100}%): $${arancelBase.toLocaleString('es-AR')}`, 18, yPos);
    yPos += 6;
    doc.text(`• Impuesto a los Sellos (${sealTaxRateMap[province] * 100}%): $${sellosTax.toLocaleString('es-AR')}`, 18, yPos);
    yPos += 6;
    doc.text(`• Cédulas, Título y Certificación de Firmas: $${(cedulaFee + tituloFee + formulario08Fee + firmaCertFee).toLocaleString('es-AR')}`, 18, yPos);
    yPos += 6;

    if (includeGestoriaFee) {
      doc.text(`• Honorarios Profesionales Gestoría: $${gestoriaAmount.toLocaleString('es-AR')}`, 18, yPos);
      yPos += 6;
    }

    doc.setFontSize(12);
    doc.setTextColor(11, 25, 44);
    doc.text(`TOTAL ESTIMADO FINAL: $${totalEstimado.toLocaleString('es-AR')}`, 14, yPos + 6);

    doc.setFontSize(8);
    doc.setTextColor(120);
    doc.text('Este cálculo es orientativo conforme las escalas vigentes de DNRPA y RENTAS provincial.', 14, 280);

    doc.save(`Presupuesto_Aranceles_${Date.now()}.pdf`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-wrap items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-bold text-white font-serif">Calculadora Registral de Aranceles y Sellados</h2>
          </div>
          <p className="text-xs text-slate-400">
            Estimación exacta de aranceles de Registro Seccional, Impuesto a los Sellos provincial y honorarios profesionales.
          </p>
        </div>

        <button
          onClick={exportBudgetPDF}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-lg flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
        >
          <Download className="w-4 h-4" /> Exportar Presupuesto PDF
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Parameters */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4 shadow-md text-xs">
          <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-2">Parámetros del Vehículo y Trámite</h3>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Valuación Tabla AFIP / DNRPA ($ ARS)</label>
            <input
              type="number"
              value={vehicleValue}
              onChange={(e) => setVehicleValue(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white font-mono text-sm focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Origen del Vehículo</label>
              <select
                value={vehicleOrigin}
                onChange={(e) => setVehicleOrigin(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none"
              >
                <option value="NACIONAL">Nacional (1.5%)</option>
                <option value="IMPORTADO">Importado (2.0%)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Provincia de Radicación</label>
              <select
                value={province}
                onChange={(e) => setProvince(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none"
              >
                <option value="CABA">CABA (Sellos 3%)</option>
                <option value="PBA">PBA (Sellos 3%)</option>
                <option value="SANTA_FE">Santa Fe (Sellos 2.5%)</option>
                <option value="CORDOBA">Córdoba (Sellos 2.5%)</option>
              </select>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-slate-300">Incluir Honorarios de Gestoría / Mandatario</label>
              <input
                type="checkbox"
                checked={includeGestoriaFee}
                onChange={(e) => setIncludeGestoriaFee(e.target.checked)}
                className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
              />
            </div>

            {includeGestoriaFee && (
              <div>
                <label className="block text-slate-400 mb-1">Monto de Honorarios ($ ARS)</label>
                <input
                  type="number"
                  value={gestoriaAmount}
                  onChange={(e) => setGestoriaAmount(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-mono focus:outline-none"
                />
              </div>
            )}
          </div>
        </div>

        {/* Output Breakdown */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5 shadow-md text-xs">
          <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-2">Desglose Detallado de Costos</h3>

          <div className="space-y-3">
            <div className="flex justify-between items-center bg-slate-950 p-3 rounded-lg border border-slate-800">
              <span className="text-slate-300">Arancel Seccional Transferencia ({transferRate * 100}%):</span>
              <span className="font-mono font-bold text-white">${arancelBase.toLocaleString('es-AR')}</span>
            </div>

            <div className="flex justify-between items-center bg-slate-950 p-3 rounded-lg border border-slate-800">
              <span className="text-slate-300">Impuesto a los Sellos ({sealTaxRateMap[province] * 100}%):</span>
              <span className="font-mono font-bold text-white">${sellosTax.toLocaleString('es-AR')}</span>
            </div>

            <div className="flex justify-between items-center bg-slate-950 p-3 rounded-lg border border-slate-800">
              <span className="text-slate-300">Cédulas, Título, Solicitud 08 y Firmas:</span>
              <span className="font-mono font-bold text-white">${(cedulaFee + tituloFee + formulario08Fee + firmaCertFee).toLocaleString('es-AR')}</span>
            </div>

            {includeGestoriaFee && (
              <div className="flex justify-between items-center bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="text-slate-300">Honorarios Profesional Mandatario:</span>
                <span className="font-mono font-bold text-blue-400">${gestoriaAmount.toLocaleString('es-AR')}</span>
              </div>
            )}
          </div>

          <div className="bg-gradient-to-r from-blue-950 to-slate-950 border border-blue-500/40 p-4 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase text-blue-400 tracking-wider">Total Estimado Trámite</span>
              <p className="text-xs text-slate-400">Impuestos + Aranceles + Honorarios</p>
            </div>
            <span className="text-xl font-mono font-bold text-emerald-400">${totalEstimado.toLocaleString('es-AR')}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

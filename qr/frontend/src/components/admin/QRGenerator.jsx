import React, { useState, useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Printer, Download, UtensilsCrossed, Sparkles, MapPin } from 'lucide-react';

export const QRGenerator = () => {
  const [selectedTable, setSelectedTable] = useState('Table 1');
  const [customTable, setCustomTable] = useState('');
  const qrRef = useRef(null);

  const activeTable = customTable.trim() || selectedTable;
  const baseUrl = window.location.origin;
  const qrUrl = `${baseUrl}/?table=${encodeURIComponent(activeTable)}`;

  const tablesList = Array.from({ length: 12 }, (_, i) => `Table ${i + 1}`);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadQR = () => {
    const canvas = document.getElementById('table-qr-canvas');
    if (canvas) {
      const pngUrl = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.href = pngUrl;
      downloadLink.download = `Zaika-${activeTable.replace(/\s+/g, '_')}-QR.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#181412] p-5 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-md no-print">
        <div>
          <h3 className="font-display font-black text-xl text-stone-900 dark:text-white">Table QR Code Stand Center</h3>
          <p className="text-xs text-stone-600 dark:text-stone-400 font-medium">
            Generate and print branded QR stands for physical tables & counters.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadQR}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 border border-stone-200 dark:border-stone-700 text-xs font-bold transition-all shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download PNG</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl gold-btn text-xs font-black transition-all shadow-gold-sm"
          >
            <Printer className="w-3.5 h-3.5 text-black" />
            <span>Print Stand Template</span>
          </button>
        </div>
      </div>

      {/* Table Selector (No-Print) */}
      <div className="bg-white dark:bg-[#181412] p-5 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-md no-print space-y-3">
        <label className="block text-xs font-black text-stone-700 dark:text-stone-300 uppercase tracking-wider">
          Select Physical Table
        </label>
        <div className="flex flex-wrap gap-2">
          {tablesList.map((t) => (
            <button
              key={t}
              onClick={() => {
                setSelectedTable(t);
                setCustomTable('');
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs ${
                activeTable === t
                  ? 'gold-btn'
                  : 'bg-stone-100 text-stone-800 border border-stone-200 dark:bg-stone-800 dark:text-stone-300 dark:border-stone-700'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="pt-2 flex items-center gap-3">
          <span className="text-xs text-stone-500 font-bold">Or Custom:</span>
          <input
            type="text"
            value={customTable}
            onChange={(e) => setCustomTable(e.target.value)}
            placeholder="e.g. Rooftop Gazebo, Bar Counter 2..."
            className="px-3 py-1.5 text-xs bg-stone-50 dark:bg-[#120F0D] border border-stone-300 dark:border-stone-700 rounded-xl text-stone-900 dark:text-white placeholder:text-stone-400 focus:outline-none focus:border-[#E5A93C] font-medium"
          />
        </div>
      </div>

      {/* Printable Table Stand Preview Card */}
      <div className="flex justify-center p-4">
        <div
          ref={qrRef}
          className="print-card bg-white text-stone-900 p-8 rounded-3xl border border-stone-300 shadow-2xl max-w-sm w-full text-center space-y-5"
        >
          {/* Stand Header */}
          <div className="space-y-1">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#F8DC9C] to-[#E5A93C] flex items-center justify-center text-black mx-auto shadow-md">
              <UtensilsCrossed className="w-6 h-6" />
            </div>
            <h2 className="font-display font-black text-2xl text-stone-950 tracking-tight pt-2">
              ZAIKA DINING
            </h2>
            <p className="text-[11px] uppercase tracking-widest text-stone-500 font-bold">
              Artisanal Haute Cuisine
            </p>
          </div>

          {/* Table Badge */}
          <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-stone-100 border border-stone-300 text-sm font-black text-stone-900 shadow-xs">
            <MapPin className="w-4 h-4 text-[#B45309]" />
            <span>{activeTable}</span>
          </div>

          {/* QR Code Canvas */}
          <div className="p-4 bg-white rounded-2xl border-2 border-stone-200 inline-block shadow-inner">
            <QRCodeCanvas
              id="table-qr-canvas"
              value={qrUrl}
              size={200}
              level="H"
              includeMargin={true}
            />
          </div>

          {/* Instructions */}
          <div className="space-y-1 pt-1">
            <div className="flex items-center justify-center gap-1.5 text-xs font-black text-[#9A3412]">
              <Sparkles className="w-3.5 h-3.5 text-[#B45309]" />
              <span>Scan to View Menu & Order</span>
            </div>
            <p className="text-[10px] text-stone-500 font-medium">
              Point your smartphone camera at this code to order from your seat.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

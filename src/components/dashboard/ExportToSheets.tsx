import React, { useState } from 'react';
import { FileSpreadsheet, Download, CheckCircle, AlertCircle } from 'lucide-react';
import type { Signal } from '../../types';

interface ExportToSheetsProps {
  signals: Signal[];
  disabled?: boolean;
}

interface ExportOptions {
  sheetName: string;
  includeHeaders: boolean;
  includeMetadata: boolean;
  format: 'detailed' | 'summary';
}

interface ExportModalProps {
  signals: Signal[];
  onClose: () => void;
  onExport: (options: ExportOptions) => void;
  isExporting: boolean;
  status: 'idle' | 'success' | 'error';
  message: string;
}

interface ToastProps {
  status: 'success' | 'error';
  message: string;
  onClose: () => void;
}

const ExportToSheets: React.FC<ExportToSheetsProps> = ({ signals, disabled = false }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [exportStatus, setExportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [exportMessage, setExportMessage] = useState('');

  const handleExportClick = () => {
    if (signals.length === 0) {
      setExportMessage('No hay señales para exportar');
      setExportStatus('error');
      return;
    }
    setShowModal(true);
  };

  const handleExport = async (options: ExportOptions) => {
    setIsExporting(true);
    setExportStatus('idle');

    try {
      // SIMULACIÓN - Por ahora solo descarga CSV
      // En el siguiente prompt integraremos Google Sheets API
      
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simular delay

      // Generar CSV
      const csvData = generateCSV(signals, options);
      downloadCSV(csvData, options.sheetName);

      setExportStatus('success');
      setExportMessage(`✓ ${signals.length} señales exportadas exitosamente a CSV`);
      
      setTimeout(() => {
        setShowModal(false);
      }, 2000);

    } catch (error) {
      setExportStatus('error');
      setExportMessage('Error al exportar. Por favor intenta de nuevo.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <>
      {/* Botón Principal */}
      <button
        onClick={handleExportClick}
        disabled={disabled || signals.length === 0}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm
          transition-all duration-200
          ${disabled || signals.length === 0
            ? 'bg-neutral-300 text-neutral-500 cursor-not-allowed'
            : 'bg-success-600 hover:bg-success-700 text-white shadow-md hover:shadow-lg hover:scale-105'
          }
        `}
      >
        <FileSpreadsheet className="w-4 h-4" />
        Exportar a Google Sheets
        {signals.length > 0 && (
          <span className="ml-1 px-2 py-0.5 bg-white/20 rounded-full text-xs">
            {signals.length}
          </span>
        )}
      </button>

      {/* Modal de Exportación */}
      {showModal && (
        <ExportModal
          signals={signals}
          onClose={() => setShowModal(false)}
          onExport={handleExport}
          isExporting={isExporting}
          status={exportStatus}
          message={exportMessage}
        />
      )}

      {/* Toast de Notificación */}
      {exportStatus !== 'idle' && !showModal && (
        <Toast
          status={exportStatus}
          message={exportMessage}
          onClose={() => setExportStatus('idle')}
        />
      )}
    </>
  );
};

const ExportModal: React.FC<ExportModalProps> = ({
  signals,
  onClose,
  onExport,
  isExporting,
  status,
  message,
}) => {
  const [options, setOptions] = useState<ExportOptions>({
    sheetName: `Indicium Signals ${new Date().toLocaleDateString()}`,
    includeHeaders: true,
    includeMetadata: true,
    format: 'detailed',
  });

  const handleExport = () => {
    onExport(options);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="p-6 border-b border-neutral-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-success-100 rounded-xl flex items-center justify-center">
                <FileSpreadsheet className="w-6 h-6 text-success-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-neutral-900">
                  Exportar a Google Sheets
                </h2>
                <p className="text-sm text-neutral-600">
                  {signals.length} señales seleccionadas
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-neutral-400 hover:text-neutral-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          
          {/* Nombre de la hoja */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Nombre de la hoja
            </label>
            <input
              type="text"
              value={options.sheetName}
              onChange={(e) => setOptions({ ...options, sheetName: e.target.value })}
              className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-success-500 focus:border-success-500"
              placeholder="Ej: Señales Trinity Octubre 2025"
            />
          </div>

          {/* Formato */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Formato de exportación
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setOptions({ ...options, format: 'detailed' })}
                className={`p-4 border-2 rounded-lg transition-all ${
                  options.format === 'detailed'
                    ? 'border-success-500 bg-success-50'
                    : 'border-neutral-200 hover:border-neutral-300'
                }`}
              >
                <div className="font-semibold text-neutral-900 mb-1">Detallado</div>
                <div className="text-xs text-neutral-600">
                  Incluye todos los campos: scores, fundamentales, técnicos
                </div>
              </button>
              <button
                onClick={() => setOptions({ ...options, format: 'summary' })}
                className={`p-4 border-2 rounded-lg transition-all ${
                  options.format === 'summary'
                    ? 'border-success-500 bg-success-50'
                    : 'border-neutral-200 hover:border-neutral-300'
                }`}
              >
                <div className="font-semibold text-neutral-900 mb-1">Resumen</div>
                <div className="text-xs text-neutral-600">
                  Solo campos clave: ticker, señal, scores, precios
                </div>
              </button>
            </div>
          </div>

          {/* Opciones */}
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={options.includeHeaders}
                onChange={(e) => setOptions({ ...options, includeHeaders: e.target.checked })}
                className="w-4 h-4 text-success-600 border-neutral-300 rounded focus:ring-success-500"
              />
              <div>
                <div className="font-medium text-neutral-900">Incluir encabezados</div>
                <div className="text-xs text-neutral-600">Primera fila con nombres de columnas</div>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={options.includeMetadata}
                onChange={(e) => setOptions({ ...options, includeMetadata: e.target.checked })}
                className="w-4 h-4 text-success-600 border-neutral-300 rounded focus:ring-success-500"
              />
              <div>
                <div className="font-medium text-neutral-900">Incluir metadata</div>
                <div className="text-xs text-neutral-600">
                  Fecha de exportación, total de señales, régimen de mercado
                </div>
              </div>
            </label>
          </div>

          {/* Preview de columnas */}
          <div className="bg-neutral-50 rounded-lg p-4 border border-neutral-200">
            <div className="text-sm font-medium text-neutral-700 mb-2">
              Vista previa de columnas:
            </div>
            <div className="flex flex-wrap gap-2">
              {(options.format === 'detailed' 
                ? ['Ticker', 'Empresa', 'Señal', 'Trinity Score', 'Lynch', "O'Neil", 'Graham', 
                   'Precio', 'Target', 'Stop Loss', 'Expected Return', 'Sector', 'Autor', 'Risk Profile']
                : ['Ticker', 'Empresa', 'Señal', 'Trinity Score', 'Precio', 'Target', 'Sector']
              ).map((col) => (
                <span
                  key={col}
                  className="px-2 py-1 bg-white border border-neutral-300 rounded text-xs font-medium text-neutral-700"
                >
                  {col}
                </span>
              ))}
            </div>
          </div>

          {/* Mensaje de status */}
          {status !== 'idle' && (
            <div className={`p-4 rounded-lg flex items-center gap-3 ${
              status === 'success' 
                ? 'bg-success-50 border border-success-200' 
                : 'bg-danger-50 border border-danger-200'
            }`}>
              {status === 'success' ? (
                <CheckCircle className="w-5 h-5 text-success-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-danger-600" />
              )}
              <div className={`text-sm font-medium ${
                status === 'success' ? 'text-success-700' : 'text-danger-700'
              }`}>
                {message}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-neutral-200 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-neutral-700 hover:bg-neutral-100 rounded-lg font-medium transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting || !options.sheetName.trim()}
            className={`flex items-center gap-2 px-6 py-2 rounded-lg font-semibold transition-all ${
              isExporting || !options.sheetName.trim()
                ? 'bg-neutral-300 text-neutral-500 cursor-not-allowed'
                : 'bg-success-600 hover:bg-success-700 text-white shadow-md hover:shadow-lg'
            }`}
          >
            {isExporting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Exportando...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Exportar Ahora
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};

const Toast: React.FC<ToastProps> = ({ status, message, onClose }) => {
  React.useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-fade-in">
      <div className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg ${
        status === 'success'
          ? 'bg-success-600 text-white'
          : 'bg-danger-600 text-white'
      }`}>
        {status === 'success' ? (
          <CheckCircle className="w-5 h-5" />
        ) : (
          <AlertCircle className="w-5 h-5" />
        )}
        <span className="font-medium">{message}</span>
        <button
          onClick={onClose}
          className="ml-2 hover:bg-white/20 rounded p-1 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};

// Funciones de utilidad para CSV
const generateCSV = (signals: Signal[], options: ExportOptions): string => {
  const headers = options.format === 'detailed'
    ? ['Ticker', 'Empresa', 'Señal', 'Trinity Score', 'Lynch', "O'Neil", 'Graham', 
       'Precio', 'Target', 'Stop Loss', 'Expected Return %', 'Sector', 'Autor', 'Risk Profile']
    : ['Ticker', 'Empresa', 'Señal', 'Trinity Score', 'Precio', 'Target', 'Sector'];

  const rows = signals.map(signal => {
    if (options.format === 'detailed') {
      return [
        signal.ticker,
        signal.companyName,
        signal.signal,
        signal.trinityScore.toFixed(1),
        signal.lynchScore,
        signal.oneilScore,
        signal.grahamScore,
        signal.price,
        signal.targetPrice || '-',
        signal.stopLoss || '-',
        signal.expectedReturn?.toFixed(1) || '-',
        signal.sector,
        signal.author,
        signal.riskProfile,
      ].join(',');
    } else {
      return [
        signal.ticker,
        signal.companyName,
        signal.signal,
        signal.trinityScore.toFixed(1),
        signal.price,
        signal.targetPrice || '-',
        signal.sector,
      ].join(',');
    }
  });

  let csv = '';
  
  if (options.includeMetadata) {
    csv += `# Indicium Signals Export\n`;
    csv += `# Fecha: ${new Date().toLocaleString()}\n`;
    csv += `# Total Señales: ${signals.length}\n`;
    csv += `#\n`;
  }
  
  if (options.includeHeaders) {
    csv += headers.join(',') + '\n';
  }
  
  csv += rows.join('\n');
  
  return csv;
};

const downloadCSV = (csvData: string, filename: string) => {
  const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export default ExportToSheets;

import React, { useMemo, useCallback, useRef, useState } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import { Search, Download, RotateCcw, XCircle, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Import AG Grid styles
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';

// Register all community modules
ModuleRegistry.registerModules([AllCommunityModule]);

/**
 * A premium reusable DataGrid component powered by AG Grid and Tailwind CSS.
 */
const DataGrid = ({
  rowData = [],
  columnDefs = [],
  loading = false,
  theme = 'ag-theme-quartz',
  height = '600px',
  gridOptions = {},
  onRowClick,
  initialSearchTerm = '',
  onResetFilters,
  hideToolbar = false,
  ...props
}) => {
  const gridRef = useRef();
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);

  // Handle export to CSV
  const onBtnExport = useCallback(() => {
    if (gridRef.current?.api) {
      gridRef.current.api.exportDataAsCsv();
    }
  }, []);

  // Handle Reset Filters
  const handleResetFilters = useCallback(() => {
    if (gridRef.current?.api) {
      gridRef.current.api.setFilterModel(null);
      gridRef.current.api.onFilterChanged();
      setSearchTerm('');
      if (onResetFilters) onResetFilters();
    }
  }, [onResetFilters]);

  // Default column definitions
  const defaultColDef = useMemo(() => ({
    sortable: true,
    filter: true,
    resizable: true,
    flex: 1,
    minWidth: 120,
    floatingFilter: false,
    suppressMenuHide: false,
    ...props.defaultColDef
  }), [props.defaultColDef]);

  return (
    <div 
      className={`bg-white rounded-2xl border border-slate-200 shadow-md p-5 flex flex-col w-full ${props.className || ''}`}
    >
      {/* Premium Toolbar */}
      {!hideToolbar && (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 px-1">
          <div className="relative max-w-sm w-full group">
            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
            <input 
              type="text"
              placeholder="Search records..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-all placeholder:text-slate-400 shadow-sm"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors"
              >
                <XCircle size={16} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleResetFilters}
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 border border-slate-200 rounded-lg hover:bg-slate-200 transition-all active:scale-95 whitespace-nowrap shadow-sm"
            >
              <RotateCcw size={14} />
              Reset Filters
            </button>
            <button
              onClick={onBtnExport}
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all active:scale-95 whitespace-nowrap"
            >
              <Download size={14} />
              Export CSV
            </button>
          </div>
        </div>
      )}

      {/* AG Grid Container with Auto Height */}
      <div className={`${theme} w-full`}>
        <AgGridReact
          ref={gridRef}
          rowData={rowData || []}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          domLayout="autoHeight"
          pagination={true}
          paginationPageSize={10}
          paginationPageSizeSelector={[10, 20, 50, 100]}
          quickFilterText={searchTerm}
          rowHeight={52}
          headerHeight={48}
          suppressCellFocus={true}
          animateRows={true}
          suppressColumnVirtualisation={true}
          overlayLoadingTemplate={
            '<div class="flex flex-col items-center gap-2 py-10"><div class="ag-overlay-loading-center text-slate-500 font-medium">Processing Data...</div></div>'
          }
          overlayNoRowsTemplate={
            '<div class="flex items-center justify-center text-slate-400 py-6 text-sm font-medium">No records available</div>'
          }
          onRowClicked={onRowClick}
          onGridReady={(params) => {
            params.api.sizeColumnsToFit();
          }}
          onFirstDataRendered={(params) => {
            params.api.sizeColumnsToFit();
          }}
          onGridSizeChanged={(params) => {
            params.api.sizeColumnsToFit();
          }}
          {...gridOptions}
          {...props}
        />
        
        <style dangerouslySetInnerHTML={{ __html: `
          /* Grid Density & Spacing */
          .ag-theme-quartz {
            --ag-header-background-color: #f1f5f9;
            --ag-header-foreground-color: #334155;
            --ag-header-cell-hover-background-color: #e2e8f0;
            --ag-row-hover-color: #eef2ff;
            --ag-selected-row-background-color: #eef2ff;
            --ag-odd-row-background-color: #f8fafc;
            --ag-border-color: #f1f5f9;
            --ag-border-radius: 12px;
            --ag-font-family: inherit;
            --ag-grid-size: 8px;
            --ag-list-item-height: 40px;
          }
          
          /* Body cell content alignment handled by cell renderers */
          .ag-cell {
            display: flex;
            align-items: center;
            font-size: 14px;
            color: #334155;
          }

          /* Premium Header Styling */
          .ag-header-cell-label {
            font-weight: 600;
            color: #334155;
            font-size: 13px;
          }

          /* Small Pipe Separator - Absolute positioning relative to header cell */
          .ag-header-cell {
            padding-right: 8px !important;
          }
          .ag-header-cell::after {
            content: "";
            position: absolute;
            right: 0;
            top: 50%;
            transform: translateY(-50%);
            height: 16px;
            width: 1px;
            background-color: #cbd5e1;
            opacity: 0.6;
            z-index: 10;
          }
          .ag-header-cell:last-child::after,
          .ag-header-cell.ag-header-cell-last::after {
            display: none !important;
          }

          /* Hide default separators & clutter */
          .ag-header-column-separator {
            display: none !important;
          }
          .ag-floating-filter {
            display: none !important;
          }

          /* Row & Layout Aesthetics */
          .ag-row-odd {
            background-color: #f8fafc !important;
          }
          .ag-header {
            border-bottom: 2px solid #e2e8f0 !important;
            background-color: #f1f5f9 !important;
          }
        `}} />
      </div>
    </div>
  );
};

export default DataGrid;

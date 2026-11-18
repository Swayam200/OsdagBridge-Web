import React, { useState } from 'react';

export interface CombinationTableRow {
  sNo: number;
  loadCase: string;
  factor: string;
}

interface AddLoadCombinationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (combination: { name: string; expr: string }) => void;
}

const LOAD_CASES = ['DL', 'DW', 'SIDL', 'LL', 'WL', 'EL', 'TL'];

export const AddLoadCombinationModal: React.FC<AddLoadCombinationModalProps> = ({
  isOpen,
  onClose,
  onSave,
}) => {
  const [comboName, setComboName] = useState('');
  const [currentLoadCase, setCurrentLoadCase] = useState('DL');
  const [currentFactor, setCurrentFactor] = useState('1.0');
  const [rows, setRows] = useState<CombinationTableRow[]>([]);
  const [selectedRowIndex, setSelectedRowIndex] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');

  if (!isOpen) return null;

  const handleReset = () => {
    setComboName('');
    setCurrentLoadCase('DL');
    setCurrentFactor('1.0');
    setRows([]);
    setSelectedRowIndex(null);
    setErrorMsg('');
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleAdd = () => {
    setErrorMsg('');
    const factorTrimmed = currentFactor.trim();
    if (!factorTrimmed || isNaN(Number(factorTrimmed))) {
      setErrorMsg('Please enter a valid Partial Safety Factor (e.g. 1.0, 1.35).');
      return;
    }

    // If load case already exists in table, update it
    const existingIndex = rows.findIndex((r) => r.loadCase === currentLoadCase);
    if (existingIndex !== -1) {
      setRows((prev) =>
        prev.map((r, i) => (i === existingIndex ? { ...r, factor: factorTrimmed } : r))
      );
      setSelectedRowIndex(existingIndex);
    } else {
      const newRow: CombinationTableRow = {
        sNo: rows.length + 1,
        loadCase: currentLoadCase,
        factor: factorTrimmed,
      };
      setRows((prev) => [...prev, newRow]);
      setSelectedRowIndex(rows.length);
    }
  };

  const handleRowClick = (index: number) => {
    setSelectedRowIndex(index);
    const row = rows[index];
    if (row) {
      setCurrentLoadCase(row.loadCase);
      setCurrentFactor(row.factor);
    }
  };

  const handleModify = () => {
    setErrorMsg('');
    if (selectedRowIndex === null || !rows[selectedRowIndex]) {
      setErrorMsg('Please select a row from the table to modify.');
      return;
    }
    const factorTrimmed = currentFactor.trim();
    if (!factorTrimmed || isNaN(Number(factorTrimmed))) {
      setErrorMsg('Please enter a valid Partial Safety Factor.');
      return;
    }

    setRows((prev) => {
      const updated = [...prev];
      updated[selectedRowIndex] = {
        ...updated[selectedRowIndex],
        loadCase: currentLoadCase,
        factor: factorTrimmed,
      };
      return updated;
    });
  };

  const handleDelete = () => {
    setErrorMsg('');
    if (selectedRowIndex === null || !rows[selectedRowIndex]) {
      setErrorMsg('Please select a row from the table to delete.');
      return;
    }

    setRows((prev) => {
      const updated = prev
        .filter((_, i) => i !== selectedRowIndex)
        .map((r, i) => ({ ...r, sNo: i + 1 }));
      return updated;
    });
    setSelectedRowIndex(null);
  };

  const handleSave = () => {
    setErrorMsg('');
    const trimmedName = comboName.trim();
    if (!trimmedName) {
      setErrorMsg('Combination Name cannot be empty.');
      return;
    }

    if (rows.length === 0) {
      setErrorMsg('Please add at least one load case to the combination table.');
      return;
    }

    // Generate expression string, e.g. "1.35DL + 1.75DW + 1.5LL"
    const expr = rows
      .map((r) => `${Number(r.factor).toFixed(r.factor.includes('.') ? r.factor.split('.')[1].length : 1)}${r.loadCase}`)
      .join(' + ');

    onSave({ name: trimmedName, expr });
    handleClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/35 flex items-center justify-center z-[10005]"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div className="w-[540px] bg-white rounded-[4px] border border-[#707070] shadow-[0_10px_28px_rgba(0,0,0,0.3)] flex flex-col overflow-hidden font-sans">
        {/* Title Bar */}
        <div className="h-8 bg-white flex items-center justify-between px-2.5 border-b-2 border-[#8cae11] select-none">
          <div className="flex items-center gap-2">
            <img
              src="/vectors/Osdag_logo.svg"
              alt="Osdag"
              width={16}
              height={16}
              className="block pointer-events-none"
            />
            <span className="text-xs font-bold text-black">
              Add Load Combination
            </span>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="bg-transparent border-0 text-sm font-bold text-[#333333] cursor-pointer leading-none px-1.5 py-0.5 hover:text-black"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-[16px_20px] flex flex-col">
          {/* Combination Name Row */}
          <div className="flex items-center gap-3.5 mb-3.5">
            <label className="text-xs text-black w-[130px]">
              Combination Name:
            </label>
            <input
              type="text"
              value={comboName}
              onChange={(e) => setComboName(e.target.value)}
              placeholder=""
              className="w-[200px] h-6 px-2 py-0.5 text-xs border border-[#757575] rounded-[4px] outline-none box-border bg-white text-black focus:border-[#90af13]"
            />
          </div>

          {/* Load Case & Partial Safety Factor Row */}
          <div className="flex items-center gap-3 mb-4">
            <label className="text-xs text-black">Load Case:</label>
            <select
              value={currentLoadCase}
              onChange={(e) => setCurrentLoadCase(e.target.value)}
              className="w-[78px] h-6 px-1.5 text-xs border border-[#757575] rounded-[4px] outline-none box-border bg-white text-black cursor-pointer focus:border-[#90af13]"
            >
              {LOAD_CASES.map((lc) => (
                <option key={lc} value={lc}>
                  {lc}
                </option>
              ))}
            </select>

            <label className="text-xs text-black ml-3">
              Partial Safety Factor:
            </label>
            <input
              type="text"
              value={currentFactor}
              onChange={(e) => setCurrentFactor(e.target.value)}
              className="w-[90px] h-6 px-2 py-0.5 text-xs border border-[#757575] rounded-[4px] outline-none box-border bg-white text-black focus:border-[#90af13]"
            />
          </div>

          {/* Table & Right Buttons Row */}
          <div className="flex gap-3.5 mb-4">
            {/* Table Container */}
            <div className="flex-1 h-[210px] border border-[#c0c0c0] rounded-[4px] bg-white overflow-y-auto box-border">
              <table className="w-full border-collapse text-[11.5px]">
                <thead>
                  <tr className="bg-[#eaeaea]">
                    <th className="p-[6px_4px] font-semibold text-[#333333] text-[11px] border-b border-r border-[#c0c0c0] w-[55px] text-center">
                      S.No
                    </th>
                    <th className="p-[6px_4px] font-semibold text-[#333333] text-[11px] border-b border-r border-[#c0c0c0] w-[140px] text-center">
                      Load Case
                    </th>
                    <th className="p-[6px_4px] font-semibold text-[#333333] text-[11px] border-b border-[#c0c0c0] text-center">
                      Partial Safety Factor
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, idx) => {
                    const isSelected = selectedRowIndex === idx;
                    return (
                      <tr
                        key={idx}
                        onClick={() => handleRowClick(idx)}
                        className={`cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-[#dbeafe]'
                            : idx % 2 === 1
                            ? 'bg-[#fcfcfc] hover:bg-[#f2f2f2]'
                            : 'bg-white hover:bg-[#f2f2f2]'
                        }`}
                      >
                        <td className="p-[5px_4px] text-center border-b border-r border-[#e8e8e8] text-black">
                          {row.sNo}
                        </td>
                        <td className="p-[5px_4px] text-center border-b border-r border-[#e8e8e8] text-black font-medium">
                          {row.loadCase}
                        </td>
                        <td className="p-[5px_4px] text-center border-b border-[#e8e8e8] text-black">
                          {row.factor}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Side Action Buttons */}
            <div className="flex flex-col gap-2 w-20">
              <button
                type="button"
                onClick={handleAdd}
                className="h-[25px] bg-white hover:bg-[#f2f2f2] border border-[#757575] rounded-[4px] text-[11.5px] font-medium text-[#222222] cursor-pointer transition-colors"
              >
                Add
              </button>
              <button
                type="button"
                onClick={handleModify}
                className="h-[25px] bg-white hover:bg-[#f2f2f2] border border-[#757575] rounded-[4px] text-[11.5px] font-medium text-[#222222] cursor-pointer transition-colors"
              >
                Modify
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="h-[25px] bg-white hover:bg-[#f2f2f2] border border-[#757575] rounded-[4px] text-[11.5px] font-medium text-[#222222] cursor-pointer transition-colors"
              >
                Delete
              </button>
            </div>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="text-[11.5px] text-[#d32f2f] mb-2.5 text-left">
              ⚠️ {errorMsg}
            </div>
          )}

          {/* Bottom Dialog Buttons */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="w-20 h-[26px] bg-[#bfbfbf] hover:bg-[#adadad] border border-[#999999] rounded-[4px] text-black text-xs font-medium cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="w-20 h-[26px] bg-[#bfbfbf] hover:bg-[#adadad] border border-[#999999] rounded-[4px] text-black text-xs font-medium cursor-pointer transition-colors"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

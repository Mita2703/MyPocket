import React, { useState, useEffect, useRef } from 'react';
import { Target, CalendarDays, Camera, X } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { SavingGoal } from '../../types';
import { formatNumber, parseRawAmount } from '../../utils/currency';
import { getCurrentDateISO } from '../../utils/date';
import { cn } from '../../utils/cn';

interface SavingGoalFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** If provided, modal is in "edit" mode */
  editGoal?: SavingGoal;
  onSubmit: (data: Omit<SavingGoal, 'id' | 'createdAt'>) => Promise<void>;
}

export const SavingGoalFormModal: React.FC<SavingGoalFormModalProps> = ({
  isOpen,
  onClose,
  editGoal,
  onSubmit,
}) => {
  const isEditing = !!editGoal;

  const [name, setName]               = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [targetDate, setTargetDate]   = useState('');
  const [photo, setPhoto]             = useState('');
  const [fileError, setFileError]     = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Prefill on edit
  useEffect(() => {
    if (editGoal) {
      setName(editGoal.name);
      setTargetAmount(formatNumber(editGoal.targetAmount));
      setTargetDate(editGoal.targetDate || '');
      setPhoto(editGoal.photo || '');
      setFileError(null);
    } else {
      setName('');
      setTargetAmount('');
      setTargetDate('');
      setPhoto('');
      setFileError(null);
    }
  }, [editGoal, isOpen]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit: 2MB
    if (file.size > 2 * 1024 * 1024) {
      setFileError('Ukuran foto terlalu besar (maksimal 2MB)');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setPhoto(reader.result as string);
    };
    reader.onerror = () => {
      setFileError('Gagal membaca file gambar');
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPhoto('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseRawAmount(targetAmount);
    if (!name.trim() || amount <= 0) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        targetAmount: amount,
        targetDate: targetDate || undefined,
        photo: photo || undefined,
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Target Tabungan' : 'Tambah Target Tabungan'}
    >
      <form onSubmit={handleSubmit} className="space-y-5">

        {/* ── Photo Uploader ── */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Foto Target
          </label>
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFileChange}
          />
          <div
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              'relative w-full h-36 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden bg-slate-50',
              photo ? 'border-rose-300' : 'border-slate-200 hover:border-rose-400 hover:bg-slate-50/50'
            )}
          >
            {photo ? (
              <>
                <img src={photo} alt="Preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="absolute top-2 right-2 w-8 h-8 rounded-full bg-slate-900/60 text-white flex items-center justify-center hover:bg-slate-900/80 transition-colors shadow-sm"
                  title="Hapus foto"
                >
                  <X size={14} />
                </button>
                <div className="absolute bottom-2 left-2 bg-slate-900/60 text-white text-[10px] font-semibold px-2 py-0.5 rounded-md">
                  Ganti Foto
                </div>
              </>
            ) : (
              <div className="text-center p-4">
                <Camera size={26} className="mx-auto text-slate-400 mb-1.5 animate-pulse-soft" />
                <p className="text-xs font-bold text-slate-600">Tambah Foto Target</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Kamera atau Galeri (Maks. 2MB)</p>
              </div>
            )}
          </div>
          {fileError && (
            <p className="text-[11px] font-semibold text-red-500 mt-1.5 ml-1">{fileError}</p>
          )}
        </div>

        {/* ── Selected preview ── */}
        <div className="flex items-center gap-3 bg-slate-50 rounded-2xl px-4 py-3 border border-slate-100">
          <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center overflow-hidden shrink-0 border border-rose-100/50">
            {photo ? (
              <img src={photo} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              <Camera size={18} className="text-rose-400" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-slate-800 truncate">{name || 'Nama target...'}</p>
            <p className="text-xs text-slate-400">
              {parseRawAmount(targetAmount) > 0
                ? `Target: Rp ${formatNumber(parseRawAmount(targetAmount))}`
                : 'Nominal target...'}
            </p>
          </div>
        </div>

        {/* ── Nama Target ── */}
        <div>
          <label htmlFor="goal-name" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
            <span className="flex items-center gap-1.5"><Target size={12} /> Nama Target</span>
          </label>
          <input
            id="goal-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Contoh: Laptop Gaming, Liburan Bali..."
            required
            maxLength={50}
            className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 border border-slate-200 text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-400 focus:bg-white transition-all"
          />
        </div>

        {/* ── Nominal Target ── */}
        <div>
          <label htmlFor="goal-amount" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
            Nominal Target
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400 select-none">Rp</span>
            <input
              id="goal-amount"
              type="text"
              inputMode="numeric"
              value={targetAmount}
              onChange={(e) => {
                const raw = parseRawAmount(e.target.value);
                setTargetAmount(raw > 0 ? formatNumber(raw) : '');
              }}
              placeholder="0"
              required
              className="w-full pl-10 pr-4 py-3 rounded-xl text-base font-bold bg-slate-50 border border-slate-200 text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-400 focus:bg-white transition-all"
            />
          </div>
        </div>

        {/* ── Target Tanggal (opsional) ── */}
        <div>
          <label htmlFor="goal-date" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
            <span className="flex items-center gap-1.5">
              <CalendarDays size={12} /> Target Tanggal
              <span className="text-slate-300 font-normal normal-case">(opsional)</span>
            </span>
          </label>
          <input
            id="goal-date"
            type="date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
            min={getCurrentDateISO()}
            className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 border border-slate-200 text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-400 focus:bg-white transition-all"
          />
        </div>

        {/* ── Submit ── */}
        <Button type="submit" fullWidth size="lg" isLoading={isSubmitting}>
          {isEditing ? 'Simpan Perubahan' : 'Buat Target Tabungan'}
        </Button>

      </form>
    </Modal>
  );
};

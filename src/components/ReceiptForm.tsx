import { useState, useRef, useEffect } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { useReactToPrint } from 'react-to-print';
import { PrintableReceipt } from './PrintableReceipt';
import { createReceipt, updateReceipt } from '../lib/receipts';
import { getCustomers } from '../lib/customers';
import { Receipt, Customer } from '../types';
import { CheckCircle, Printer, Plus, Bold, Type, AlignRight, AlignCenter, AlignJustify, Users, User, Building, Home, ChevronDown } from 'lucide-react';

export function ReceiptForm({ initialReceipt, onClearEdit }: { initialReceipt?: Receipt | null, onClearEdit?: () => void }) {
  const [view, setView] = useState<'form' | 'success'>('form');
  const [formData, setFormData] = useState<Partial<Receipt>>({
    date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
  });
  const [isSaving, setIsSaving] = useState(false);
  const [savedReceipt, setSavedReceipt] = useState<Partial<Receipt> | null>(null);

  // Customer suggestions state
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      const list = await getCustomers();
      setCustomers(list);
    } catch (e) {
      console.warn('Failed to load customers for suggestions', e);
    }
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionRef.current && !suggestionRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (initialReceipt) {
      setFormData(initialReceipt);
      setView('form');
    }
  }, [initialReceipt]);
  
  const printRef = useRef<HTMLDivElement>(null);
  
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: 'وەسڵ',
  });

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectCustomer = (customer: Customer) => {
    setFormData(prev => ({
      ...prev,
      receivedFrom: customer.name,
      building: customer.building || prev.building || '',
      apartmentNumber: customer.apartmentNumber || prev.apartmentNumber || '',
    }));
    setShowSuggestions(false);
  };

  const filteredCustomers = customers.filter(c => {
    if (!formData.receivedFrom) return true;
    return c.name.toLowerCase().includes(formData.receivedFrom.toLowerCase());
  });

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!formData.date) return;
    
    setIsSaving(true);
    try {
      if (initialReceipt && initialReceipt.id) {
        const success = await updateReceipt(initialReceipt.id, formData);
        if (success) {
          setSavedReceipt({
            ...formData,
            id: initialReceipt.id,
            receiptNumber: initialReceipt.receiptNumber
          });
          setView('success');
          loadCustomers(); // refresh customers in background
        } else {
          alert('هەڵەیەک ڕوویدا لە نوێکردنەوە');
        }
      } else {
        const result = await createReceipt(formData as any);
        if (result) {
          setSavedReceipt({
            ...formData,
            id: result.id,
            receiptNumber: result.receiptNumber
          });
          setView('success');
          loadCustomers(); // refresh customers in background
        }
      }
    } catch (error) {
      console.error(error);
      alert('هەڵەیەک ڕوویدا لە پاشەکەوتکردن');
    } finally {
      setIsSaving(false);
    }
  };

  const handleNewReceipt = () => {
    setSavedReceipt(null);
    setView('form');
    setFormData({ date: new Date().toISOString().split('T')[0] });
    if (onClearEdit) {
      onClearEdit();
    }
  };

  const isIframe = window !== window.parent;

  return (
    <>
      <aside className="w-72 bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex flex-col gap-5 shrink-0 overflow-y-auto">
        
        {view === 'form' ? (
          <>
            <h2 className="font-bold text-lg border-b pb-3 text-slate-800 shrink-0">زانیارییەکان</h2>
            
            <form id="receipt-form" onSubmit={handleSave} className="flex flex-col gap-4 shrink-0">
              
              <div className="flex bg-slate-100 p-1 rounded-xl shrink-0">
                <button
                  type="button"
                  onClick={() => setFormData(p => ({ ...p, type: 'services' }))}
                  className={`flex-1 py-2 px-1 text-xs font-bold rounded-lg transition-colors ${(!formData.type || formData.type === 'services') ? 'bg-white text-red-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  خزمەتگوزاری
                </button>
                <button
                  type="button"
                  onClick={() => setFormData(p => ({ ...p, type: 'electricity' }))}
                  className={`flex-1 py-2 px-1 text-xs font-bold rounded-lg transition-colors ${formData.type === 'electricity' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  کارەبا
                </button>
                <button
                  type="button"
                  onClick={() => setFormData(p => ({ ...p, type: 'document' }))}
                  className={`flex-1 py-2 px-1 text-xs font-bold rounded-lg transition-colors ${formData.type === 'document' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  نوسراو
                </button>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500">بەروار</label>
                <input
                  type="date"
                  name="date"
                  required
                  readOnly
                  value={formData.date || ''}
                  className="w-full bg-slate-100 text-slate-500 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none cursor-not-allowed text-left"
                  dir="ltr"
                />
              </div>

              {formData.type === 'document' ? (
                <>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500">نوسراو بۆ :</label>
                    <input
                      type="text"
                      name="documentTo"
                      placeholder="ناوی لایەن یان کەسی وەرگر..."
                      value={formData.documentTo || ''}
                      onChange={handleChange}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-500">بابەت :</label>
                      <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                        <button
                          type="button"
                          title="بۆڵد / تۆخ"
                          onClick={() => setFormData(prev => ({ ...prev, subjectIsBold: prev.subjectIsBold === false ? true : false }))}
                          className={`px-2 py-0.5 rounded text-xs font-bold transition-colors ${formData.subjectIsBold !== false ? 'bg-emerald-700 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200'}`}
                        >
                          B
                        </button>
                        <select
                          value={formData.subjectFontSize || 'base'}
                          onChange={(e) => setFormData(prev => ({ ...prev, subjectFontSize: e.target.value as any }))}
                          className="text-xs font-semibold bg-transparent text-slate-700 py-0.5 px-1 focus:outline-none cursor-pointer"
                        >
                          <option value="base">قەبارە: ئاسایی</option>
                          <option value="lg">قەبارە: گەورە</option>
                          <option value="xl">قەبارە: زۆر گەورە</option>
                        </select>
                      </div>
                    </div>
                    <input
                      type="text"
                      name="subject"
                      placeholder="بابەتی نوسراوەکە..."
                      value={formData.subject || ''}
                      onChange={handleChange}
                      className={`w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 ${formData.subjectIsBold !== false ? 'font-bold' : 'font-normal'}`}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <label className="text-xs font-bold text-slate-500">شوێن بۆ نوسینی بابەت :</label>
                      
                      {/* Toolbar for Content formatting */}
                      <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
                        {/* Bold button */}
                        <button
                          type="button"
                          title="بۆڵد / تۆخ"
                          onClick={() => setFormData(prev => ({ ...prev, contentIsBold: !prev.contentIsBold }))}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors ${formData.contentIsBold ? 'bg-emerald-700 text-white shadow-xs' : 'text-slate-700 hover:bg-slate-200'}`}
                        >
                          <Bold className="w-3.5 h-3.5" />
                          <span>بۆڵد</span>
                        </button>

                        <div className="h-4 w-px bg-slate-300"></div>

                        {/* Font Size Selector */}
                        <div className="flex items-center gap-1">
                          <Type className="w-3.5 h-3.5 text-slate-500" />
                          <select
                            value={formData.contentFontSize || 'lg'}
                            onChange={(e) => setFormData(prev => ({ ...prev, contentFontSize: e.target.value as any }))}
                            className="text-xs font-bold bg-transparent text-slate-700 py-1 px-1 focus:outline-none cursor-pointer rounded"
                          >
                            <option value="sm">فۆنت: بچووک (14px)</option>
                            <option value="base">فۆنت: ئاسایی (16px)</option>
                            <option value="lg">فۆنت: مامناوەند (18px)</option>
                            <option value="xl">فۆنت: گەورە (20px)</option>
                            <option value="2xl">فۆنت: زۆر گەورە (24px)</option>
                            <option value="3xl">فۆنت: زل / ناوازە (30px)</option>
                          </select>
                        </div>

                        <div className="h-4 w-px bg-slate-300"></div>

                        {/* Quick A- / A+ buttons */}
                        <button
                          type="button"
                          title="بچووککردنەوەی فۆنت"
                          onClick={() => {
                            const sizes: Array<Receipt['contentFontSize']> = ['sm', 'base', 'lg', 'xl', '2xl', '3xl'];
                            const current = formData.contentFontSize || 'lg';
                            const currentIndex = sizes.indexOf(current);
                            if (currentIndex > 0) {
                              setFormData(prev => ({ ...prev, contentFontSize: sizes[currentIndex - 1] }));
                            }
                          }}
                          className="px-2 py-1 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded"
                        >
                          A-
                        </button>
                        <button
                          type="button"
                          title="گەورەکردنی فۆنت"
                          onClick={() => {
                            const sizes: Array<Receipt['contentFontSize']> = ['sm', 'base', 'lg', 'xl', '2xl', '3xl'];
                            const current = formData.contentFontSize || 'lg';
                            const currentIndex = sizes.indexOf(current);
                            if (currentIndex < sizes.length - 1) {
                              setFormData(prev => ({ ...prev, contentFontSize: sizes[currentIndex + 1] }));
                            }
                          }}
                          className="px-2 py-1 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded"
                        >
                          A+
                        </button>

                        <div className="h-4 w-px bg-slate-300"></div>

                        {/* Align buttons */}
                        <div className="flex items-center gap-0.5">
                          <button
                            type="button"
                            title="ڕاست"
                            onClick={() => setFormData(prev => ({ ...prev, contentAlign: 'right' }))}
                            className={`p-1 rounded text-xs ${(formData.contentAlign || 'right') === 'right' ? 'bg-emerald-700 text-white' : 'text-slate-600 hover:bg-slate-200'}`}
                          >
                            <AlignRight className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            title="ناوەڕاست"
                            onClick={() => setFormData(prev => ({ ...prev, contentAlign: 'center' }))}
                            className={`p-1 rounded text-xs ${formData.contentAlign === 'center' ? 'bg-emerald-700 text-white' : 'text-slate-600 hover:bg-slate-200'}`}
                          >
                            <AlignCenter className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            title="هاوتاکردن"
                            onClick={() => setFormData(prev => ({ ...prev, contentAlign: 'justify' }))}
                            className={`p-1 rounded text-xs ${formData.contentAlign === 'justify' ? 'bg-emerald-700 text-white' : 'text-slate-600 hover:bg-slate-200'}`}
                          >
                            <AlignJustify className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>

                    <textarea
                      name="content"
                      rows={7}
                      placeholder="دەقی تەواوی بابەتەکە یان ناوەڕۆک لێرە بنووسە..."
                      value={formData.content || ''}
                      onChange={handleChange}
                      className={`w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 resize-y leading-relaxed transition-all ${
                        formData.contentFontSize === 'sm' ? 'text-xs' :
                        formData.contentFontSize === 'base' ? 'text-sm' :
                        formData.contentFontSize === 'xl' ? 'text-lg' :
                        formData.contentFontSize === '2xl' ? 'text-xl' :
                        formData.contentFontSize === '3xl' ? 'text-2xl' : 'text-base'
                      } ${formData.contentIsBold ? 'font-bold' : 'font-normal'} ${
                        formData.contentAlign === 'center' ? 'text-center' : formData.contentAlign === 'justify' ? 'text-justify' : 'text-right'
                      }`}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-1.5 relative" ref={suggestionRef}>
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-500">وەرگیرا لە بەڕێز</label>
                      {customers.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setShowSuggestions(prev => !prev)}
                          className="text-[11px] font-bold text-red-600 hover:text-red-700 flex items-center gap-1 bg-red-50 hover:bg-red-100 px-2 py-0.5 rounded transition-colors"
                        >
                          <Users className="w-3 h-3" />
                          <span>کڕیاران ({customers.length})</span>
                          <ChevronDown className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        name="receivedFrom"
                        placeholder="ناوی کڕیار بنووسە یان هەڵبژێرە..."
                        autoComplete="off"
                        value={formData.receivedFrom || ''}
                        onFocus={() => setShowSuggestions(true)}
                        onChange={(e) => {
                          handleChange(e);
                          setShowSuggestions(true);
                        }}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20"
                      />
                    </div>

                    {/* Customer Suggestions Dropdown */}
                    {showSuggestions && filteredCustomers.length > 0 && (
                      <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white rounded-xl shadow-xl border border-slate-200 max-h-56 overflow-y-auto divide-y divide-slate-100 animate-in fade-in slide-in-from-top-1 duration-150">
                        <div className="px-3 py-1.5 bg-slate-50 text-[11px] font-bold text-slate-500 sticky top-0 border-b border-slate-100 flex items-center justify-between">
                          <span>پێشنیاری ناوی کڕیار:</span>
                          <span className="text-[10px] text-slate-400">کلیک بکە بۆ پڕکردنەوەی خۆکار</span>
                        </div>
                        {filteredCustomers.map((cust) => (
                          <button
                            key={cust.id}
                            type="button"
                            onClick={() => handleSelectCustomer(cust)}
                            className="w-full text-right px-3 py-2 text-sm hover:bg-red-50/70 transition-colors flex items-center justify-between group"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="w-6 h-6 rounded-full bg-slate-100 group-hover:bg-red-100 flex items-center justify-center shrink-0">
                                <User className="w-3.5 h-3.5 text-slate-600 group-hover:text-red-600" />
                              </div>
                              <span className="font-bold text-slate-800 group-hover:text-red-700 truncate">{cust.name}</span>
                            </div>
                            {(cust.building || cust.apartmentNumber) && (
                              <div className="flex items-center gap-1 text-[11px] text-slate-400 group-hover:text-red-600 shrink-0 bg-slate-100 group-hover:bg-red-100/60 px-1.5 py-0.5 rounded" dir="rtl">
                                <span>{cust.building || ''}</span>
                                {cust.building && cust.apartmentNumber && <span>/</span>}
                                <span>{cust.apartmentNumber ? `شوقە ${cust.apartmentNumber}` : ''}</span>
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500">بڕی پارە (دینار)</label>
                      <input
                        type="text"
                        name="amountDinar"
                        value={formData.amountDinar || ''}
                        onChange={handleChange}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500">بڕی پارە (دۆلار)</label>
                      <input
                        type="text"
                        name="amountDollar"
                        value={formData.amountDollar || ''}
                        onChange={handleChange}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500">بڕی پارە (بە نوسین)</label>
                    <input
                      type="text"
                      name="amountText"
                      value={formData.amountText || ''}
                      onChange={handleChange}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500">باڵەخانە</label>
                      <input
                        type="text"
                        name="building"
                        value={formData.building || ''}
                        onChange={handleChange}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500">ژمارەی شوقە</label>
                      <input
                        type="text"
                        name="apartmentNumber"
                        value={formData.apartmentNumber || ''}
                        onChange={handleChange}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500">بۆ مانگی</label>
                    <select
                      name="forMonth"
                      value={formData.forMonth || ''}
                      onChange={handleChange}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20"
                    >
                      <option value="">هەڵبژێرە...</option>
                      <option value="١ - کانوونی دووەم">١ - کانوونی دووەم</option>
                      <option value="٢ - شوبات">٢ - شوبات</option>
                      <option value="٣ - ئازار">٣ - ئازار</option>
                      <option value="٤ - نیسان">٤ - نیسان</option>
                      <option value="٥ - ئایار">٥ - ئایار</option>
                      <option value="٦ - حوزەیران">٦ - حوزەیران</option>
                      <option value="٧ - تەممووز">٧ - تەممووز</option>
                      <option value="٨ - ئاب">٨ - ئاب</option>
                      <option value="٩ - ئەیلول">٩ - ئەیلول</option>
                      <option value="١٠ - تشرینی یەکەم">١٠ - تشرینی یەکەم</option>
                      <option value="١١ - تشرینی دووەم">١١ - تشرینی دووەم</option>
                      <option value="١٢ - کانوونی یەکەم">١٢ - کانوونی یەکەم</option>
                    </select>
                  </div>
                </>
              )}
            </form>

            <button
              type="submit"
              form="receipt-form"
              disabled={isSaving}
              className={`mt-4 shrink-0 w-full ${formData.type === 'document' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200' : 'bg-red-600 hover:bg-red-700 shadow-red-200'} text-white font-bold py-3 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-70`}
            >
              <span>{isSaving ? 'چاوەڕوان بە...' : 'پاشەکەوتکردن'}</span>
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center text-center gap-6 py-10 h-full">
            <CheckCircle className={`w-16 h-16 ${savedReceipt?.type === 'document' ? 'text-emerald-500' : 'text-green-500'}`} />
            <div>
              <h3 className="font-bold text-xl text-slate-800 mb-2">سەرکەوتوو بوو</h3>
              {savedReceipt?.type === 'document' ? (
                <p className="text-slate-500">نوسراوەکە بە سەرکەوتوویی پاشەکەوت کرا</p>
              ) : (
                <p className="text-slate-500">وەسڵەکە پاشەکەوت کرا بە ژمارە: <span className="font-bold text-red-600" dir="ltr">{savedReceipt?.receiptNumber}</span></p>
              )}
            </div>
            
            <div className="w-full space-y-3 mt-4">
              <button
                onClick={() => handlePrint()}
                className={`w-full ${savedReceipt?.type === 'document' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200' : 'bg-red-600 hover:bg-red-700 shadow-red-200'} text-white font-bold py-3 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-colors`}
              >
                <Printer className="w-5 h-5" />
                <span>{savedReceipt?.type === 'document' ? 'پرێنتکردنی نوسراو' : 'پرێنتکردنی وەسڵ'}</span>
              </button>

              <button
                onClick={handleNewReceipt}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
              >
                <Plus className="w-5 h-5" />
                <span>{savedReceipt?.type === 'document' ? 'نوسراوێکی نوێ' : 'وەسڵێکی نوێ'}</span>
              </button>
            </div>

            {isIframe && (
              <p className="text-xs text-amber-700 mt-4 bg-amber-50 border border-amber-200 p-3 rounded-lg text-right leading-relaxed">
                <strong className="block mb-1">تێبینی:</strong>
                ئەگەر پرێنت کارینەکرد، تکایە بەرنامەکە لە پەنجەرەیەکی نوێ (New Tab) بکەرەوە بە بەکارهێنانی دوگمەی <b>(Open App)</b> لە سەرەوەی شاشەکە.
              </p>
            )}
          </div>
        )}
      </aside>

      <section className="hidden lg:flex flex-1 bg-white rounded-2xl shadow-md border border-slate-200 p-10 relative overflow-auto flex-col items-center justify-start">
        <div className="transform scale-[0.6] origin-top bg-white shadow-xl border border-slate-100">
          <PrintableReceipt receipt={savedReceipt || formData} />
        </div>
      </section>

      {/* Hidden Print Container */}
      <div style={{ display: 'none' }}>
        <PrintableReceipt ref={printRef} receipt={savedReceipt || formData} />
      </div>
    </>
  );
}

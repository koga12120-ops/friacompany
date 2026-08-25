import { useState, useEffect, useRef, useMemo } from 'react';
import type { FormEvent } from 'react';
import { getReceipts, deleteReceipt } from '../lib/receipts';
import { getCustomers, createCustomer, updateCustomer, deleteCustomer } from '../lib/customers';
import { Receipt, Customer } from '../types';
import { 
  Search, Loader2, Edit, Printer, Trash2, X, Users, FileText, 
  Plus, User, Building, Phone, FileSignature, DollarSign, 
  Coins, Filter, ArrowLeft, Check, AlertCircle, Eye
} from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import { PrintableReceipt } from './PrintableReceipt';

interface ReceiptRecordsProps {
  onEdit?: (receipt: Receipt) => void;
  onCreateForCustomer?: (customer: Customer) => void;
}

export function ReceiptRecords({ onEdit, onCreateForCustomer }: ReceiptRecordsProps) {
  const [activeSubTab, setActiveSubTab] = useState<'receipts' | 'customers'>('receipts');
  
  // Data state
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filtering & Search state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomerFilter, setSelectedCustomerFilter] = useState<string>(''); // customer name
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');

  // Print & Delete state for receipts
  const [receiptToPrint, setReceiptToPrint] = useState<Receipt | null>(null);
  const [receiptToDelete, setReceiptToDelete] = useState<string | null>(null);
  const [isDeletingReceipt, setIsDeletingReceipt] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  // Customer Modal state
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [customerFormData, setCustomerFormData] = useState({
    name: '',
    building: '',
    apartmentNumber: '',
    phone: '',
    notes: '',
  });
  const [isSavingCustomer, setIsSavingCustomer] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [isDeletingCustomer, setIsDeletingCustomer] = useState(false);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: 'وەسڵ',
    onAfterPrint: () => setReceiptToPrint(null),
  });

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [receiptsData, customersData] = await Promise.all([
        getReceipts(),
        getCustomers(),
      ]);
      setReceipts(receiptsData);
      setCustomers(customersData);
    } catch (error) {
      console.error('Error loading records:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate stats per customer
  const customerStats = useMemo(() => {
    const stats: Record<string, { count: number; totalDinar: number; totalDollar: number }> = {};
    
    receipts.forEach(r => {
      const name = r.receivedFrom?.trim();
      if (!name) return;
      if (!stats[name]) {
        stats[name] = { count: 0, totalDinar: 0, totalDollar: 0 };
      }
      stats[name].count += 1;
      
      const dinar = parseFloat((r.amountDinar || '').replace(/,/g, '')) || 0;
      const dollar = parseFloat((r.amountDollar || '').replace(/,/g, '')) || 0;
      stats[name].totalDinar += dinar;
      stats[name].totalDollar += dollar;
    });

    return stats;
  }, [receipts]);

  // Handle Receipt Deletion
  const confirmDeleteReceipt = async () => {
    if (!receiptToDelete) return;
    setIsDeletingReceipt(true);
    try {
      const success = await deleteReceipt(receiptToDelete);
      if (success) {
        setReceipts(prev => prev.filter(r => r.id !== receiptToDelete));
      } else {
        alert('هەڵەیەک ڕوویدا لە کاتی سڕینەوەدا');
      }
    } finally {
      setIsDeletingReceipt(false);
      setReceiptToDelete(null);
    }
  };

  const triggerPrint = (receipt: Receipt) => {
    setReceiptToPrint(receipt);
    setTimeout(() => {
      handlePrint();
    }, 100);
  };

  // Filter receipts
  const filteredReceipts = useMemo(() => {
    return receipts.filter(receipt => {
      // Customer filter
      if (selectedCustomerFilter) {
        const receivedFrom = (receipt.receivedFrom || '').trim();
        if (receivedFrom !== selectedCustomerFilter.trim()) {
          return false;
        }
      }

      // Search term
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase().trim();
      return (
        (receipt.receiptNumber?.toString() || '').includes(term) ||
        (receipt.receivedFrom?.toLowerCase() || '').includes(term) ||
        (receipt.building?.toLowerCase() || '').includes(term) ||
        (receipt.apartmentNumber?.toLowerCase() || '').includes(term) ||
        (receipt.documentTo?.toLowerCase() || '').includes(term) ||
        (receipt.subject?.toLowerCase() || '').includes(term) ||
        (receipt.content?.toLowerCase() || '').includes(term) ||
        (receipt.date || '').includes(term)
      );
    });
  }, [receipts, selectedCustomerFilter, searchTerm]);

  // Filter customers
  const filteredCustomers = useMemo(() => {
    return customers.filter(customer => {
      if (!customerSearchTerm) return true;
      const term = customerSearchTerm.toLowerCase().trim();
      return (
        customer.name.toLowerCase().includes(term) ||
        (customer.building?.toLowerCase() || '').includes(term) ||
        (customer.apartmentNumber?.toLowerCase() || '').includes(term) ||
        (customer.phone?.toLowerCase() || '').includes(term) ||
        (customer.notes?.toLowerCase() || '').includes(term)
      );
    });
  }, [customers, customerSearchTerm]);

  // Selected customer total calculations
  const selectedCustomerTotals = useMemo(() => {
    if (!selectedCustomerFilter) return null;
    let totalDinar = 0;
    let totalDollar = 0;
    let count = 0;

    filteredReceipts.forEach(r => {
      count++;
      const dinar = parseFloat((r.amountDinar || '').replace(/,/g, '')) || 0;
      const dollar = parseFloat((r.amountDollar || '').replace(/,/g, '')) || 0;
      totalDinar += dinar;
      totalDollar += dollar;
    });

    return { count, totalDinar, totalDollar };
  }, [filteredReceipts, selectedCustomerFilter]);

  // Customer Form Actions
  const openAddCustomerModal = () => {
    setEditingCustomer(null);
    setCustomerFormData({
      name: '',
      building: '',
      apartmentNumber: '',
      phone: '',
      notes: '',
    });
    setIsCustomerModalOpen(true);
  };

  const openEditCustomerModal = (customer: Customer) => {
    setEditingCustomer(customer);
    setCustomerFormData({
      name: customer.name || '',
      building: customer.building || '',
      apartmentNumber: customer.apartmentNumber || '',
      phone: customer.phone || '',
      notes: customer.notes || '',
    });
    setIsCustomerModalOpen(true);
  };

  const handleSaveCustomer = async (e: FormEvent) => {
    e.preventDefault();
    if (!customerFormData.name.trim()) return;

    setIsSavingCustomer(true);
    try {
      if (editingCustomer) {
        const success = await updateCustomer(editingCustomer.id, customerFormData);
        if (success) {
          setCustomers(prev => prev.map(c => c.id === editingCustomer.id ? { ...c, ...customerFormData } : c));
          setIsCustomerModalOpen(false);
        } else {
          alert('هەڵەیەک ڕوویدا لە نوێکردنەوەی کڕیار');
        }
      } else {
        const newCustomer = await createCustomer(customerFormData);
        if (newCustomer) {
          setCustomers(prev => [newCustomer, ...prev]);
          setIsCustomerModalOpen(false);
        } else {
          alert('هەڵەیەک ڕوویدا لە دروستکردنی کڕیار');
        }
      }
    } finally {
      setIsSavingCustomer(false);
    }
  };

  const confirmDeleteCustomer = async () => {
    if (!customerToDelete) return;
    setIsDeletingCustomer(true);
    try {
      const success = await deleteCustomer(customerToDelete.id);
      if (success) {
        setCustomers(prev => prev.filter(c => c.id !== customerToDelete.id));
        if (selectedCustomerFilter === customerToDelete.name) {
          setSelectedCustomerFilter('');
        }
      } else {
        alert('هەڵەیەک ڕوویدا لە سڕینەوەی کڕیار');
      }
    } finally {
      setIsDeletingCustomer(false);
      setCustomerToDelete(null);
    }
  };

  const viewCustomerReceipts = (customerName: string) => {
    setSelectedCustomerFilter(customerName);
    setActiveSubTab('receipts');
  };

  const getTypeBadge = (type?: string) => {
    if (type === 'electricity') return <span className="bg-blue-50 text-blue-600 px-2 py-1 rounded text-xs font-bold">کارەبا</span>;
    if (type === 'document') return <span className="bg-emerald-50 text-emerald-600 px-2 py-1 rounded text-xs font-bold">نوسراو</span>;
    return <span className="bg-red-50 text-red-600 px-2 py-1 rounded text-xs font-bold">خزمەتگوزاری</span>;
  };

  return (
    <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8 flex flex-col min-h-0 relative">
      
      {/* Top Header & Sub-Tabs Navigation */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-6 border-b border-slate-100 gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveSubTab('receipts')}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-lg transition-colors ${
                activeSubTab === 'receipts'
                  ? 'bg-white text-red-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>تۆماری وەسڵەکان</span>
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeSubTab === 'receipts' ? 'bg-red-100 text-red-700' : 'bg-slate-200 text-slate-700'}`}>
                {receipts.length}
              </span>
            </button>
            <button
              onClick={() => setActiveSubTab('customers')}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-lg transition-colors ${
                activeSubTab === 'customers'
                  ? 'bg-white text-red-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>ناوی کڕیاران</span>
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeSubTab === 'customers' ? 'bg-red-100 text-red-700' : 'bg-slate-200 text-slate-700'}`}>
                {customers.length}
              </span>
            </button>
          </div>
        </div>

        {/* Action Button for Customers */}
        {activeSubTab === 'customers' && (
          <button
            onClick={openAddCustomerModal}
            className="bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-2 rounded-xl shadow-xs flex items-center gap-2 transition-colors text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>زیادکردنی کڕیاری نوێ</span>
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20 flex-1">
          <Loader2 className="w-8 h-8 animate-spin text-red-600" />
        </div>
      ) : activeSubTab === 'receipts' ? (
        /* ================= RECEIPTS VIEW ================= */
        <div className="flex flex-col flex-1 min-h-0 pt-6 gap-4">
          
          {/* Filter and Search Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
            
            {/* Customer Filter Dropdown */}
            <div className="flex items-center gap-2 flex-1 max-w-sm">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 shrink-0">
                <Filter className="w-3.5 h-3.5" />
                <span>کڕیار:</span>
              </div>
              <select
                value={selectedCustomerFilter}
                onChange={(e) => setSelectedCustomerFilter(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-red-500/20"
              >
                <option value="">هەموو کڕیاران ({receipts.length} وەسڵ)</option>
                {customers.map((c) => {
                  const count = customerStats[c.name]?.count || 0;
                  return (
                    <option key={c.id} value={c.name}>
                      {c.name} {count > 0 ? `(${count} وەسڵ)` : ''}
                    </option>
                  );
                })}
              </select>
              {selectedCustomerFilter && (
                <button
                  onClick={() => setSelectedCustomerFilter('')}
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                  title="پاککردنەوەی فلتەر"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-3 pr-9 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 transition-shadow"
                placeholder="گەڕان بەپێی ژمارە، ناو، بەروار..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Active Customer Filter Banner & Summary */}
          {selectedCustomerFilter && selectedCustomerTotals && (
            <div className="bg-red-50/70 border border-red-200 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 shrink-0 animate-in fade-in duration-200">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs text-red-600 font-bold">وەسڵەکانی کڕیاری دیاریکراو:</div>
                  <div className="text-sm font-black text-slate-800">{selectedCustomerFilter}</div>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs">
                <div className="bg-white px-3 py-1.5 rounded-lg border border-red-200 shadow-2xs font-bold text-slate-700">
                  ژمارەی وەسڵەکان: <span className="text-red-600 font-black">{selectedCustomerTotals.count}</span>
                </div>
                {selectedCustomerTotals.totalDinar > 0 && (
                  <div className="bg-white px-3 py-1.5 rounded-lg border border-red-200 shadow-2xs font-bold text-slate-700">
                    کۆی دینار: <span className="text-emerald-600 font-black font-mono">{selectedCustomerTotals.totalDinar.toLocaleString()}</span>
                  </div>
                )}
                {selectedCustomerTotals.totalDollar > 0 && (
                  <div className="bg-white px-3 py-1.5 rounded-lg border border-red-200 shadow-2xs font-bold text-slate-700">
                    کۆی دۆلار: <span className="text-blue-600 font-black font-mono">${selectedCustomerTotals.totalDollar.toLocaleString()}</span>
                  </div>
                )}
                <button
                  onClick={() => setSelectedCustomerFilter('')}
                  className="text-xs font-bold text-red-700 hover:text-red-800 underline mr-1"
                >
                  پیشاندانی هەموو وەسڵەکان
                </button>
              </div>
            </div>
          )}

          {/* Receipts Table */}
          <div className="overflow-auto flex-1 rounded-xl border border-slate-100">
            <table className="min-w-full text-sm text-right">
              <thead className="bg-slate-50 text-slate-500 font-bold sticky top-0 border-b border-slate-200 z-10">
                <tr>
                  <th scope="col" className="px-5 py-3.5">ژمارە</th>
                  <th scope="col" className="px-5 py-3.5">جۆر</th>
                  <th scope="col" className="px-5 py-3.5">بەروار</th>
                  <th scope="col" className="px-5 py-3.5">ناوی کڕیار / وەرگر</th>
                  <th scope="col" className="px-5 py-3.5">باڵەخانە / شوقە</th>
                  <th scope="col" className="px-5 py-3.5">بڕ (دینار)</th>
                  <th scope="col" className="px-5 py-3.5">بڕ (دۆلار)</th>
                  <th scope="col" className="px-5 py-3.5 text-center">کردارەکان</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
                {filteredReceipts.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-slate-500">
                      هیچ وەسڵێک نەدۆزرایەوە
                    </td>
                  </tr>
                ) : (
                  filteredReceipts.map((receipt) => (
                    <tr key={receipt.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3.5 whitespace-nowrap font-bold text-slate-800">
                        {receipt.type === 'document' ? '-' : (receipt.receiptNumber ? String(receipt.receiptNumber).padStart(4, '0') : '-')}
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        {getTypeBadge(receipt.type)}
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap font-mono text-xs" dir="ltr">
                        {receipt.date}
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap font-bold text-slate-800 max-w-[170px] truncate" title={receipt.documentTo || receipt.receivedFrom}>
                        {receipt.type === 'document' ? (
                          receipt.documentTo || receipt.receivedFrom || '-'
                        ) : (
                          <button
                            onClick={() => receipt.receivedFrom && viewCustomerReceipts(receipt.receivedFrom)}
                            className="hover:text-red-600 hover:underline transition-colors text-right"
                            title="فلتەرکردن بەپێی ئەم کڕیارە"
                          >
                            {receipt.receivedFrom || '-'}
                          </button>
                        )}
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap text-slate-500 max-w-[160px] truncate" title={receipt.type === 'document' ? receipt.subject : undefined}>
                        {receipt.type === 'document' ? (
                          receipt.subject ? `بابەت: ${receipt.subject}` : 'نوسراوی فەرمی'
                        ) : (
                          `${receipt.building || '-'} / ${receipt.apartmentNumber || '-'}`
                        )}
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap font-mono font-bold text-emerald-600">
                        {receipt.type === 'document' ? '-' : (receipt.amountDinar || '-')}
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap font-mono font-bold text-blue-600">
                        {receipt.type === 'document' ? '-' : (receipt.amountDollar || '-')}
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => triggerPrint(receipt)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
                            title="چاپکردنەوە"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onEdit && onEdit(receipt)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                            title="دەستکاری"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => receipt.id && setReceiptToDelete(receipt.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                            title="سڕینەوە"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* ================= CUSTOMERS VIEW ================= */
        <div className="flex flex-col flex-1 min-h-0 pt-6 gap-4">
          
          {/* Customer Search */}
          <div className="flex items-center justify-between gap-4 shrink-0">
            <div className="relative w-full sm:w-80">
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-3 pr-9 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 transition-shadow"
                placeholder="گەڕان بەپێی ناوی کڕیار، باڵەخانە، مۆبایل..."
                value={customerSearchTerm}
                onChange={(e) => setCustomerSearchTerm(e.target.value)}
              />
            </div>
            
            <span className="text-xs text-slate-500 font-bold hidden sm:inline">
              کۆی گشتی: {filteredCustomers.length} کڕیار
            </span>
          </div>

          {/* Customers Table */}
          <div className="overflow-auto flex-1 rounded-xl border border-slate-100">
            <table className="min-w-full text-sm text-right">
              <thead className="bg-slate-50 text-slate-500 font-bold sticky top-0 border-b border-slate-200 z-10">
                <tr>
                  <th scope="col" className="px-5 py-3.5">ناوی کڕیار</th>
                  <th scope="col" className="px-5 py-3.5">باڵەخانە و شوقە</th>
                  <th scope="col" className="px-5 py-3.5">ژمارەی مۆبایل</th>
                  <th scope="col" className="px-5 py-3.5">تێبینی</th>
                  <th scope="col" className="px-5 py-3.5">وەسڵە تۆمارکراوەکان</th>
                  <th scope="col" className="px-5 py-3.5 text-center">کردارەکان</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
                {filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                      هیچ کڕیارێک نەدۆزرایەوە. دەتوانیت لە ڕێگەی دوگمەی سەرەوە کڕیاری نوێ زیاد بکەیت.
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((customer) => {
                    const stats = customerStats[customer.name];
                    const receiptCount = stats?.count || 0;

                    return (
                      <tr key={customer.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold shrink-0">
                              <User className="w-4 h-4" />
                            </div>
                            <span className="font-bold text-slate-900">{customer.name}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap text-slate-600">
                          {customer.building || customer.apartmentNumber ? (
                            <span className="inline-flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded text-xs font-semibold">
                              <Building className="w-3 h-3 text-slate-400" />
                              <span>{customer.building || '-'}</span>
                              <span>/</span>
                              <span>شوقە {customer.apartmentNumber || '-'}</span>
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap text-slate-600 font-mono text-xs" dir="ltr">
                          {customer.phone || '-'}
                        </td>
                        <td className="px-5 py-3.5 text-slate-500 max-w-[200px] truncate text-xs" title={customer.notes}>
                          {customer.notes || '-'}
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          {receiptCount > 0 ? (
                            <button
                              onClick={() => viewCustomerReceipts(customer.name)}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 hover:bg-red-100 transition-colors"
                              title="کلیک بکە بۆ بینینی هەموو وەسڵەکان"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span>{receiptCount} وەسڵ</span>
                              <Eye className="w-3 h-3 mr-0.5" />
                            </button>
                          ) : (
                            <span className="text-xs text-slate-400">وەسڵ نییە</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {/* Create receipt for this customer */}
                            <button
                              onClick={() => onCreateForCustomer && onCreateForCustomer(customer)}
                              className="px-2.5 py-1 text-xs font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg transition-colors flex items-center gap-1"
                              title="دروستکردنی وەسڵی نوێ بۆ ئەم کڕیارە"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>وەسڵ</span>
                            </button>

                            {/* View Receipts */}
                            {receiptCount > 0 && (
                              <button
                                onClick={() => viewCustomerReceipts(customer.name)}
                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                title="پیشاندانی وەسڵەکان"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            )}

                            {/* Edit Customer */}
                            <button
                              onClick={() => openEditCustomerModal(customer)}
                              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                              title="دەستکاری کڕیار"
                            >
                              <Edit className="w-4 h-4" />
                            </button>

                            {/* Delete Customer */}
                            <button
                              onClick={() => setCustomerToDelete(customer)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                              title="سڕینەوەی کڕیار"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Customer Modal */}
      {isCustomerModalOpen && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/50 rounded-2xl backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Users className="w-5 h-5 text-red-600" />
                <span>{editingCustomer ? 'دەستکاری زانیاری کڕیار' : 'زیادکردنی کڕیاری نوێ'}</span>
              </h3>
              <button 
                onClick={() => setIsCustomerModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomer} className="flex flex-col gap-3.5">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600">ناوی تەواوی کڕیار <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="ناوی کڕیار بنووسە..."
                  value={customerFormData.name}
                  onChange={(e) => setCustomerFormData(p => ({ ...p, name: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600">باڵەخانە</label>
                  <input
                    type="text"
                    placeholder="ناوی باڵەخانە..."
                    value={customerFormData.building}
                    onChange={(e) => setCustomerFormData(p => ({ ...p, building: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600">ژمارەی شوقە</label>
                  <input
                    type="text"
                    placeholder="ژمارەی شوقە..."
                    value={customerFormData.apartmentNumber}
                    onChange={(e) => setCustomerFormData(p => ({ ...p, apartmentNumber: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600">ژمارەی مۆبایل</label>
                <input
                  type="text"
                  placeholder="0750 xxx xxxx"
                  dir="ltr"
                  value={customerFormData.phone}
                  onChange={(e) => setCustomerFormData(p => ({ ...p, phone: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-left focus:outline-none focus:ring-2 focus:ring-red-500/20"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600">تێبینی</label>
                <textarea
                  rows={2}
                  placeholder="تێبینی زیادە لەسەر کڕیار..."
                  value={customerFormData.notes}
                  onChange={(e) => setCustomerFormData(p => ({ ...p, notes: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 resize-none"
                />
              </div>

              <div className="flex gap-2.5 mt-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCustomerModalOpen(false)}
                  className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors text-sm"
                >
                  پاشگەزبوونەوە
                </button>
                <button
                  type="submit"
                  disabled={isSavingCustomer}
                  className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 text-sm disabled:opacity-70"
                >
                  {isSavingCustomer ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  <span>{editingCustomer ? 'پاشەکەوتکردنی دەستکاری' : 'زیادکردنی کڕیار'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Customer Confirmation Modal */}
      {customerToDelete && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/50 rounded-2xl backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-800">سڕینەوەی کڕیار</h3>
              <button 
                onClick={() => setCustomerToDelete(null)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-slate-600 text-sm">
              ئایا دڵنیایت لە سڕینەوەی کڕیاری <b>«{customerToDelete.name}»</b> لە لیستی کڕیاران؟
            </p>
            <div className="flex gap-3 mt-2">
              <button
                onClick={() => setCustomerToDelete(null)}
                disabled={isDeletingCustomer}
                className="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition-colors text-sm"
              >
                پاشگەزبوونەوە
              </button>
              <button
                onClick={confirmDeleteCustomer}
                disabled={isDeletingCustomer}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
              >
                {isDeletingCustomer ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                <span>سڕینەوە</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Receipt Confirmation Modal */}
      {receiptToDelete && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/50 rounded-2xl backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-800">سڕینەوەی وەسڵ</h3>
              <button 
                onClick={() => setReceiptToDelete(null)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-slate-600 text-sm">
              ئایا دڵنیایت لە سڕینەوەی ئەم وەسڵە؟ ئەم کردارە پاشگەزبوونەوەی نییە.
            </p>
            <div className="flex gap-3 mt-2">
              <button
                onClick={() => setReceiptToDelete(null)}
                disabled={isDeletingReceipt}
                className="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition-colors text-sm"
              >
                پاشگەزبوونەوە
              </button>
              <button
                onClick={confirmDeleteReceipt}
                disabled={isDeletingReceipt}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
              >
                {isDeletingReceipt ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                <span>سڕینەوە</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden Print Container */}
      <div style={{ display: 'none' }}>
        {receiptToPrint && (
          <PrintableReceipt ref={printRef} receipt={receiptToPrint} />
        )}
      </div>
    </div>
  );
}

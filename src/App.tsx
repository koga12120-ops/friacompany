import { useState, useEffect } from 'react';
import { AuthButton, useAuth } from './components/Auth';
import { ReceiptForm } from './components/ReceiptForm';
import { ReceiptRecords } from './components/ReceiptRecords';
import { SecurityPinScreen } from './components/SecurityPinScreen';
import { Receipt } from './types';

export default function App() {
  const { user, loading, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<'create' | 'records'>('create');
  const [editingReceipt, setEditingReceipt] = useState<Receipt | null>(null);
  const [isPinVerified, setIsPinVerified] = useState<boolean>(false);

  // Check if PIN was already verified for this user's Gmail/UID
  useEffect(() => {
    if (user) {
      const verifiedByUid = localStorage.getItem(`fria_pin_verified_${user.uid}`) === 'true';
      const verifiedByEmail = user.email ? localStorage.getItem(`fria_pin_verified_${user.email}`) === 'true' : false;
      const verifiedBySession = sessionStorage.getItem(`fria_pin_verified_${user.uid}`) === 'true';
      
      if (verifiedByUid || verifiedByEmail || verifiedBySession) {
        setIsPinVerified(true);
      } else {
        setIsPinVerified(false);
      }
    } else {
      setIsPinVerified(false);
    }
  }, [user]);

  const handleEdit = (receipt: Receipt) => {
    setEditingReceipt(receipt);
    setActiveTab('create');
  };

  const handleCreateForCustomer = (customer: any) => {
    setEditingReceipt({
      id: '',
      userId: user?.uid || '',
      receiptNumber: 0,
      date: new Date().toISOString().split('T')[0],
      receivedFrom: customer.name,
      building: customer.building || '',
      apartmentNumber: customer.apartmentNumber || '',
      createdAt: Date.now()
    });
    setActiveTab('create');
  };

  const handleTabChange = (tab: 'create' | 'records') => {
    if (tab === 'create' && activeTab !== 'create') {
      setEditingReceipt(null);
    }
    setActiveTab(tab);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans overflow-hidden text-slate-800" dir="rtl">
      {/* Header - No print */}
      <nav className="no-print h-16 bg-white border-b flex items-center justify-between px-6 sm:px-8 shrink-0">
        <div className="flex items-center gap-6 sm:gap-8">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full border-2 border-red-600/30 bg-white flex items-center justify-center overflow-hidden shadow-xs p-0.5">
              <img src="/frialogo.jpg" alt="Fria Logo" className="w-full h-full object-contain rounded-full" />
            </div>
            <span className="text-xl font-bold text-slate-900 tracking-tight">سیستەمی فریا</span>
          </div>

          {user && isPinVerified && (
            <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
              <button
                onClick={() => handleTabChange('create')}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'create'
                    ? 'bg-white shadow-sm text-slate-900'
                    : 'text-slate-500 hover:bg-slate-200'
                }`}
              >
                {editingReceipt ? 'دەستکاری وەسڵ' : 'وەسڵ نوێ'}
              </button>
              <button
                onClick={() => handleTabChange('records')}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'records'
                    ? 'bg-white shadow-sm text-slate-900'
                    : 'text-slate-500 hover:bg-slate-200'
                }`}
              >
                تۆمارەکان
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <AuthButton />
        </div>
      </nav>

      <main className="no-print flex-1 flex flex-col gap-6 p-4 sm:p-6 overflow-auto">
        {!user ? (
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 sm:p-12 text-center max-w-xl mx-auto my-auto flex flex-col items-center">
            <div className="w-24 h-24 rounded-full border-4 border-red-600 bg-white flex items-center justify-center shadow-lg p-1.5 mb-6 overflow-hidden">
              <img src="/frialogo.jpg" alt="Fria Logo" className="w-full h-full object-contain rounded-full" />
            </div>
            <h2 className="text-2xl font-black text-slate-800 mb-2 tracking-tight">بەخێربێیت بۆ سیستەمی وەسڵی فریا</h2>
            <p className="text-slate-500 mb-8 text-sm leading-relaxed max-w-md">
              بۆ بەکارهێنانی سیستەمەکە و دروستکردن و چاپکردنی وەسڵ، تکایە سەرەتا بە هەژماری گۆگڵەکەت بچۆ ژوورەوە.
            </p>
            <div className="flex justify-center">
              <AuthButton />
            </div>
          </div>
        ) : !isPinVerified ? (
          <SecurityPinScreen
            user={user}
            onSuccess={() => setIsPinVerified(true)}
            onSignOut={signOut}
          />
        ) : (
          <div className="flex-1 flex gap-6 min-h-0 h-full">
            {activeTab === 'create' ? (
              <ReceiptForm initialReceipt={editingReceipt} onClearEdit={() => setEditingReceipt(null)} />
            ) : (
              <ReceiptRecords onEdit={handleEdit} onCreateForCustomer={handleCreateForCustomer} />
            )}
          </div>
        )}
      </main>
    </div>
  );
}


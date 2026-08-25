import { forwardRef } from 'react';
import { Receipt } from '../types';
import { Phone, Scissors } from 'lucide-react';

interface Props {
  receipt: Partial<Receipt>;
}

const getContentFontSizeClass = (size?: string) => {
  switch (size) {
    case 'sm': return 'text-sm leading-relaxed';
    case 'base': return 'text-base leading-relaxed';
    case 'lg': return 'text-lg leading-loose';
    case 'xl': return 'text-xl leading-loose';
    case '2xl': return 'text-2xl leading-loose';
    case '3xl': return 'text-3xl leading-loose';
    default: return 'text-lg leading-loose';
  }
};

const getSubjectFontSizeClass = (size?: string) => {
  switch (size) {
    case 'base': return 'text-base';
    case 'lg': return 'text-lg';
    case 'xl': return 'text-xl';
    case '2xl': return 'text-2xl';
    default: return 'text-base';
  }
};

const getContentAlignClass = (align?: string) => {
  switch (align) {
    case 'center': return 'text-center';
    case 'justify': return 'text-justify';
    default: return 'text-right';
  }
};

const DocumentPage = ({ receipt }: { receipt: Partial<Receipt> }) => {
  const contentFontClass = getContentFontSizeClass(receipt.contentFontSize);
  const contentBoldClass = receipt.contentIsBold ? 'font-bold' : 'font-normal';
  const contentAlignClass = getContentAlignClass(receipt.contentAlign);

  const subjectFontClass = getSubjectFontSizeClass(receipt.subjectFontSize);
  const subjectBoldClass = receipt.subjectIsBold !== false ? 'font-bold' : 'font-normal';

  return (
    <div className="w-[210mm] min-h-[297mm] bg-white text-slate-800 p-6 font-sans relative flex flex-col box-border" style={{ direction: 'rtl' }}>
      <div className="flex flex-col flex-1 border-2 border-emerald-800 bg-white">
        
        {/* Header */}
        <div className="flex justify-between items-center px-10 pt-8 pb-5">
          {/* Kurdish Side with Phone Numbers */}
          <div className="text-right flex-1">
            <h1 className="text-3xl font-black text-emerald-800 mb-1 tracking-tight">کۆمپانیای فریا</h1>
            <p className="text-sm font-bold text-slate-600 mb-2">بۆ خزمەتگوزارییە گشتییەکان</p>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-600" dir="ltr">
              <Phone className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
              <span>0751 726 1739 &nbsp;|&nbsp; 0787 169 3469</span>
            </div>
          </div>
          
          {/* Logo Center */}
          <div className="flex-shrink-0 mx-6">
            <div className="w-28 h-28 rounded-full border-4 border-emerald-700 flex items-center justify-center relative bg-white overflow-hidden p-1 shadow-sm">
              <div className="absolute inset-0 rounded-full border-2 border-emerald-900 m-1 pointer-events-none"></div>
              <img src="/frialogo.jpg" alt="Fria Company Logo" className="w-full h-full object-contain rounded-full" />
            </div>
          </div>

          {/* English Side */}
          <div className="text-left flex-1" dir="ltr">
            <h1 className="text-3xl font-black text-emerald-800 mb-1 tracking-tight">Fria Company</h1>
            <p className="text-sm font-bold text-slate-600 mb-2">General Services</p>
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600" dir="rtl">
              <span className="font-bold text-slate-700">بەروار:</span>
              <span className="font-mono text-slate-800" dir="ltr">{receipt.date || new Date().toISOString().split('T')[0]}</span>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-b-2 border-emerald-800 mx-10"></div>

        {/* Middle Section (Info & Content) */}
        <div className="px-12 py-6 flex-1 flex flex-col">
          
          {/* Document metadata (بە بچوکی) */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-4 flex flex-col gap-3">
            <div className="flex items-center gap-2 text-sm sm:text-base">
              <span className="font-bold text-slate-700 whitespace-nowrap min-w-[90px]">نوسراو بۆ :</span>
              <span className="font-bold text-slate-900 border-b border-dotted border-slate-400 flex-1 pb-0.5">
                {receipt.documentTo || receipt.receivedFrom || ' '}
              </span>
            </div>
            
            <div className="flex items-center gap-2 text-sm sm:text-base">
              <span className="font-bold text-slate-700 whitespace-nowrap min-w-[90px]">بابەت :</span>
              <span className={`${subjectFontClass} ${subjectBoldClass} text-emerald-800 border-b border-dotted border-slate-400 flex-1 pb-0.5`}>
                {receipt.subject || ' '}
              </span>
            </div>
          </div>

          {/* Divider between metadata and content */}
          <div className="border-b border-dashed border-slate-300 my-2"></div>

          {/* Content / Subject Writing Area */}
          <div className="flex-1 flex flex-col mt-4">
            <div className={`flex-1 bg-white border border-slate-200 rounded-xl p-6 ${contentFontClass} ${contentBoldClass} ${contentAlignClass} text-slate-800 whitespace-pre-wrap min-h-[350px]`}>
              {receipt.content ? (
                receipt.content
              ) : (
                <div className="h-full flex flex-col justify-between opacity-25 pointer-events-none py-4 min-h-[300px]">
                  <div className="border-b border-slate-300 pb-10"></div>
                  <div className="border-b border-slate-300 pb-10"></div>
                  <div className="border-b border-slate-300 pb-10"></div>
                  <div className="border-b border-slate-300 pb-10"></div>
                  <div className="border-b border-slate-300 pb-10"></div>
                </div>
              )}
            </div>
          </div>

          {/* Signatures */}
          <div className="flex justify-between px-16 mt-8 pt-8 pb-4">
            <div className="text-center">
              <p className="font-bold text-lg mb-16 text-slate-800">واژوو</p>
            </div>
            <div className="text-center">
              <p className="font-bold text-lg mb-16 text-slate-800">واژوو</p>
            </div>
          </div>
        </div>

        {/* Footer Accent */}
        <div className="h-3 bg-emerald-800 w-full"></div>

      </div>
    </div>
  );
};

const CompactReceiptHalf = ({ receipt, copyLabel }: { receipt: Partial<Receipt>, copyLabel: string }) => {
  const type = receipt.type || 'services';
  
  const primaryText = type === 'electricity' ? 'text-blue-700' : 'text-red-600';
  const primaryBorder = type === 'electricity' ? 'border-blue-700' : 'border-red-600';
  
  const secondaryBg = type === 'electricity' ? 'bg-slate-800' : 'bg-[#185b9d]';
  const secondaryBorder = type === 'electricity' ? 'border-slate-800' : 'border-[#185b9d]';
  
  const titleAr = type === 'electricity' ? 'پسوولەی پارەی کارەبا مۆلیدە' : 'پسوولەی پارەی خزمەتگوزاری (خدمات)';
  const titleEn = type === 'electricity' ? 'Electricity Receipt' : 'Cleaning Service';
  const subtitleAr = type === 'electricity' ? 'بۆ خزمەتگوزاری کارەبا' : 'بۆ خزمەتگوزاری خاوێنکردنەوە';

  return (
    <div className={`flex flex-col flex-1 border-2 ${secondaryBorder} bg-white relative rounded-sm overflow-hidden min-h-[134mm] max-h-[138mm]`}>
      
      {/* Header */}
      <div className="flex justify-between items-center px-6 pt-3 pb-1.5 relative">
        <div className="text-right flex-1">
          <h1 className={`text-xl font-black ${primaryText} tracking-tight leading-tight`}>کۆمپانیای فریا</h1>
          <p className="text-xs font-bold text-slate-600">{subtitleAr}</p>
        </div>
        
        <div className="flex-shrink-0 mx-3 flex flex-col items-center">
          <div className={`w-13 h-13 rounded-full border-2 ${primaryBorder} flex items-center justify-center relative bg-white overflow-hidden p-0.5 shadow-2xs`}>
            <div className={`absolute inset-0 rounded-full border ${secondaryBorder} m-0.5 pointer-events-none`}></div>
            <img src="/frialogo.jpg" alt="Fria Company Logo" className="w-full h-full object-contain rounded-full" />
          </div>
        </div>

        <div className="text-left flex-1 relative" dir="ltr">
          <div className="flex items-start justify-between">
            <div>
              <h1 className={`text-xl font-black ${primaryText} tracking-tight leading-tight`}>Fria Company</h1>
              <p className="text-xs font-bold text-slate-600">{titleEn}</p>
            </div>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold text-slate-700 bg-slate-100 border border-slate-300 shadow-2xs print:bg-white print:text-black print:border-slate-400" dir="rtl">
              {copyLabel}
            </span>
          </div>
          <p className={`text-xs font-bold ${primaryText} mt-0.5`}>No. {receipt.receiptNumber ? String(receipt.receiptNumber).padStart(4, '0') : '0000'}</p>
        </div>
      </div>

      {/* Divider */}
      <div className="border-b border-slate-300 mx-6"></div>

      {/* Middle Section */}
      <div className="px-6 py-2 flex-1 flex flex-col justify-between">
        
        {/* Title */}
        <h2 className={`text-center text-sm font-black ${primaryText} mb-1.5`}>
          {titleAr}
        </h2>

        <div className="flex gap-4 items-start">
          {/* Form Fields (Right side in RTL) */}
          <div className="flex-1 flex flex-col gap-2 text-xs font-medium">
            <div className="flex items-end gap-1.5">
              <span className="font-bold whitespace-nowrap text-slate-700">باڵە خانه /</span>
              <span className="flex-1 border-b border-dotted border-slate-400 text-center pb-0.5 font-bold text-xs text-slate-900">{receipt.building || ' '}</span>
              <span className="font-bold whitespace-nowrap mr-2 text-slate-700">ژمارەی شوقە /</span>
              <span className="flex-1 border-b border-dotted border-slate-400 text-center pb-0.5 font-bold text-xs text-slate-900">{receipt.apartmentNumber || ' '}</span>
            </div>
            
            <div className="flex items-end gap-1.5">
              <span className="font-bold whitespace-nowrap text-slate-700">وەرگیرا لە بەڕێز :</span>
              <span className="flex-1 border-b border-dotted border-slate-400 text-center pb-0.5 font-bold text-xs text-slate-900">{receipt.receivedFrom || ' '}</span>
            </div>
            
            <div className="flex items-end gap-1.5">
              <span className="font-bold whitespace-nowrap text-slate-700">بڕی پارە :</span>
              <span className="flex-1 border-b border-dotted border-slate-400 text-center pb-0.5 font-bold text-xs text-slate-900">{receipt.amountText || ' '}</span>
            </div>
            
            <div className="flex items-end gap-1.5">
              <span className="font-bold whitespace-nowrap text-slate-700">ئەم بڕە پارەیە بۆ مانگی :</span>
              <span className="flex-1 border-b border-dotted border-slate-400 text-center pb-0.5 font-bold text-xs text-slate-900">{receipt.forMonth || ' '}</span>
            </div>
          </div>

          {/* Amount Box & Date (Left side in RTL) */}
          <div className="w-[175px] flex flex-col gap-2 shrink-0">
            <div className="flex items-center gap-1.5 text-xs" dir="rtl">
              <span className="font-bold text-slate-700">بەروار :</span>
              <span className="flex-1 text-center font-mono font-bold text-xs text-slate-900" dir="ltr">{receipt.date || ' '}</span>
            </div>
            
            <div className={`border-2 ${secondaryBorder} rounded-lg overflow-hidden`}>
              <div className={`flex ${secondaryBg} text-white font-bold text-xs`}>
                <div className="flex-1 text-center py-1 border-l border-white/30">دینار ID</div>
                <div className="flex-1 text-center py-1">دۆلار $</div>
              </div>
              <div className="flex text-sm font-bold bg-white">
                <div className="flex-1 text-center py-2 border-l-2 border-slate-200 text-slate-900">{receipt.amountDinar || ' '}</div>
                <div className="flex-1 text-center py-2 text-slate-900">{receipt.amountDollar || ' '}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Signatures */}
        <div className="flex justify-between px-10 pt-3 pb-1">
          <div className="text-center">
            <p className="font-bold text-xs text-slate-800">واژووی پارە دان</p>
          </div>
          <div className="text-center">
            <p className="font-bold text-xs text-slate-800">واژووی وەرگر</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className={`${secondaryBg} text-white px-8 py-1.5 flex justify-between items-center`} dir="ltr">
        <div className="flex items-center gap-2">
          <Phone className="w-3.5 h-3.5" />
          <span className="text-xs font-bold tracking-wider">0751 726 1739</span>
        </div>
        <div className="flex items-center gap-2">
          <Phone className="w-3.5 h-3.5" />
          <span className="text-xs font-bold tracking-wider">0787 169 3469</span>
        </div>
      </div>

    </div>
  );
};

const DualReceiptPage = ({ receipt }: { receipt: Partial<Receipt> }) => {
  return (
    <div className="w-[210mm] min-h-[297mm] h-[297mm] max-h-[297mm] bg-white text-slate-800 p-4 font-sans relative flex flex-col justify-between box-border" style={{ direction: 'rtl' }}>
      {/* Top Copy - کڕیار */}
      <CompactReceiptHalf receipt={receipt} copyLabel="کۆپی کڕیار" />

      {/* Scissor Cut Line in Middle */}
      <div className="relative flex items-center justify-center my-2 py-0.5 print:my-2">
        <div className="border-t-2 border-dashed border-slate-400 w-full absolute"></div>
        <div className="relative bg-white px-3 flex items-center gap-2 text-slate-500 font-bold text-xs">
          <Scissors className="w-4 h-4 text-slate-600 rotate-90" />
          <span className="text-[11px] text-slate-500 font-medium">بڕینی پسوولە</span>
          <Scissors className="w-4 h-4 text-slate-600 -rotate-90" />
        </div>
      </div>

      {/* Bottom Copy - کۆمپانیا */}
      <CompactReceiptHalf receipt={receipt} copyLabel="کۆپی کۆمپانیا" />
    </div>
  );
};

export const PrintableReceipt = forwardRef<HTMLDivElement, Props>(({ receipt }, ref) => {
  const isDocument = receipt.type === 'document';

  return (
    <div ref={ref} className="bg-slate-50 print:bg-white flex flex-col items-center w-max p-10 print:p-0">
      {isDocument ? (
        <DocumentPage receipt={receipt} />
      ) : (
        <DualReceiptPage receipt={receipt} />
      )}
    </div>
  );
});

PrintableReceipt.displayName = 'PrintableReceipt';


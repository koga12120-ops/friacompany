export interface Receipt {
  id: string;
  userId: string;
  receiptNumber: number;
  type?: 'services' | 'electricity' | 'document';
  amountDinar?: string;
  amountDollar?: string;
  date: string;
  building?: string;
  apartmentNumber?: string;
  receivedFrom?: string;
  amountText?: string;
  forMonth?: string;
  documentTo?: string;
  subject?: string;
  content?: string;
  contentFontSize?: 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl';
  contentIsBold?: boolean;
  contentAlign?: 'right' | 'center' | 'justify';
  subjectFontSize?: 'base' | 'lg' | 'xl' | '2xl';
  subjectIsBold?: boolean;
  createdAt: number;
}

export interface Customer {
  id: string;
  userId: string;
  name: string;
  building?: string;
  apartmentNumber?: string;
  phone?: string;
  notes?: string;
  createdAt: number;
}

export interface UserCounter {
  userId: string;
  lastReceiptNumber: number;
  updatedAt: number;
}


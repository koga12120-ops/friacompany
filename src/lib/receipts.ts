import { collection, doc, runTransaction, getDocs, query, orderBy, serverTimestamp, updateDoc, deleteDoc } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from './firebase';
import { Receipt } from '../types';
import { syncCustomerFromReceipt } from './customers';

export async function createReceipt(data: Omit<Receipt, 'id' | 'userId' | 'receiptNumber' | 'createdAt'>) {
  if (!auth.currentUser) throw new Error('Not authenticated');
  const userId = auth.currentUser.uid;
  
  const counterRef = doc(db, `users/${userId}/counters/receiptCounter`);
  const receiptRef = doc(collection(db, `users/${userId}/receipts`));
  
  try {
    const receiptNumber = await runTransaction(db, async (transaction) => {
      const counterDoc = await transaction.get(counterRef);
      let newReceiptNumber = 1;
      
      if (counterDoc.exists()) {
        newReceiptNumber = counterDoc.data().lastReceiptNumber + 1;
        transaction.update(counterRef, {
          lastReceiptNumber: newReceiptNumber,
          updatedAt: serverTimestamp()
        });
      } else {
        transaction.set(counterRef, {
          userId,
          lastReceiptNumber: newReceiptNumber,
          updatedAt: serverTimestamp()
        });
      }
      
      const receipt: Receipt = {
        ...data,
        id: receiptRef.id,
        userId,
        receiptNumber: newReceiptNumber,
        createdAt: Date.now() // Local optimistic value, replaced below
      };
      
      const dbReceipt = {
        userId: receipt.userId,
        receiptNumber: receipt.receiptNumber,
        date: receipt.date,
        createdAt: serverTimestamp(),
        ...(data.type ? { type: data.type } : {}),
        ...(data.amountDinar ? { amountDinar: data.amountDinar } : {}),
        ...(data.amountDollar ? { amountDollar: data.amountDollar } : {}),
        ...(data.building ? { building: data.building } : {}),
        ...(data.apartmentNumber ? { apartmentNumber: data.apartmentNumber } : {}),
        ...(data.receivedFrom ? { receivedFrom: data.receivedFrom } : {}),
        ...(data.amountText ? { amountText: data.amountText } : {}),
        ...(data.forMonth ? { forMonth: data.forMonth } : {}),
        ...(data.documentTo ? { documentTo: data.documentTo } : {}),
        ...(data.subject ? { subject: data.subject } : {}),
        ...(data.content ? { content: data.content } : {}),
        ...(data.contentFontSize ? { contentFontSize: data.contentFontSize } : {}),
        ...(data.contentIsBold !== undefined ? { contentIsBold: data.contentIsBold } : {}),
        ...(data.contentAlign ? { contentAlign: data.contentAlign } : {}),
        ...(data.subjectFontSize ? { subjectFontSize: data.subjectFontSize } : {}),
        ...(data.subjectIsBold !== undefined ? { subjectIsBold: data.subjectIsBold } : {}),
      };

      transaction.set(receiptRef, dbReceipt);
      
      return newReceiptNumber;
    });

    // Auto-sync customer name if provided
    if (data.receivedFrom) {
      syncCustomerFromReceipt(data.receivedFrom, data.building, data.apartmentNumber).catch(() => {});
    }
    
    return { id: receiptRef.id, receiptNumber };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `users/${userId}/receipts`);
  }
}

export async function getReceipts() {
  if (!auth.currentUser) throw new Error('Not authenticated');
  const userId = auth.currentUser.uid;
  
  try {
    const q = query(
      collection(db, `users/${userId}/receipts`),
      orderBy('receiptNumber', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Receipt[];
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `users/${userId}/receipts`);
    return [];
  }
}

export async function updateReceipt(id: string, data: Partial<Receipt>) {
  if (!auth.currentUser) throw new Error('Not authenticated');
  const userId = auth.currentUser.uid;
  
  try {
    const receiptRef = doc(db, `users/${userId}/receipts/${id}`);
    
    const dbReceipt: Record<string, any> = {
      ...(data.type ? { type: data.type } : {}),
      ...(data.date ? { date: data.date } : {}),
      ...(data.amountDinar !== undefined ? { amountDinar: data.amountDinar } : {}),
      ...(data.amountDollar !== undefined ? { amountDollar: data.amountDollar } : {}),
      ...(data.building !== undefined ? { building: data.building } : {}),
      ...(data.apartmentNumber !== undefined ? { apartmentNumber: data.apartmentNumber } : {}),
      ...(data.receivedFrom !== undefined ? { receivedFrom: data.receivedFrom } : {}),
      ...(data.amountText !== undefined ? { amountText: data.amountText } : {}),
      ...(data.forMonth !== undefined ? { forMonth: data.forMonth } : {}),
      ...(data.documentTo !== undefined ? { documentTo: data.documentTo } : {}),
      ...(data.subject !== undefined ? { subject: data.subject } : {}),
      ...(data.content !== undefined ? { content: data.content } : {}),
      ...(data.contentFontSize !== undefined ? { contentFontSize: data.contentFontSize } : {}),
      ...(data.contentIsBold !== undefined ? { contentIsBold: data.contentIsBold } : {}),
      ...(data.contentAlign !== undefined ? { contentAlign: data.contentAlign } : {}),
      ...(data.subjectFontSize !== undefined ? { subjectFontSize: data.subjectFontSize } : {}),
      ...(data.subjectIsBold !== undefined ? { subjectIsBold: data.subjectIsBold } : {}),
    };

    await updateDoc(receiptRef, dbReceipt);

    if (data.receivedFrom) {
      syncCustomerFromReceipt(data.receivedFrom, data.building, data.apartmentNumber).catch(() => {});
    }

    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${userId}/receipts/${id}`);
    return false;
  }
}

export async function deleteReceipt(id: string) {
  if (!auth.currentUser) throw new Error('Not authenticated');
  const userId = auth.currentUser.uid;
  
  try {
    const receiptRef = doc(db, `users/${userId}/receipts/${id}`);
    await deleteDoc(receiptRef);
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `users/${userId}/receipts/${id}`);
    return false;
  }
}


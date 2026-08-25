import { collection, doc, getDocs, query, orderBy, setDoc, updateDoc, deleteDoc, serverTimestamp, where } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from './firebase';
import { Customer } from '../types';

export async function getCustomers(): Promise<Customer[]> {
  if (!auth.currentUser) return [];
  const userId = auth.currentUser.uid;
  const path = `users/${userId}/customers`;

  try {
    const q = query(
      collection(db, path),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Customer[];
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return [];
  }
}

export async function createCustomer(data: {
  name: string;
  building?: string;
  apartmentNumber?: string;
  phone?: string;
  notes?: string;
}): Promise<Customer | null> {
  if (!auth.currentUser) throw new Error('Not authenticated');
  const userId = auth.currentUser.uid;
  const path = `users/${userId}/customers`;

  try {
    const customerRef = doc(collection(db, path));
    const customerData = {
      userId,
      name: data.name.trim(),
      createdAt: serverTimestamp(),
      ...(data.building ? { building: data.building.trim() } : {}),
      ...(data.apartmentNumber ? { apartmentNumber: data.apartmentNumber.trim() } : {}),
      ...(data.phone ? { phone: data.phone.trim() } : {}),
      ...(data.notes ? { notes: data.notes.trim() } : {}),
    };

    await setDoc(customerRef, customerData);

    return {
      id: customerRef.id,
      userId,
      name: data.name.trim(),
      building: data.building?.trim(),
      apartmentNumber: data.apartmentNumber?.trim(),
      phone: data.phone?.trim(),
      notes: data.notes?.trim(),
      createdAt: Date.now(),
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
    return null;
  }
}

export async function updateCustomer(id: string, data: Partial<Omit<Customer, 'id' | 'userId' | 'createdAt'>>): Promise<boolean> {
  if (!auth.currentUser) throw new Error('Not authenticated');
  const userId = auth.currentUser.uid;
  const path = `users/${userId}/customers/${id}`;

  try {
    const customerRef = doc(db, path);
    const updateData: Record<string, any> = {};

    if (data.name !== undefined) updateData.name = data.name.trim();
    if (data.building !== undefined) updateData.building = data.building.trim();
    if (data.apartmentNumber !== undefined) updateData.apartmentNumber = data.apartmentNumber.trim();
    if (data.phone !== undefined) updateData.phone = data.phone.trim();
    if (data.notes !== undefined) updateData.notes = data.notes.trim();

    await updateDoc(customerRef, updateData);
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
    return false;
  }
}

export async function deleteCustomer(id: string): Promise<boolean> {
  if (!auth.currentUser) throw new Error('Not authenticated');
  const userId = auth.currentUser.uid;
  const path = `users/${userId}/customers/${id}`;

  try {
    const customerRef = doc(db, path);
    await deleteDoc(customerRef);
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
    return false;
  }
}

/**
 * Helper to auto-save or update customer if name is provided in receipt creation
 */
export async function syncCustomerFromReceipt(
  name: string,
  building?: string,
  apartmentNumber?: string
): Promise<void> {
  const trimmedName = name?.trim();
  if (!trimmedName || !auth.currentUser) return;
  const userId = auth.currentUser.uid;

  try {
    const q = query(
      collection(db, `users/${userId}/customers`),
      where('name', '==', trimmedName)
    );
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      await createCustomer({
        name: trimmedName,
        building: building?.trim(),
        apartmentNumber: apartmentNumber?.trim(),
      });
    }
  } catch (e) {
    // Non-blocking background sync
    console.warn('Customer background sync warning:', e);
  }
}

"use client";

import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, Timestamp, addDoc, updateDoc, deleteDoc, doc, arrayUnion, arrayRemove, serverTimestamp } from "firebase/firestore";
import { db } from '@/lib/firebase';
import { toast } from 'react-hot-toast';

// Veri tipleri
interface RecurringExpense {
    id: string;
    name: string;
    amount: number;
    dueDate: number; // Ayın günü
    category: string;
    isActive: boolean;
    paidMonths?: string[]; // "YYYY-MM" formatında
    createdAt?: Timestamp;
}

// Para formatlama
const formatCurrency = (amount: number): string => {
  return amount.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' });
};

// Kategori seçenekleri (örnek)
const expenseCategories = ["Fatura", "Kira", "Abonelik", "Kredi/Borç", "Eğitim", "Sağlık", "Diğer"];

// Ayın günleri (1-31)
const daysOfMonth = Array.from({ length: 31 }, (_, i) => i + 1);

// Mevcut ayı "YYYY-MM" formatında alır
const getCurrentYearMonth = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    return `${year}-${month}`;
}

const RecurringExpensesManager = () => {
  const [expenses, setExpenses] = useState<RecurringExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  // Form state'leri
  const [name, setName] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [dueDate, setDueDate] = useState<number>(1); // Varsayılan 1
  const [category, setCategory] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  const currentMonthYear = getCurrentYearMonth();

  // Giderleri Firestore'dan çek
  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, "recurringExpenses"), orderBy("dueDate", "asc"), orderBy("name", "asc"));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const expensesData: RecurringExpense[] = [];
      querySnapshot.forEach((doc) => {
        expensesData.push({ id: doc.id, ...doc.data() } as RecurringExpense);
      });
      setExpenses(expensesData);
      setLoading(false);
    }, (error) => {
      console.error("Düzenli giderleri çekerken hata:", error);
      toast.error("Düzenli giderler yüklenirken bir hata oluştu.");
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Yeni Gider Ekleme
  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !amountStr.trim() || !category || !dueDate) {
      toast.error("Lütfen tüm zorunlu alanları doldurun.");
      return;
    }
    const amountNum = parseFloat(amountStr.replace(',', '.'));
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error("Geçerli bir miktar girin.");
      return;
    }

    setFormLoading(true);
    try {
      await addDoc(collection(db, "recurringExpenses"), {
        name: name.trim(),
        amount: amountNum,
        dueDate: dueDate,
        category: category,
        isActive: true, // Varsayılan olarak aktif
        paidMonths: [], // Başlangıçta boş dizi
        createdAt: serverTimestamp()
      });
      toast.success("Düzenli gider başarıyla eklendi!");
      // Formu temizle ve kapat
      setName('');
      setAmountStr('');
      setDueDate(1);
      setCategory('');
      setShowAddForm(false);
    } catch (err) {
      console.error("Düzenli gider eklenirken hata:", err);
      toast.error("Gider eklenirken bir hata oluştu.");
    } finally {
      setFormLoading(false);
    }
  };

  // Ödendi/Ödenmedi İşaretleme
  const handleTogglePaidStatus = async (expense: RecurringExpense) => {
      const expenseRef = doc(db, "recurringExpenses", expense.id);
      const isPaidThisMonth = expense.paidMonths?.includes(currentMonthYear);

      try {
          if (isPaidThisMonth) {
              // Ödenmişse, array'den çıkar
              await updateDoc(expenseRef, {
                  paidMonths: arrayRemove(currentMonthYear)
              });
              toast.success(`${expense.name} ödemesi geri alındı.`);
          } else {
              // Ödenmemişse, array'e ekle
              await updateDoc(expenseRef, {
                  paidMonths: arrayUnion(currentMonthYear)
              });
              toast.success(`${expense.name} ödendi olarak işaretlendi.`);
          }
      } catch (error) {
          console.error("Ödeme durumu güncellenirken hata:", error);
          toast.error("Ödeme durumu güncellenemedi.");
      }
  };

  // Gider Silme
  const handleDeleteExpense = async (id: string) => {
      if (!confirm("Bu düzenli gideri silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.")) {
          return;
      }
      try {
          await deleteDoc(doc(db, "recurringExpenses", id));
          toast.success("Düzenli gider silindi.");
      } catch (error) {
          console.error("Düzenli gider silinirken hata:", error);
          toast.error("Gider silinirken bir hata oluştu.");
      }
  };

  // Aktif/Pasif Durumunu Değiştirme
  const handleToggleActiveStatus = async (expense: RecurringExpense) => {
       const expenseRef = doc(db, "recurringExpenses", expense.id);
       try {
           await updateDoc(expenseRef, {
               isActive: !expense.isActive
           });
           toast.success(`${expense.name} durumu güncellendi.`);
       } catch (error) {
           console.error("Aktif durumu güncellenirken hata:", error);
           toast.error("Aktif durumu güncellenemedi.");
       }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold text-secondary-foreground">Düzenli Giderler</h3>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 text-sm font-medium rounded-md bg-muted text-muted-foreground hover:bg-secondary transition-colors"
        >
          {showAddForm ? 'Formu Kapat' : 'Yeni Düzenli Gider Ekle'}
        </button>
      </div>

      {/* Yeni Gider Ekleme Formu */}
      {showAddForm && (
        <form onSubmit={handleAddExpense} className="p-4 border border-muted rounded-lg bg-secondary shadow-sm space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* İsim */}
            <div>
              <label htmlFor="expenseName" className="block text-xs font-medium text-secondary-foreground mb-1">Gider Adı <span className="text-destructive">*</span></label>
              <input id="expenseName" type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full p-2 text-sm bg-muted border border-muted rounded text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition" required />
            </div>
            {/* Miktar */}
            <div>
              <label htmlFor="expenseAmount" className="block text-xs font-medium text-secondary-foreground mb-1">Aylık Miktar <span className="text-destructive">*</span></label>
              <input id="expenseAmount" type="text" inputMode='decimal' value={amountStr} onChange={(e) => setAmountStr(e.target.value)} placeholder='Örn: 350.00' className="w-full p-2 text-sm bg-muted border border-muted rounded text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition" required />
            </div>
            {/* Ödeme Günü */}
             <div>
              <label htmlFor="expenseDueDate" className="block text-xs font-medium text-secondary-foreground mb-1">Ödeme Günü (Ayın) <span className="text-destructive">*</span></label>
              <select id="expenseDueDate" value={dueDate} onChange={(e) => setDueDate(parseInt(e.target.value))} className="w-full p-2 text-sm bg-muted border border-muted rounded text-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition appearance-none" required>
                  {daysOfMonth.map(day => <option key={day} value={day}>{day}</option>)}
              </select>
            </div>
            {/* Kategori */}
            <div>
              <label htmlFor="expenseCategory" className="block text-xs font-medium text-secondary-foreground mb-1">Kategori <span className="text-destructive">*</span></label>
              <select id="expenseCategory" value={category} onChange={(e) => setCategory(e.target.value)} className="w-full p-2 text-sm bg-muted border border-muted rounded text-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition appearance-none" required>
                 <option value="">Seçiniz...</option>
                 {expenseCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
          </div>
          <div className="text-right">
            <button type="submit" disabled={formLoading} className="px-4 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
              {formLoading ? 'Ekleniyor...' : 'Gideri Ekle'}
            </button>
          </div>
        </form>
      )}

      {/* Gider Listesi */}
      {loading && <div className="text-center p-4 text-muted-foreground">Yükleniyor...</div>}
      {!loading && expenses.length === 0 && <div className="p-4 text-center text-muted-foreground border border-dashed border-muted rounded-md">Henüz düzenli gider tanımlanmamış.</div>}
      {!loading && expenses.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-muted bg-secondary rounded-lg shadow-sm border border-muted">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider w-1/12">Aktif</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-4/12">Gider</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-2/12">Kategori</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider w-2/12">Miktar</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider w-1/12">Gün</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider w-1/12">Bu Ay Ödendi</th>
                 <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider w-1/12">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-muted">
              {expenses.map((expense) => {
                 const isPaidThisMonth = expense.paidMonths?.includes(currentMonthYear);
                 return (
                      <tr key={expense.id} className={`hover:bg-muted ${!expense.isActive ? 'opacity-60' : ''}`}>
                        <td className="px-4 py-3 whitespace-nowrap text-center">
                             <button onClick={() => handleToggleActiveStatus(expense)} title={expense.isActive ? 'Pasif Yap' : 'Aktif Yap'} className={`p-1.5 rounded-md text-xs ${expense.isActive ? 'bg-success/20 text-success hover:bg-success/30' : 'bg-muted text-muted-foreground hover:bg-secondary'}`}>
                                {expense.isActive ? 'Aktif' : 'Pasif'}
                             </button>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-foreground">{expense.name}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-muted-foreground">{expense.category}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-destructive text-right font-medium">{formatCurrency(expense.amount)}</td>
                         <td className="px-4 py-3 whitespace-nowrap text-sm text-muted-foreground text-center">{expense.dueDate}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-center">
                          <button
                              onClick={() => handleTogglePaidStatus(expense)}
                              title={isPaidThisMonth ? 'Ödemeyi Geri Al' : 'Ödendi İşaretle'}
                              className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${isPaidThisMonth ? 'bg-success text-white hover:bg-success/80' : 'bg-muted text-muted-foreground hover:bg-secondary'}`}
                          >
                             {isPaidThisMonth ? 'Ödendi' : 'Öde'}
                           </button>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                          <button onClick={() => handleDeleteExpense(expense.id)} className="text-destructive hover:text-destructive/80 transition-colors" aria-label="Gideri sil">
                             Sil
                          </button>
                        </td>
                      </tr>
                 );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default RecurringExpensesManager; 
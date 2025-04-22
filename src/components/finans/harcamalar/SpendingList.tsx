"use client";

import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, Timestamp, deleteDoc, doc } from "firebase/firestore";
import { db } from '@/lib/firebase';
import { toast } from 'react-hot-toast';

// Firestore'dan gelen veri tipi
interface SpendingEntry {
    id: string;
    item: string;
    amount: number;
    category: string;
    date: Timestamp;
    notes?: string;
    createdAt: Timestamp;
}

// Tarih formatlama
const formatSpendingDate = (timestamp: Timestamp): string => {
    if (!timestamp) return '-';
    return timestamp.toDate().toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' });
}

// Para formatlama
const formatCurrency = (amount: number): string => {
  return amount.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' });
};

const SpendingList = () => {
  const [spendings, setSpendings] = useState<SpendingEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Tarihe göre azalan sıralama (en yeni en üstte)
    const q = query(collection(db, "spendingEntries"), orderBy("date", "desc"), orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const spendingsData: SpendingEntry[] = [];
      querySnapshot.forEach((doc) => {
        spendingsData.push({ id: doc.id, ...doc.data() } as SpendingEntry);
      });
      setSpendings(spendingsData);
      setLoading(false);
    }, (error) => {
      console.error("Harcama verilerini çekerken hata:", error);
      toast.error("Harcamalar yüklenirken bir hata oluştu.");
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleDelete = async (id: string) => {
      if (!confirm("Bu harcama kaydını silmek istediğinizden emin misiniz?")) {
          return;
      }
      try {
          await deleteDoc(doc(db, "spendingEntries", id));
          toast.success("Harcama kaydı başarıyla silindi.");
      } catch (error) {
          console.error("Harcama silinirken hata:", error);
          toast.error("Harcama silinirken bir hata oluştu.");
      }
  }

  if (loading) {
    return <div className="text-center p-4 text-muted-foreground">Harcamalar yükleniyor...</div>;
  }

  if (spendings.length === 0) {
    return <div className="p-4 text-center text-muted-foreground border border-dashed border-muted rounded-md">Henüz harcama kaydı eklenmemiş.</div>;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-secondary-foreground">Harcama Kayıtları</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-muted bg-secondary rounded-lg shadow-sm border border-muted">
          <thead className="bg-muted/50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Tarih</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Harcama</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Kategori</th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Miktar</th>
               <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Notlar</th>
              <th scope="col" className="relative px-6 py-3">
                <span className="sr-only">Sil</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-muted">
            {spendings.map((spending) => (
              <tr key={spending.id} className="hover:bg-muted">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{formatSpendingDate(spending.date)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">{spending.item}</td>
                 <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{spending.category}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-destructive text-right font-medium">{formatCurrency(spending.amount)}</td>
                <td className="px-6 py-4 text-sm text-muted-foreground max-w-xs truncate" title={spending.notes}>{spending.notes || '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => handleDelete(spending.id)}
                    className="text-destructive hover:text-destructive/80 transition-colors"
                    aria-label="Harcama kaydını sil"
                  >
                    Sil
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SpendingList; 
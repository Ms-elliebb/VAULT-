"use client";

import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, Timestamp, deleteDoc, doc } from "firebase/firestore";
import { db } from '@/lib/firebase';
import { toast } from 'react-hot-toast';

// Firestore'dan gelen veri tipi
interface IncomeEntry {
    id: string;
    source: string;
    date: Timestamp;
    amount: number;
    createdAt: Timestamp;
}

// Tarih formatlama
const formatIncomeDate = (timestamp: Timestamp): string => {
    if (!timestamp) return '-';
    return timestamp.toDate().toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' });
}

// Para formatlama
const formatCurrency = (amount: number): string => {
  return amount.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' }); // Para birimini TRY olarak ayarladım, değiştirebilirsiniz
};

const IncomeList = () => {
  const [incomes, setIncomes] = useState<IncomeEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Tarihe göre azalan sıralama (en yeni en üstte)
    const q = query(collection(db, "incomeEntries"), orderBy("date", "desc"));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const incomesData: IncomeEntry[] = [];
      querySnapshot.forEach((doc) => {
        incomesData.push({ id: doc.id, ...doc.data() } as IncomeEntry);
      });
      setIncomes(incomesData);
      setLoading(false);
    }, (error) => {
      console.error("Gelir verilerini çekerken hata:", error);
      toast.error("Gelirler yüklenirken bir hata oluştu.");
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleDelete = async (id: string) => {
      if (!confirm("Bu gelir kaydını silmek istediğinizden emin misiniz?")) {
          return;
      }
      try {
          await deleteDoc(doc(db, "incomeEntries", id));
          toast.success("Gelir kaydı başarıyla silindi.");
      } catch (error) {
          console.error("Gelir silinirken hata:", error);
          toast.error("Gelir silinirken bir hata oluştu.");
      }
  }

  if (loading) {
    return <div className="text-center p-4 text-muted-foreground">Gelirler yükleniyor...</div>;
  }

  if (incomes.length === 0) {
    return <div className="p-4 text-center text-muted-foreground border border-dashed border-muted rounded-md">Henüz gelir kaydı eklenmemiş.</div>;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-secondary-foreground">Gelir Kayıtları</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-muted bg-secondary rounded-lg shadow-sm border border-muted">
          <thead className="bg-muted/50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Tarih</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Kaynak</th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Miktar</th>
              <th scope="col" className="relative px-6 py-3">
                <span className="sr-only">Sil</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-muted">
            {incomes.map((income) => (
              <tr key={income.id} className="hover:bg-muted">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">{formatIncomeDate(income.date)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">{income.source}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-success text-right font-medium">{formatCurrency(income.amount)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => handleDelete(income.id)}
                    className="text-destructive hover:text-destructive/80 transition-colors"
                    aria-label="Gelir kaydını sil"
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

export default IncomeList; 
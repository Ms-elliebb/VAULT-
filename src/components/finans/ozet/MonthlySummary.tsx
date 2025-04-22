"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { collection, query, where, getDocs, Timestamp, orderBy } from "firebase/firestore";
import { db } from '@/lib/firebase';

// Veri tipleri (Diğer bileşenlerden kopyalanabilir veya import edilebilir)
interface IncomeEntry { id: string; date: Timestamp; amount: number; /* ...diğer alanlar */ }
interface SpendingEntry { id: string; date: Timestamp; amount: number; category: string; /* ...diğer alanlar */ }
interface RecurringExpense { id: string; amount: number; category: string; isActive: boolean; paidMonths?: string[]; /* ...diğer alanlar */ }

// Özet verisi tipi
interface SummaryData {
    totalIncome: number;
    totalSpending: number;
    netBalance: number;
    spendingByCategory: { [category: string]: number };
}

// Para formatlama
const formatCurrency = (amount: number): string => {
  return amount.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' });
};

// Mevcut ayı "YYYY-MM" formatında alır
const getCurrentYearMonth = (): string => {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    return `${year}-${month}`;
}

const MonthlySummary = () => {
  const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentYearMonth());
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAndCalculateSummary = async () => {
      if (!selectedMonth) return;

      setLoading(true);
      setError(null);
      setSummaryData(null);

      try {
        const [year, month] = selectedMonth.split('-').map(Number);

        // Ayın başlangıç ve bitiş Timestamp'larını oluştur
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59, 999); // Ayın son günü, gün sonu
        const startTimestamp = Timestamp.fromDate(startDate);
        const endTimestamp = Timestamp.fromDate(endDate);

        // 1. Gelirleri Çek
        const incomeQuery = query(
          collection(db, "incomeEntries"),
          where("date", ">=", startTimestamp),
          where("date", "<=", endTimestamp)
        );
        const incomeSnapshot = await getDocs(incomeQuery);
        let totalIncome = 0;
        incomeSnapshot.forEach(doc => {
            totalIncome += doc.data().amount;
        });

        // 2. Anlık Harcamaları Çek
        const spendingQuery = query(
          collection(db, "spendingEntries"),
          where("date", ">=", startTimestamp),
          where("date", "<=", endTimestamp)
        );
        const spendingSnapshot = await getDocs(spendingQuery);
        const spendingByCategory: { [category: string]: number } = {};
        let totalInstantSpending = 0;
        spendingSnapshot.forEach(doc => {
            const data = doc.data() as SpendingEntry;
            totalInstantSpending += data.amount;
            spendingByCategory[data.category] = (spendingByCategory[data.category] || 0) + data.amount;
        });

        // 3. Düzenli Giderleri Çek (Aktif olanları) ve Ödenenleri Hesapla
        const recurringQuery = query(
            collection(db, "recurringExpenses"),
            where("isActive", "==", true) // Sadece aktif olanları al
        );
        const recurringSnapshot = await getDocs(recurringQuery);
        let totalPaidRecurringSpending = 0;
        recurringSnapshot.forEach(doc => {
            const data = doc.data() as RecurringExpense;
            // Seçilen ay için ödenmiş mi kontrol et
            if (data.paidMonths?.includes(selectedMonth)) {
                totalPaidRecurringSpending += data.amount;
                 spendingByCategory[data.category] = (spendingByCategory[data.category] || 0) + data.amount;
            }
        });

        // 4. Toplam Harcamayı ve Net Bakiyeyi Hesapla
        const totalSpending = totalInstantSpending + totalPaidRecurringSpending;
        const netBalance = totalIncome - totalSpending;

        setSummaryData({
            totalIncome,
            totalSpending,
            netBalance,
            spendingByCategory
        });

      } catch (err) {
        console.error("Aylık özet hesaplanırken hata:", err);
        setError("Özet verileri yüklenirken bir hata oluştu.");
      } finally {
        setLoading(false);
      }
    };

    fetchAndCalculateSummary();
  }, [selectedMonth]); // Seçilen ay değiştiğinde tekrar hesapla

  // Kategori harcamalarını yüzdelik dilimlerle sırala (opsiyonel)
  const sortedCategories = useMemo(() => {
      if (!summaryData?.spendingByCategory) return [];
      return Object.entries(summaryData.spendingByCategory)
            .map(([category, amount]) => ({
                category,
                amount,
                percentage: summaryData.totalSpending > 0 ? (amount / summaryData.totalSpending) * 100 : 0
            }))
            .sort((a, b) => b.amount - a.amount); // Miktara göre büyükten küçüğe sırala
  }, [summaryData]);

  return (
    <div className="p-6 rounded-lg bg-white/20 backdrop-blur-lg text-white">
      <h2 className="text-2xl font-semibold mb-5 text-white">Aylık Özet</h2>

      {/* Ay Seçici */}
      <div className="mb-6">
        <label htmlFor="summaryMonth" className="block text-sm font-medium text-secondary-foreground mb-1">
          Özet Ayı
        </label>
        <input
          id="summaryMonth"
          type="month"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="p-2 bg-muted border border-muted rounded text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition appearance-none"
          max={getCurrentYearMonth()}
        />
      </div>

      {/* Özet Bilgileri */}
      {loading && <div className="text-center py-4 text-muted-foreground">Özet hesaplanıyor...</div>}
      {error && <div className="text-center py-4 text-destructive bg-destructive/10 rounded p-2">{error}</div>}
      {summaryData && !loading && (
        <div className="space-y-6">
           {/* Ana Finansal Durum */}
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div className="p-4 border border-muted rounded-lg">
                 <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Toplam Gelir</p>
                 <p className="text-2xl font-bold text-success mt-1">{formatCurrency(summaryData.totalIncome)}</p>
              </div>
               <div className="p-4 border border-muted rounded-lg">
                 <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Toplam Harcama</p>
                 <p className="text-2xl font-bold text-destructive mt-1">{formatCurrency(summaryData.totalSpending)}</p>
              </div>
               <div className={`p-4 border border-muted rounded-lg`}>
                 <p className={`text-sm font-medium text-muted-foreground uppercase tracking-wide`}>Net Bakiye</p>
                 <p className={`text-2xl font-bold mt-1 ${summaryData.netBalance >= 0 ? 'text-success' : 'text-destructive'}`}>{formatCurrency(summaryData.netBalance)}</p>
              </div>
           </div>

           {/* Harcama Kategorileri Dağılımı */}
           <div>
             <h4 className="text-lg font-semibold mb-3 text-secondary-foreground">Harcama Dağılımı</h4>
              {sortedCategories.length > 0 ? (
                 <ul className="space-y-2">
                    {sortedCategories.map(({ category, amount, percentage }) => (
                        <li key={category} className="flex justify-between items-center text-sm p-2 bg-muted/50 rounded">
                           <span className="text-muted-foreground">{category}</span>
                            <span className="font-medium text-foreground">{formatCurrency(amount)}
                              <span className="text-xs text-muted-foreground ml-2">({percentage.toFixed(1)}%)</span>
                            </span>
                        </li>
                    ))}
                 </ul>
              ) : (
                  <p className="text-sm text-muted-foreground">Bu ay için harcama kaydı bulunamadı.</p>
              )}
           </div>
        </div>
      )}
    </div>
  );
};

export default MonthlySummary; 
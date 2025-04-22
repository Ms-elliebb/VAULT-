"use client";

import React, { useState } from 'react';
import { collection, addDoc, serverTimestamp, Timestamp } from "firebase/firestore";
import { db } from '@/lib/firebase';
import { toast } from 'react-hot-toast';

// Günün tarihini YYYY-MM-DD formatında alır
const getTodayDateString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const day = today.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
}

const AddIncomeForm = () => {
  const [source, setSource] = useState('');
  const [dateStr, setDateStr] = useState(getTodayDateString());
  const [amountStr, setAmountStr] = useState(''); // String olarak alıp parse edeceğiz
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!source.trim() || !dateStr || !amountStr.trim()) {
      toast.error("Lütfen kaynak, tarih ve miktar alanlarını doldurun.");
      return;
    }

    // Miktarı sayıya çevir ve doğrula
    const amountNum = parseFloat(amountStr.replace(',', '.')); // Virgülü noktaya çevir
    if (isNaN(amountNum) || amountNum <= 0) {
        toast.error("Geçerli bir miktar girin.");
        return;
    }

    setLoading(true);

    try {
        // Tarih string'ini Date objesine çevir (saat bilgisi olmadan)
        const dateParts = dateStr.split('-');
        const incomeDate = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));

        if (isNaN(incomeDate.getTime())) {
            throw new Error("Geçersiz tarih formatı.");
        }
        const incomeTimestamp = Timestamp.fromDate(incomeDate);

        await addDoc(collection(db, "incomeEntries"), {
            source: source.trim(),
            date: incomeTimestamp,
            amount: amountNum,
            createdAt: serverTimestamp()
        });

        setSource('');
        // setDateStr(getTodayDateString()); // Tarihi sıfırlama/bugüne döndürme isteğe bağlı
        setAmountStr('');
        toast.success("Gelir başarıyla kaydedildi!");
    } catch (err: any) {
        console.error("Firestore'a yazma hatası (Gelir):", err);
         if (err.message.includes("Geçersiz tarih")) {
            toast.error("Lütfen geçerli bir tarih girin.");
        } else {
            toast.error("Gelir kaydedilirken bir hata oluştu.");
        }
    } finally {
        setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mb-8 p-6 rounded-lg bg-white/20 backdrop-blur-lg text-white">
      <h3 className="text-xl font-semibold mb-4 text-white">Yeni Gelir Ekle</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 items-end">

        {/* Kaynak */}
        <div>
          <label htmlFor="incomeSource" className="block text-sm font-medium text-secondary-foreground mb-1">
            Kaynak <span className="text-destructive">*</span>
          </label>
          <input
            id="incomeSource"
            type="text"
            value={source}
            onChange={(e) => setSource(e.target.value)}
            placeholder="Örn: Maaş, Freelance Proje"
            className="w-full p-2 bg-muted border border-muted rounded text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition"
            disabled={loading}
            required
          />
        </div>

        {/* Tarih */}
        <div>
           <label htmlFor="incomeDate" className="block text-sm font-medium text-secondary-foreground mb-1">
                Tarih <span className="text-destructive">*</span>
            </label>
            <input
                id="incomeDate"
                type="date"
                value={dateStr}
                onChange={(e) => setDateStr(e.target.value)}
                className="w-full p-2 bg-muted border border-muted rounded text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition appearance-none"
                disabled={loading}
                required
            />
        </div>

        {/* Miktar */}
        <div>
          <label htmlFor="incomeAmount" className="block text-sm font-medium text-secondary-foreground mb-1">
            Miktar <span className="text-destructive">*</span>
          </label>
          <input
            id="incomeAmount"
            type="text" // Virgüllü girişe izin vermek için text
            inputMode="decimal" // Mobil klavyeyi sayısal yapar
            value={amountStr}
            onChange={(e) => setAmountStr(e.target.value)}
            placeholder="Örn: 1500.50"
            className="w-full p-2 bg-muted border border-muted rounded text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition"
            disabled={loading}
            required
          />
        </div>
      </div>

      {/* Submit Button */}
      <div className="text-right">
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#F72585] hover:bg-[#E01B74] text-white font-semibold text-lg py-4 px-8 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#F72585] focus:ring-offset-white/20 disabled:opacity-70 disabled:cursor-not-allowed transition duration-150 ease-in-out"
        >
          {loading ? 'Kaydediliyor...' : 'Geliri Kaydet'}
        </button>
      </div>
    </form>
  );
};

export default AddIncomeForm; 
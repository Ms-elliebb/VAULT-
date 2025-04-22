"use client";

import React, { useState } from 'react';
import { collection, addDoc, serverTimestamp, Timestamp } from "firebase/firestore";
import { db } from '@/lib/firebase';
import { toast } from 'react-hot-toast';

// Harcama kategorileri (örnek, genişletilebilir)
const spendingCategories = ["Gıda", "Ulaşım", "Fatura", "Kira", "Sağlık", "Giyim", "Eğlence", "Keyfi", "Eğitim", "Ev Eşyası", "Kişisel Bakım", "Diğer"];

// Günün tarihini YYYY-MM-DD formatında alır
const getTodayDateString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const day = today.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
}

const AddSpendingForm = () => {
  const [item, setItem] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [category, setCategory] = useState('');
  const [dateStr, setDateStr] = useState(getTodayDateString());
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!item.trim() || !amountStr.trim() || !category || !dateStr) {
      toast.error("Lütfen harcama, miktar, kategori ve tarih alanlarını doldurun.");
      return;
    }

    const amountNum = parseFloat(amountStr.replace(',', '.'));
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error("Geçerli bir miktar girin.");
      return;
    }

    setLoading(true);

    try {
        const dateParts = dateStr.split('-');
        const spendingDate = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));
        if (isNaN(spendingDate.getTime())) {
            throw new Error("Geçersiz tarih formatı.");
        }
        const spendingTimestamp = Timestamp.fromDate(spendingDate);

        const dataToSave: any = {
            item: item.trim(),
            amount: amountNum,
            category: category,
            date: spendingTimestamp,
            createdAt: serverTimestamp()
        };
        if (notes.trim()) {
            dataToSave.notes = notes.trim();
        }

        await addDoc(collection(db, "spendingEntries"), dataToSave);

        setItem('');
        setAmountStr('');
        setCategory('');
        // setDateStr(getTodayDateString()); // Tarih sıfırlansın mı?
        setNotes('');
        toast.success("Harcama başarıyla kaydedildi!");
    } catch (err: any) {
        console.error("Firestore'a yazma hatası (Harcama):", err);
        if (err.message.includes("Geçersiz tarih")) {
           toast.error("Lütfen geçerli bir tarih girin.");
        } else {
           toast.error("Harcama kaydedilirken bir hata oluştu.");
        }
    } finally {
        setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mb-8 p-6 rounded-lg bg-white/20 backdrop-blur-lg text-white">
      <h3 className="text-xl font-semibold mb-4 text-white">Yeni Harcama Ekle</h3>
      {/* Üst Satır: Ne, Miktar, Kategori, Tarih */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-4 items-end">
        {/* Ne Aldın? */}
        <div>
          <label htmlFor="spendingItem" className="block text-sm font-medium text-secondary-foreground mb-1">
            Ne Aldın/Harcadın? <span className="text-destructive">*</span>
          </label>
          <input id="spendingItem" type="text" value={item} onChange={(e) => setItem(e.target.value)} placeholder="Örn: Kahve, Otobüs Bileti" className="w-full p-2 bg-muted border border-muted rounded text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition" disabled={loading} required />
        </div>

        {/* Miktar */}
        <div>
          <label htmlFor="spendingAmount" className="block text-sm font-medium text-secondary-foreground mb-1">
            Miktar <span className="text-destructive">*</span>
          </label>
          <input id="spendingAmount" type="text" inputMode="decimal" value={amountStr} onChange={(e) => setAmountStr(e.target.value)} placeholder="Örn: 25.50" className="w-full p-2 bg-muted border border-muted rounded text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition" disabled={loading} required />
        </div>

        {/* Kategori */}
        <div>
          <label htmlFor="spendingCategory" className="block text-sm font-medium text-secondary-foreground mb-1">
            Kategori <span className="text-destructive">*</span>
          </label>
          <select id="spendingCategory" value={category} onChange={(e) => setCategory(e.target.value)} className="w-full p-2 bg-muted border border-muted rounded text-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent appearance-none transition" disabled={loading} required>
            <option value="" className="text-muted-foreground">Seçiniz...</option>
            {spendingCategories.map(cat => (
              <option key={cat} value={cat} className="text-foreground">{cat}</option>
            ))}
          </select>
        </div>

        {/* Tarih */}
        <div>
           <label htmlFor="spendingDate" className="block text-sm font-medium text-secondary-foreground mb-1">
                Tarih <span className="text-destructive">*</span>
            </label>
            <input id="spendingDate" type="date" value={dateStr} onChange={(e) => setDateStr(e.target.value)} className="w-full p-2 bg-muted border border-muted rounded text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition appearance-none" disabled={loading} required/>
        </div>
      </div>

      {/* Alt Satır: Notlar */}
      <div className="mb-4">
        <label htmlFor="spendingNotes" className="block text-sm font-medium text-secondary-foreground mb-1">
          Notlar/Neden? (Opsiyonel)
        </label>
        <textarea id="spendingNotes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="w-full p-2 bg-muted border border-muted rounded text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition resize-y" placeholder="Bu harcama neden yapıldı?" disabled={loading} />
      </div>

      {/* Submit Button */}
      <div className="text-right">
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#F72585] hover:bg-[#E01B74] text-white font-semibold text-lg py-4 px-8 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#F72585] focus:ring-offset-white/20 disabled:opacity-70 disabled:cursor-not-allowed transition duration-150 ease-in-out"
        >
          {loading ? 'Kaydediliyor...' : 'Harcamayı Kaydet'}
        </button>
      </div>
    </form>
  );
};

export default AddSpendingForm; 
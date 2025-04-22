"use client";

import React, { useState } from 'react';
import { collection, addDoc, serverTimestamp, Timestamp } from "firebase/firestore";
import { db } from '@/lib/firebase';
import { toast } from 'react-hot-toast';

const AddEntryForm = () => {
  const [entryTime, setEntryTime] = useState(''); // Saat için (HH:MM formatında)
  const [foodDescription, setFoodDescription] = useState(''); // Ne yedin?
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!entryTime || !foodDescription.trim()) {
      toast.error("Lütfen saat ve ne yediğinizi girin.");
      return;
    }

    setLoading(true);

    try {
        // Saati (HH:MM) alıp bugünün tarihiyle birleştirerek Timestamp oluştur
        const now = new Date();
        const [hours, minutes] = entryTime.split(':').map(Number);
        const entryDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes);
        const entryTimestamp = Timestamp.fromDate(entryDate);

        await addDoc(collection(db, "foodDiaryEntries"), {
            entryTime: entryTimestamp, // Seçilen saat ve bugünün tarihi
            foodDescription: foodDescription,
            createdAt: serverTimestamp() // Kayıt oluşturma zamanı
        });

        setEntryTime('');
        setFoodDescription('');
        toast.success("Yemek günlüğü kaydı eklendi!");
        // Burada listeyi yenilemek için bir callback veya state yönetimi gerekebilir
    } catch (err) {
        console.error("Firestore'a yazma hatası (Yemek Günlüğü):", err);
        toast.error("Kayıt eklenirken bir hata oluştu.");
    } finally {
        setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mb-8 p-6 rounded-lg bg-white/20 backdrop-blur-lg text-white">
      <h2 className="text-2xl font-semibold mb-5 text-white">Yeni Yemek Kaydı Ekle</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 items-end">
        {/* Saat */}
        <div>
          <label htmlFor="entryTime" className="block text-sm font-medium text-white/80 mb-1">
            🕐 Saat <span className="text-red-400">*</span>
          </label>
          <input
            id="entryTime"
            type="time"
            value={entryTime}
            onChange={(e) => setEntryTime(e.target.value)}
            className="w-full p-2 bg-black/20 border border-white/30 rounded text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition appearance-none"
            disabled={loading}
            required
          />
        </div>

        {/* Ne Yedin */}
        <div className="md:col-span-2">
          <label htmlFor="foodDescription" className="block text-sm font-medium text-white/80 mb-1">
            🍽️ Ne Yedin? <span className="text-red-400">*</span>
          </label>
          <textarea
            id="foodDescription"
            value={foodDescription}
            onChange={(e) => setFoodDescription(e.target.value)}
            rows={2} // Biraz daha az yer kaplasın
            className="w-full p-2 bg-black/20 border border-white/30 rounded text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition resize-none"
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
          {loading ? 'Ekleniyor...' : 'Kaydet'}
        </button>
      </div>
    </form>
  );
};

export default AddEntryForm; 
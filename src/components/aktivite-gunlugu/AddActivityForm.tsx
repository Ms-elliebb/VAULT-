"use client";

import React, { useState } from 'react';
import { collection, addDoc, serverTimestamp, Timestamp } from "firebase/firestore";
import { db } from '@/lib/firebase';
import { toast } from 'react-hot-toast';

const activityOptions = ["Yürüyüş", "Koşu", "Bisiklet", "Egzersiz (Genel)", "Yoga", "Dans", "Temizlik", "Bahçe İşi", "Diğer"];

// Günün tarihini YYYY-MM-DD formatında alır (state başlangıç değeri için)
const getTodayDateString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const day = today.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
}

const AddActivityForm = () => {
  const [activityType, setActivityType] = useState('');
  const [activityDateStr, setActivityDateStr] = useState(getTodayDateString()); // Tarih state'i eklendi
  const [activityTime, setActivityTime] = useState(''); // HH:MM formatında
  const [durationMinutes, setDurationMinutes] = useState(''); // Dakika cinsinden
  const [description, setDescription] = useState(''); // Açıklama state'i eklendi
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Tarih alanı kontrolü eklendi
    if (!activityType || !activityDateStr || !activityTime || !durationMinutes) {
      toast.error("Lütfen tüm alanları doldurun.");
      return;
    }

    const durationNum = parseInt(durationMinutes, 10);
    if (isNaN(durationNum) || durationNum <= 0) {
        toast.error("Geçerli bir süre (dakika) girin.");
        return;
    }

    setLoading(true);

    try {
        // Tarih (YYYY-MM-DD) ve Saat (HH:MM) string'lerini birleştirip Date objesi oluştur
        const dateTimeString = `${activityDateStr}T${activityTime}:00`; // ISO benzeri format
        const activityDate = new Date(dateTimeString);

        // Geçersiz tarih/saat kontrolü
        if (isNaN(activityDate.getTime())) {
            throw new Error("Geçersiz tarih veya saat formatı.");
        }

        const activityTimestamp = Timestamp.fromDate(activityDate);

        // Firestore'a gönderilecek veriye açıklama eklendi (boş değilse)
        const dataToSave: any = {
            activityType: activityType,
            activityTime: activityTimestamp, // Seçilen tarih ve saat
            durationMinutes: durationNum,
            createdAt: serverTimestamp()
        };
        if (description.trim()) {
            dataToSave.description = description.trim();
        }

        await addDoc(collection(db, "activityEntries"), dataToSave);

        // State'leri sıfırla (tarih hariç, belki aynı gün başka aktivite girer)
        setActivityType('');
        // setActivityDateStr(getTodayDateString()); // Veya tarihi de sıfırla/bugüne döndür
        setActivityTime('');
        setDurationMinutes('');
        setDescription(''); // Açıklamayı da sıfırla
        toast.success("Aktivite başarıyla kaydedildi!");
    } catch (err: any) { // Hata tipini any olarak belirtelim veya daha spesifik yapalım
        console.error("Firestore'a yazma hatası veya tarih/saat hatası:", err);
        // Kullanıcıya daha anlaşılır hata mesajı göster
        if (err.message.includes("Geçersiz tarih veya saat")) {
            toast.error("Lütfen geçerli bir tarih ve saat girin.");
        } else {
            toast.error("Aktivite kaydedilirken bir hata oluştu.");
        }
    } finally {
        setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mb-8 p-6 rounded-lg bg-white/20 backdrop-blur-lg text-white">
      <h2 className="text-2xl font-semibold mb-5 text-white">Yeni Aktivite Kaydı Ekle</h2>
      {/* Grid yapısı 4 sütuna çıkarıldı veya düzenlenecek */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-4 items-end">

        {/* Aktivite Türü */}
        <div className="md:col-span-1"> {/* Genişlik ayarı */}
          <label htmlFor="activityType" className="block text-sm font-medium text-white/80 mb-1">
            Aktivite Türü <span className="text-red-400">*</span>
          </label>
          <select
            id="activityType"
            value={activityType}
            onChange={(e) => setActivityType(e.target.value)}
            className="w-full p-2 bg-black/20 border border-white/30 rounded text-white focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent appearance-none transition"
            disabled={loading}
            required
          >
            <option value="" className="bg-gray-800 text-gray-300">Seçiniz...</option>
            {activityOptions.map(option => (
              <option key={option} value={option} className="bg-gray-800 text-white">{option}</option>
            ))}
          </select>
        </div>

        {/* Tarih */}
        <div className="md:col-span-1">
           <label htmlFor="activityDate" className="block text-sm font-medium text-white/80 mb-1">
                Tarih <span className="text-red-400">*</span>
            </label>
            <input
                id="activityDate"
                type="date"
                value={activityDateStr}
                onChange={(e) => setActivityDateStr(e.target.value)}
                className="w-full p-2 bg-black/20 border border-white/30 rounded text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition appearance-none"
                disabled={loading}
                required
            />
        </div>

        {/* Saat */}
        <div className="md:col-span-1">
          <label htmlFor="activityTime" className="block text-sm font-medium text-white/80 mb-1">
            Saat <span className="text-red-400">*</span>
          </label>
          <input
            id="activityTime"
            type="time"
            value={activityTime}
            onChange={(e) => setActivityTime(e.target.value)}
            className="w-full p-2 bg-black/20 border border-white/30 rounded text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition appearance-none"
            disabled={loading}
            required
          />
        </div>

        {/* Süre (Dakika) */}
        <div className="md:col-span-1">
          <label htmlFor="durationMinutes" className="block text-sm font-medium text-white/80 mb-1">
            Süre (Dakika) <span className="text-red-400">*</span>
          </label>
          <input
            id="durationMinutes"
            type="number"
            value={durationMinutes}
            onChange={(e) => setDurationMinutes(e.target.value)}
            placeholder="Örn: 30"
            min="1"
            className="w-full p-2 bg-black/20 border border-white/30 rounded text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition"
            disabled={loading}
            required
          />
        </div>

        {/* Açıklama (Yeni Eklendi - Tüm genişlikte) */}
        <div className="md:col-span-4 mt-2">
          <label htmlFor="description" className="block text-sm font-medium text-white/80 mb-1">
            Açıklama (Opsiyonel)
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="Aktivite ile ilgili notlar..."
            className="w-full p-2 bg-black/20 border border-white/30 rounded text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition"
            disabled={loading}
          />
        </div>
      </div>

      {/* Submit Button */}
      <div className="text-right mt-6">
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#F72585] hover:bg-[#E01B74] text-white font-semibold text-lg py-4 px-8 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#F72585] focus:ring-offset-white/20 disabled:opacity-70 disabled:cursor-not-allowed transition duration-150 ease-in-out"
        >
          {loading ? 'Kaydediliyor...' : 'Aktiviteyi Kaydet'}
        </button>
      </div>
    </form>
  );
};

export default AddActivityForm; 
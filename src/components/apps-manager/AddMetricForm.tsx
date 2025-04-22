"use client";

import React, { useState } from 'react';
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { db } from '@/lib/firebase';
import { toast } from 'react-hot-toast';

interface AddMetricFormProps {
  appId: string;
}

const AddMetricForm: React.FC<AddMetricFormProps> = ({ appId }) => {
  const today = new Date().toISOString().split('T')[0]; // Bugünün tarihini YYYY-MM-DD formatında al
  const [metricDate, setMetricDate] = useState(today);
  const [userCount, setUserCount] = useState('');
  const [monthlyRevenue, setMonthlyRevenue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Tarihi kontrol et
    let metricTimestamp: Timestamp | null = null;
    if (metricDate) {
      try {
        const date = new Date(metricDate);
        if (isNaN(date.getTime())) throw new Error("Geçersiz tarih");
        metricTimestamp = Timestamp.fromDate(date);
      } catch (error) {
        toast.error("Lütfen geçerli bir tarih girin.");
        return;
      }
    } else {
      toast.error("Lütfen bir tarih girin.");
      return;
    }

    // Sayısal alanları parse et (boşsa veya geçersizse 0 yap)
    const userCountNum = parseInt(userCount, 10);
    const finalUserCount = !isNaN(userCountNum) && userCountNum >= 0 ? userCountNum : 0;

    const revenueNum = parseFloat(monthlyRevenue.replace(',', '.'));
    const finalRevenue = !isNaN(revenueNum) && revenueNum >= 0 ? revenueNum : 0;

    setIsSubmitting(true);

    try {
      const metricsCollectionRef = collection(db, 'apps', appId, 'metrics');
      await addDoc(metricsCollectionRef, {
        metricTimestamp: metricTimestamp,
        userCount: finalUserCount,
        monthlyRevenue: finalRevenue
      });

      // Formu temizle (tarihi bugünde bırakabiliriz)
      setUserCount('');
      setMonthlyRevenue('');
      // setMetricDate(today); // İsteğe bağlı: Tarihi sıfırla veya bugünde bırak
      toast.success('Metrik verisi başarıyla eklendi!');

    } catch (err) {
      console.error("Firestore yazma hatası (addMetric):", err);
      toast.error('Metrik verisi eklenirken bir hata oluştu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    /* Apply frosted glass: remove border, bg-background, shadow. Add bg-white/20, backdrop-blur-lg, text-white */
    <form onSubmit={handleSubmit} className="mb-8 p-6 rounded-lg bg-white/20 backdrop-blur-lg text-white">
      <h3 className="text-lg font-semibold mb-4 text-white">Yeni Metrik Verisi Ekle</h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 items-end">
        {/* Tarih */}
        <div>
          <label htmlFor="metricDate" className="block text-sm font-medium text-white/80 mb-1">
            Tarih <span className="text-red-400">*</span>
          </label>
          <input
            id="metricDate"
            type="date"
            value={metricDate}
            onChange={(e) => setMetricDate(e.target.value)}
            /* Adjust input style */
            className="w-full p-2 bg-black/20 border border-white/30 rounded text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition appearance-none"
            disabled={isSubmitting}
            required
          />
        </div>

        {/* Kullanıcı Sayısı */}
        <div>
          <label htmlFor="metricUserCount" className="block text-sm font-medium text-white/80 mb-1">
            Kullanıcı Sayısı
          </label>
          <input
            id="metricUserCount"
            type="number"
            value={userCount}
            onChange={(e) => setUserCount(e.target.value)}
            placeholder="0"
            min="0"
            /* Adjust input style */
            className="w-full p-2 bg-black/20 border border-white/30 rounded text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition"
            disabled={isSubmitting}
          />
        </div>

        {/* Aylık Kazanç */}
        <div>
          <label htmlFor="metricMonthlyRevenue" className="block text-sm font-medium text-white/80 mb-1">
            Aylık Kazanç
          </label>
          <input
            id="metricMonthlyRevenue"
            type="text"
            inputMode="decimal"
            value={monthlyRevenue}
            onChange={(e) => setMonthlyRevenue(e.target.value)}
            placeholder="0.00"
             /* Adjust input style */
            className="w-full p-2 bg-black/20 border border-white/30 rounded text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition"
            disabled={isSubmitting}
          />
        </div>
      </div>
        
      <button
        type="submit"
        disabled={isSubmitting}
         /* Apply new primary button style */
        className={`w-full sm:w-auto bg-[#F72585] hover:bg-[#E01B74] text-white font-semibold text-lg py-4 px-8 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#F72585] focus:ring-offset-white/20 disabled:opacity-70 disabled:cursor-not-allowed transition duration-150 ease-in-out ${
          isSubmitting ? 'opacity-70 cursor-not-allowed' : '' // Ensure disabled styles apply visually
        }`}
      >
        {isSubmitting ? 'Ekleniyor...' : 'Metriği Kaydet'}
      </button>
    </form>
  );
};

export default AddMetricForm; 
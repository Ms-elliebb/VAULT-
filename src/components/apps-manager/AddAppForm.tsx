"use client";

import React, { useState } from 'react';
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from '@/lib/firebase';
import { toast } from 'react-hot-toast';
import { Timestamp } from "firebase/firestore";

const statusOptions = ["Fikir", "Planlama", "Geliştiriliyor", "Test", "Yayınlandı", "Arşivlendi"];
const platformOptions = ["Web", "iOS", "Android", "Desktop", "Diğer"];

const AddAppForm = () => {
  const [appName, setAppName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [status, setStatus] = useState('');
  const [userCount, setUserCount] = useState('');
  const [monthlyRevenue, setMonthlyRevenue] = useState('');
  const [devStartDate, setDevStartDate] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePlatformChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = event.target;
    setSelectedPlatforms(prev =>
      checked ? [...prev, value] : prev.filter(platform => platform !== value)
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appName.trim()) {
      toast.error("Uygulama adı boş olamaz.");
      return;
    }

    const userCountNum = userCount ? parseInt(userCount, 10) : null;
    const monthlyRevenueNum = monthlyRevenue ? parseFloat(monthlyRevenue.replace(',', '.')) : null;

    if (userCount && (isNaN(userCountNum!) || userCountNum! < 0)) {
        toast.error("Geçersiz kullanıcı sayısı girdiniz.");
        return;
    }
    if (monthlyRevenue && (isNaN(monthlyRevenueNum!) || monthlyRevenueNum! < 0)) {
        toast.error("Geçersiz aylık kazanç girdiniz.");
        return;
    }

    let devStartDateTimestamp: Timestamp | null = null;
    if (devStartDate) {
      try {
        const [year, month] = devStartDate.split('-').map(Number);
        const date = new Date(year, month - 1, 1);
        if (isNaN(date.getTime())) throw new Error("Geçersiz tarih");
        devStartDateTimestamp = Timestamp.fromDate(date);
      } catch (error) {
        console.error("Başlangıç tarihi çevirme hatası:", error);
        toast.error("Geçersiz geliştirme başlangıç tarihi formatı.");
        return;
      }
    }

    setLoading(true);

    try {
      await addDoc(collection(db, "apps"), {
        name: appName,
        description: description,
        platform: selectedPlatforms,
        status: status || null,
        userCount: userCountNum,
        monthlyRevenue: monthlyRevenueNum,
        developmentStartDate: devStartDateTimestamp,
        createdAt: serverTimestamp()
      });
      setAppName('');
      setDescription('');
      setSelectedPlatforms([]);
      setStatus('');
      setUserCount('');
      setMonthlyRevenue('');
      setDevStartDate('');
      toast.success("Uygulama başarıyla eklendi!");
    } catch (err) {
      console.error("Firestore'a yazma hatası:", err);
      toast.error("Uygulama eklenirken bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mb-8 p-6 rounded-lg bg-white/20 backdrop-blur-lg text-white">
      <h2 className="text-2xl font-semibold mb-5 text-white">Yeni Uygulama Ekle</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* App Name */}
        <div>
          <label htmlFor="appName" className="block text-sm font-medium text-white mb-1">
            Uygulama Adı <span className="text-red-400">*</span>
          </label>
          <input
            id="appName"
            type="text"
            value={appName}
            onChange={(e) => setAppName(e.target.value)}
            className="w-full p-2 bg-black/20 border border-white/30 rounded text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition"
            disabled={loading}
            required
          />
        </div>

        {/* Status */}
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-white mb-1">
            Durum
          </label>
          <select
            id="status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full p-2 bg-black/20 border border-white/30 rounded text-white focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent appearance-none transition"
            disabled={loading}
          >
            <option value="" className="bg-gray-800 text-gray-300">Seçiniz...</option>
            {statusOptions.map(option => (
              <option key={option} value={option} className="bg-gray-800 text-white">{option}</option>
            ))}
          </select>
        </div>

        {/* Platform (Checkbox Grubu) */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-white mb-2">
            Platform (Bir veya daha fazla seçin)
          </label>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {platformOptions.map((platform) => (
              <label key={platform} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  value={platform}
                  checked={selectedPlatforms.includes(platform)}
                  onChange={handlePlatformChange}
                  disabled={loading}
                  className="rounded text-accent focus:ring-accent/70 h-4 w-4 border-white/50 bg-black/20"
                />
                <span className="text-sm text-white">{platform}</span>
              </label>
            ))}
          </div>
        </div>

        {/* User Count */}
        <div>
          <label htmlFor="userCount" className="block text-sm font-medium text-white mb-1">
            Kullanıcı Sayısı (Opsiyonel)
          </label>
          <input
            id="userCount"
            type="number"
            value={userCount}
            onChange={(e) => setUserCount(e.target.value)}
            placeholder="Örn: 1500"
            min="0"
            className="w-full p-2 bg-black/20 border border-white/30 rounded text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition"
            disabled={loading}
          />
        </div>

        {/* Monthly Revenue */}
        <div>
          <label htmlFor="monthlyRevenue" className="block text-sm font-medium text-white mb-1">
            Aylık Kazanç (Opsiyonel)
          </label>
          <input
            id="monthlyRevenue"
            type="text"
            inputMode="decimal"
            value={monthlyRevenue}
            onChange={(e) => setMonthlyRevenue(e.target.value)}
            placeholder="Örn: 499.90"
            className="w-full p-2 bg-black/20 border border-white/30 rounded text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition"
            disabled={loading}
          />
        </div>

        {/* Development Start Date */}
        <div>
          <label htmlFor="devStartDate" className="block text-sm font-medium text-white mb-1">
            Geliştirme Başlangıcı (Ay/Yıl - Opsiyonel)
          </label>
          <input
            id="devStartDate"
            type="month"
            value={devStartDate}
            onChange={(e) => setDevStartDate(e.target.value)}
            className="w-full p-2 bg-black/20 border border-white/30 rounded text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition appearance-none"
            disabled={loading}
          />
        </div>
      </div>

      {/* Description */}
      <div className="mb-6 md:col-span-2">
        <label htmlFor="description" className="block text-sm font-medium text-white mb-1">
          Açıklama
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full p-2 bg-black/20 border border-white/30 rounded text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition"
          disabled={loading}
        />
      </div>

      {/* Submit Button */}
      <div className="md:col-span-2">
        <button
          type="submit"
          className={`w-full bg-[#F72585] hover:bg-[#E01B74] text-white font-semibold text-lg py-4 px-8 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#F72585] focus:ring-offset-white/20 disabled:opacity-70 disabled:cursor-not-allowed transition duration-150 ease-in-out ${
             loading ? 'opacity-70 cursor-not-allowed' : '' // Ensure disabled styles apply visually
          }`}
          disabled={loading}
        >
          {loading ? 'Ekleniyor...' : 'Uygulamayı Ekle'}
        </button>
      </div>
    </form>
  );
};

export default AddAppForm; 
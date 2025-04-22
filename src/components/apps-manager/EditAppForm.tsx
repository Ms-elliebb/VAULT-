"use client";

import React, { useState, useEffect } from 'react';
import { doc, updateDoc, Timestamp } from "firebase/firestore";
import { db } from '@/lib/firebase';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// Yardımcı: Timestamp'ı YYYY-MM formatına çevir (null/undefined kontrolü ile)
const formatTimestampToInputMonth = (timestamp: Timestamp | null | undefined): string => {
    if (!timestamp) return '';
    const date = timestamp.toDate();
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    return `${year}-${month}`;
};

// Firestore'dan gelen veri tipi güncellendi
interface AppData {
  id: string;
  name: string;
  description?: string;
  platform?: string[];
  status?: string | null;
  userCount?: number | null;
  monthlyRevenue?: number | null;
  developmentStartDate?: Timestamp | null; // Yeni alan eklendi
}

interface EditAppFormProps {
  initialData: AppData;
}

const statusOptions = ["Fikir", "Planlama", "Geliştiriliyor", "Test", "Yayınlandı", "Arşivlendi"];
const platformOptions = ["Web", "iOS", "Android", "Desktop", "Diğer"];

const EditAppForm: React.FC<EditAppFormProps> = ({ initialData }) => {
  const router = useRouter();
  const [appName, setAppName] = useState(initialData.name || '');
  const [description, setDescription] = useState(initialData.description || '');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(initialData.platform || []);
  const [status, setStatus] = useState(initialData.status || '');
  const [userCount, setUserCount] = useState(initialData.userCount?.toString() || '');
  const [monthlyRevenue, setMonthlyRevenue] = useState(initialData.monthlyRevenue?.toString() || '');
  // Yeni state: Timestamp'tan string'e çevirerek başlat
  const [devStartDate, setDevStartDate] = useState<string>(formatTimestampToInputMonth(initialData.developmentStartDate));
  const [loading, setLoading] = useState(false);

  // Platform checkbox değişimini yöneten fonksiyon
  const handlePlatformChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = event.target;
    setSelectedPlatforms(prev =>
      checked ? [...prev, value] : prev.filter(platform => platform !== value)
    );
  };

  // Formu güncelleme fonksiyonu güncellendi
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appName.trim()) {
      toast.error("Uygulama adı boş olamaz.");
      return;
    }

    // Sayısal alanları parse et ve doğrula
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

    // Geliştirme başlangıç tarihini parse et
    let devStartDateTimestamp: Timestamp | null = null;
    if (devStartDate) { // YYYY-MM formatında gelir
      try {
        const [year, month] = devStartDate.split('-').map(Number);
        // Ayın ilk gününü oluştur (JavaScript ayları 0-11 arasıdır)
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
    const appRef = doc(db, "apps", initialData.id);

    try {
      await updateDoc(appRef, {
        name: appName,
        description: description,
        platform: selectedPlatforms,
        status: status || null,
        userCount: userCountNum,
        monthlyRevenue: monthlyRevenueNum,
        developmentStartDate: devStartDateTimestamp, // Yeni alan güncellendi
      });
      toast.success("Uygulama başarıyla güncellendi!");
      router.push(`/apps-manager/${initialData.id}`); // Detay sayfasına yönlendir
      router.refresh(); // Sayfayı yenileyerek güncel veriyi göster
    } catch (err) {
      console.error("Firestore güncelleme hatası:", err);
      toast.error("Uygulama güncellenirken bir hata oluştu.");
      setLoading(false);
    }
  };

  return (
    // Stiller AddAppForm ile aynı (lacivert arka plan)
    <form onSubmit={handleUpdate} className="mb-8 p-6 border border-primary-foreground/20 rounded-lg bg-primary text-primary-foreground shadow-lg">
      <h2 className="text-2xl font-semibold mb-5 text-primary-foreground">Uygulamayı Düzenle</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* App Name */}
        <div>
          <label htmlFor="appName" className="block text-sm font-medium text-primary-foreground/80 mb-1">
            Uygulama Adı <span className="text-red-400">*</span>
          </label>
          <input
            id="appName"
            type="text"
            value={appName} // State'den al
            onChange={(e) => setAppName(e.target.value)}
            className="w-full p-2 bg-white/10 border border-primary-foreground/30 rounded text-primary-foreground placeholder-primary-foreground/50 focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition"
            disabled={loading}
            required
          />
        </div>

        {/* Status */}
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-primary-foreground/80 mb-1">
            Durum
          </label>
          <select
            id="status"
            value={status} // State'den al
            onChange={(e) => setStatus(e.target.value)}
            className="w-full p-2 bg-white/10 border border-primary-foreground/30 rounded text-primary-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent appearance-none transition"
            disabled={loading}
          >
            <option value="" className="bg-primary text-primary-foreground/80">Seçiniz...</option>
            {statusOptions.map(option => (
              <option key={option} value={option} className="bg-primary text-primary-foreground">{option}</option>
            ))}
          </select>
        </div>

        {/* Platform (Checkbox Grubu) */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-primary-foreground/80 mb-2">
            Platform (Bir veya daha fazla seçin)
          </label>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {platformOptions.map((platform) => (
              <label key={platform} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  value={platform}
                  checked={selectedPlatforms.includes(platform)} // State'den al
                  onChange={handlePlatformChange}
                  disabled={loading}
                  className="rounded text-accent focus:ring-accent/70 h-4 w-4 border-primary-foreground/50 bg-white/10"
                />
                <span className="text-sm text-primary-foreground">{platform}</span>
              </label>
            ))}
          </div>
        </div>

        {/* User Count */} 
        <div>
          <label htmlFor="userCount" className="block text-sm font-medium text-primary-foreground/80 mb-1">
            Kullanıcı Sayısı (Opsiyonel)
          </label>
          <input
            id="userCount"
            type="number"
            value={userCount} // State'den al
            onChange={(e) => setUserCount(e.target.value)}
            placeholder="Örn: 1500"
            min="0"
            className="w-full p-2 bg-white/10 border border-primary-foreground/30 rounded text-primary-foreground placeholder-primary-foreground/50 focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition"
            disabled={loading}
          />
        </div>

        {/* Monthly Revenue */} 
        <div>
          <label htmlFor="monthlyRevenue" className="block text-sm font-medium text-primary-foreground/80 mb-1">
            Aylık Kazanç (Opsiyonel)
          </label>
          <input
            id="monthlyRevenue"
            type="text"
            inputMode="decimal"
            value={monthlyRevenue} // State'den al
            onChange={(e) => setMonthlyRevenue(e.target.value)}
            placeholder="Örn: 499.90"
            className="w-full p-2 bg-white/10 border border-primary-foreground/30 rounded text-primary-foreground placeholder-primary-foreground/50 focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition"
            disabled={loading}
          />
        </div>

        {/* Development Start Date */}
        <div>
          <label htmlFor="devStartDate" className="block text-sm font-medium text-primary-foreground/80 mb-1">
            Geliştirme Başlangıcı (Ay/Yıl - Opsiyonel)
          </label>
          <input
            id="devStartDate"
            type="month" // Ay ve yıl seçimi için
            value={devStartDate} // State'den al (YYYY-MM formatında)
            onChange={(e) => setDevStartDate(e.target.value)}
            className="w-full p-2 bg-white/10 border border-primary-foreground/30 rounded text-primary-foreground placeholder-primary-foreground/50 focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition appearance-none"
            disabled={loading}
          />
        </div>
      </div>

      {/* Description */}
      <div className="mb-6 md:col-span-2">
        <label htmlFor="description" className="block text-sm font-medium text-primary-foreground/80 mb-1">
          Açıklama
        </label>
        <textarea
          id="description"
          value={description} // State'den al
          onChange={(e) => setDescription(e.target.value)}
          rows={4} // Biraz daha uzun olabilir
          className="w-full p-2 bg-white/10 border border-primary-foreground/30 rounded text-primary-foreground placeholder-primary-foreground/50 focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition"
          disabled={loading}
        />
      </div>

      {/* Buttons */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 md:col-span-2">
        <Link
           href={`/apps-manager/${initialData.id}`} // Detay sayfasına geri dön
           className={`w-full sm:w-auto px-4 py-2 text-primary-foreground/80 hover:text-primary-foreground border border-primary-foreground/30 rounded-md transition duration-150 ease-in-out text-center ${
               loading ? 'opacity-50 cursor-not-allowed' : ''
           }`}
        >
           Geri Dön
         </Link>
        <button
          type="submit"
          disabled={loading}
          className={`w-full sm:w-auto bg-[#F72585] hover:bg-[#E01B74] text-white font-semibold text-lg py-4 px-8 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#F72585] focus:ring-offset-primary disabled:opacity-70 disabled:cursor-not-allowed transition duration-150 ease-in-out ${
            loading ? 'opacity-70 cursor-not-allowed' : ''
          }`}
        >
          {loading ? 'Güncelleniyor...' : 'Değişiklikleri Kaydet'}
        </button>
      </div>
    </form>
  );
};

export default EditAppForm; 
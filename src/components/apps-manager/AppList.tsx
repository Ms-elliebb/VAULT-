"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  deleteDoc,
  Timestamp // Timestamp'i import edelim
} from "firebase/firestore";
import { db } from '@/lib/firebase';

// Uygulama verisinin tipini tanımlayalım
interface App {
  id: string;
  name: string;
  description?: string;
  platform?: string[]; // Platform formda diziye çevrildi, burada da dizi varsayalım
  status?: string | null;
  createdAt?: Timestamp;
  userCount?: number | null; // Eklendi
  // monthlyRevenue?: number | null; // Listede göstermeyeceğimiz için eklemedim
}

// Yardımcı: Sayıyı formatlama (Detay sayfasından kopyalandı)
const formatNumber = (num: number | null | undefined): string => {
  if (num === null || num === undefined || isNaN(num)) return '?'; // Sayı yoksa veya geçersizse ? dönsün
  return num.toLocaleString('tr-TR'); 
};

const AppList = () => {
  const [apps, setApps] = useState<App[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Firestore'dan uygulamaları dinle
  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, "apps"), orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const appsData: App[] = [];
      querySnapshot.forEach((doc) => {
        appsData.push({ ...doc.data(), id: doc.id } as App);
      });
      setApps(appsData);
      setLoading(false);
    }, (err) => {
      console.error("Firestore okuma hatası (apps):", err);
      setError("Uygulamalar yüklenirken bir hata oluştu.");
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Uygulamayı silme fonksiyonu
  const deleteApp = async (appId: string) => {
    // Silmeden önce bir onay istemek iyi bir pratiktir, şimdilik direkt silelim
    const appRef = doc(db, "apps", appId);
    try {
      await deleteDoc(appRef);
    } catch (err) {
      console.error("Uygulama silme hatası:", err);
      // Kullanıcıya hata bildirimi gösterilebilir
      toast.error("Uygulama silinirken bir hata oluştu.");
    }
  };

  if (loading) {
    return <p className="text-center py-4 text-gray-500">Uygulamalar yükleniyor...</p>;
  }

  if (error) {
    return <p className="text-red-600 text-center py-4">{error}</p>;
  }

  // Uygulamaları kart görünümünde listeleyelim
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-5 text-foreground border-t pt-6 dark:border-gray-700">Uygulama Listesi</h2>
      {apps.length === 0 ? (
        <p className="text-center text-gray-500 py-6">Henüz uygulama eklenmemiş.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {apps.map((app) => (
            <Link key={app.id} href={`/apps-manager/${app.id}`} className="block hover:no-underline focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary/50 rounded-lg transition duration-150 ease-in-out">
              <div className="rounded-lg p-4 bg-white/20 backdrop-blur-lg text-white flex flex-col justify-between h-full transition hover:shadow-md">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1 truncate" title={app.name}>{app.name}</h3>
                  {app.description && <p className="text-sm text-white/80 mb-3 line-clamp-2">{app.description}</p>}
                   <div className="text-xs text-white/60 space-y-1 mb-3">
                      {app.platform && app.platform.length > 0 && 
                        <div><strong>Platform:</strong> {app.platform.join(', ')}</div>
                      }
                      {app.status && <div><strong>Durum:</strong> {app.status}</div>}
                      {(app.userCount !== null && app.userCount !== undefined) && 
                        <div><strong>Kullanıcılar:</strong> {formatNumber(app.userCount)}</div>
                      }
                   </div>
                </div>
                <div className="mt-auto flex justify-end">
                   <button
                      onClick={(e) => {
                        // Link'in tıklanmasını engellemek için event propagation'ı durdur
                        e.preventDefault();
                        e.stopPropagation();
                        if (window.confirm(`'${app.name}' uygulamasını silmek istediğinize emin misiniz?`)) {
                           deleteApp(app.id);
                        }
                      }}
                      className="text-red-500 hover:text-red-700 text-xs font-medium px-2 py-1 rounded hover:bg-red-100 transition-colors z-10 relative"
                      title="Uygulamayı Sil"
                   >
                     Sil
                   </button>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default AppList; 
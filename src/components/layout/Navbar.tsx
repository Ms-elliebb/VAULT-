"use client"; // Aktif yol kontrolü için use client gerekli

import Link from 'next/link';
import { usePathname } from 'next/navigation'; // usePathname hook'unu import et
import { useState, useEffect } from 'react'; // useState ve useEffect import et
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  Timestamp // Timestamp gerekebilir (App arayüzü için)
} from "firebase/firestore";
import { db } from '@/lib/firebase'; // db import et

// Navbarda gösterilecek app verisi için basit arayüz
interface NavApp {
  id: string;
  name: string;
}

const mainNavLinks = [
  { href: "/planner", label: "Planlayıcı" },
  // Apps Manager buradaydı, dinamik olarak ele alacağız
  { href: "/yemek-gunlugu", label: "Yemek Günlüğü" },
  { href: "/ruh-hali-takibi", label: "Ruh Hali Takibi" },
  { href: "/aktivite-gunlugu", label: "Aktivite Günlüğü" },
  { href: "/finans-paneli", label: "Finans Paneli" },
  { href: "/ideas", label: "Ideas" },
];

const Navbar = () => {
  const pathname = usePathname();
  const [managedApps, setManagedApps] = useState<NavApp[]>([]);
  const [isLoadingApps, setIsLoadingApps] = useState(true);
  const [errorApps, setErrorApps] = useState<string | null>(null);

  // Firestore'dan uygulamaları dinle
  useEffect(() => {
    setIsLoadingApps(true);
    const q = query(collection(db, "apps"), orderBy("name", "asc")); // İsme göre sırala

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const appsData: NavApp[] = [];
      querySnapshot.forEach((doc) => {
        // Sadece id ve name alalım
        appsData.push({ id: doc.id, name: doc.data().name || 'İsimsiz Uygulama' });
      });
      setManagedApps(appsData);
      setIsLoadingApps(false);
      setErrorApps(null);
    }, (err) => {
      console.error("Firestore okuma hatası (navbar apps):", err);
      setErrorApps("Uygulamalar yüklenemedi.");
      setIsLoadingApps(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    // Dikey sidebar için stiller:
    // w-60: Genişlik
    // h-screen: Tam yükseklik
    // bg-secondary: Arkaplan rengi (config'den)
    // text-primary-foreground: Metin rengi (config'den)
    // p-6: İç boşluk
    // flex flex-col: Dikey flex düzeni
    // shadow-lg: Gölge (kaldırıldı)
    // sticky top-0: Sayfa kaydırılsa bile yerinde kalması için (layout.tsx'de ayar gerektirebilir)
    <nav
      className="w-60 h-screen text-primary-foreground p-6 flex flex-col sticky top-0 overflow-y-auto [text-shadow:0_1px_2px_rgba(0,0,0,0.4)]"
      style={{ background: 'rgba(255, 255, 255, 0.36)' }}
    >
      {/* Başlık */}
      <Link href="/" className="text-2xl font-bold mb-10 transition-colors flex-shrink-0 [text-shadow:0_1px_2px_rgba(0,0,0,0.5)]">
        VAULT-
      </Link>

      {/* Ana Navigasyon Linkleri ve Dinamik Apps Manager */}
      <div className="flex flex-col space-y-4 flex-grow">
        {/* Sabit linkler */}
        {mainNavLinks.map((link) => {
          const isActive = pathname === link.href;
          // Aktif stil için blur efekti ve neon çerçeve
          const activeStyle = {
            backgroundColor: 'rgba(255, 255, 255, 0.1)', // Hafif beyaz arka plan
            backdropFilter: 'blur(4px)', // Arka plan bulanıklığı
            boxShadow: '0 0 8px rgba(255, 255, 255, 0.9)', // Neon beyaz parlama efekti
            // -webkit-backdrop-filter: 'blur(4px)' // Safari uyumluluğu için (isteğe bağlı)
          };
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`px-3 py-2 rounded-md font-medium transition-all duration-150 ease-in-out block ${
                isActive
                  ? 'text-white shadow-sm' // Aktifken: Beyaz metin, gölge
                  : 'text-primary-foreground hover:bg-white/10 [text-shadow:0_1px_1px_rgba(0,0,0,0.3)]' // Pasifken: Varsayılan metin rengi, hover efekti
              }`}
              style={isActive ? activeStyle : {}} // Aktifse gradient arka planını uygula
            >
              {link.label}
            </Link>
          );
        })}

        {/* Apps Manager Bölümü */}
        <div>
          {(() => {
              const isAppsManagerBaseActive = pathname.startsWith('/apps-manager');
              // Sadece base path aktifse (edit değilse)
              const isActive = isAppsManagerBaseActive && !pathname.includes('/edit');
              // Aktif stil için blur efekti ve neon çerçeve
              const activeStyle = {
                backgroundColor: 'rgba(255, 255, 255, 0.1)', // Hafif beyaz arka plan
                backdropFilter: 'blur(4px)', // Arka plan bulanıklığı
                boxShadow: '0 0 8px rgba(255, 255, 255, 0.9)', // Neon beyaz parlama efekti
                // -webkit-backdrop-filter: 'blur(4px)' // Safari uyumluluğu için (isteğe bağlı)
              };
              return (
                <Link
                  href="/apps-manager"
                  className={`px-3 py-2 rounded-md font-medium transition-all duration-150 ease-in-out block ${
                    isActive
                      ? 'text-white' // Aktifken: Beyaz metin
                      : 'text-primary-foreground hover:bg-white/10 [text-shadow:0_1px_1px_rgba(0,0,0,0.3)]' // Pasifken: Varsayılan metin rengi, hover efekti
                  }`}
                  style={isActive ? activeStyle : {}} // Aktifse gradient arka planını uygula
                >
                  Apps Manager
                </Link>
              );
          })()}

          {/* Alt Uygulama Listesi */}
          {(isLoadingApps || errorApps || managedApps.length > 0) && (
              <ul className="mt-1 space-y-1 pl-4 border-l border-primary-foreground/10 ml-3">
                {isLoadingApps && (
                    <li className="px-3 py-1 text-xs text-primary-foreground italic [text-shadow:0_1px_1px_rgba(0,0,0,0.3)]">Yükleniyor...</li>
                )}
                {errorApps && (
                    <li className="px-3 py-1 text-xs text-red-400 [text-shadow:0_1px_1px_rgba(255,255,255,0.5)]">{errorApps}</li>
                )}
                {managedApps.map((app) => {
                  const isActive = pathname === `/apps-manager/${app.id}`;
                  // Aktif stil için blur efekti ve neon çerçeve (daha hafif)
                  const activeStyle = {
                    backgroundColor: 'rgba(255, 255, 255, 0.08)', // Alt linkler için biraz daha az belirgin arka plan
                    backdropFilter: 'blur(4px)', // Arka plan bulanıklığı
                    boxShadow: '0 0 6px rgba(255, 255, 255, 0.7)', // Daha hafif neon parlama
                    // -webkit-backdrop-filter: 'blur(4px)' // Safari uyumluluğu için (isteğe bağlı)
                  };
                  return (
                    <li key={app.id}>
                      <Link
                        href={`/apps-manager/${app.id}`}
                        title={app.name}
                        className={`block px-3 py-1 rounded text-xs transition-colors truncate ${
                          isActive
                            ? 'text-white font-semibold' // Aktifken: Beyaz metin, kalın font
                            : 'text-primary-foreground hover:bg-white/10 [text-shadow:0_1px_1px_rgba(0,0,0,0.3)]' // Pasifken: Varsayılan metin rengi, hover efekti
                        }`}
                        style={isActive ? activeStyle : {}} // Aktifse gradient arka planını uygula
                      >
                        {app.name}
                      </Link>
                    </li>
                  );
                })}
              </ul>
          )}
        </div>

        {/* Diğer sabit linkler buraya eklenebilir */}

      </div>
      {/* İleride buraya kullanıcı profili veya ayarlar gibi ek menü öğeleri eklenebilir */}
      {/* <div className="mt-auto"> ... </div> */}
    </nav>
  );
};

export default Navbar; 
import { doc, getDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import EditAppForm from '@/components/apps-manager/EditAppForm';

// App arayüzü (detay sayfasından alındı, platform güncellendi)
interface App {
  id: string;
  name: string;
  description?: string;
  platform?: string[]; // Checkbox'tan dolayı dizi oldu
  status?: string | null;
  createdAt?: Timestamp; // Firestore'dan gelir ama forma gerek yok
}

// Sayfa propsları
interface EditAppPageProps {
  params: {
    appId: string;
  };
}

// Veri çekme fonksiyonu (detay sayfasından alındı)
async function getAppData(appId: string): Promise<App | null> {
  try {
    const appRef = doc(db, 'apps', appId);
    const appSnap = await getDoc(appRef);

    if (appSnap.exists()) {
      // Platform alanının dizi olduğundan emin olalım (eski veriler string olabilir)
      const data = appSnap.data();
      let platformData = data.platform;
      if (typeof platformData === 'string') {
          platformData = [platformData]; // Tek string ise diziye çevir
      } else if (!Array.isArray(platformData)) {
          platformData = []; // Geçersiz veya eksikse boş dizi yap
      }

      return { 
          id: appSnap.id, 
          ...data, 
          platform: platformData 
      } as App;
    } else {
      console.log('Düzenlenecek uygulama bulunamadı!');
      return null;
    }
  } catch (error) {
    console.error("Firestore okuma hatası (getDoc - edit):", error);
    return null;
  }
}

// Düzenleme sayfası component'i (Server Component)
export default async function EditAppPage({ params }: EditAppPageProps) {
  const appId = params.appId;
  const appData = await getAppData(appId);

  // Uygulama bulunamazsa
  if (!appData) {
    return (
      <div className="p-4 text-center">
        <h1 className="text-2xl font-bold mb-4 text-red-600">Uygulama Bulunamadı</h1>
        <p className="text-foreground/80">Düzenlemek istediğiniz uygulama mevcut değil.</p>
        <Link href="/apps-manager" className="mt-4 inline-block text-accent hover:underline">
          &larr; Uygulama Listesine Geri Dön
        </Link>
      </div>
    );
  }

  // Uygulama bulunduysa, EditAppForm'u render et ve veriyi prop olarak geç
  return (
    <div className="max-w-2xl mx-auto">
      {/* Başlık veya ek içerik buraya eklenebilir */}
      <EditAppForm initialData={appData} />
    </div>
  );
}

// İsteğe bağlı: Metadata
export async function generateMetadata({ params }: EditAppPageProps) {
  const app = await getAppData(params.appId);
  if (!app) {
    return { title: 'Uygulama Bulunamadı' };
  }
  return {
    title: `${app.name} - Düzenle`,
  };
} 
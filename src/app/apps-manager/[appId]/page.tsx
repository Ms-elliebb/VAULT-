import { doc, getDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase'; // Firebase db instance'ımızı import ediyoruz
import Link from 'next/link'; // Geri dönmek için Link
import AddMetricForm from '@/components/apps-manager/AddMetricForm'; // Eklendi
import AppMetricsChart from '@/components/apps-manager/AppMetricsChart'; // Eklendi

// Uygulama verisinin tipini tanımlayalım (AppList'teki ile aynı olabilir)
interface App {
  id: string; // ID'yi de ekleyelim
  name: string;
  description?: string;
  platform?: string[] | string | null; // Platform dizi veya string olabilir
  status?: string | null;
  createdAt?: Timestamp;
  userCount?: number | null; // Eklendi
  monthlyRevenue?: number | null; // Eklendi
  developmentStartDate?: Timestamp | null; // Yeni alan eklendi
}

// Sayfanın alacağı props'ları tanımlıyoruz (Next.js App Router dinamik segmentler için bunu sağlar)
interface AppDetailPageProps {
  params: {
    appId: string; // Klasör adı [appId] ile eşleşmeli
  };
}

// Veriyi sunucuda çeken asenkron fonksiyon
async function getAppData(appId: string): Promise<App | null> {
  try {
    const appRef = doc(db, 'apps', appId); // Belirtilen ID ile doküman referansı
    const appSnap = await getDoc(appRef); // Dokümanı getir

    if (appSnap.exists()) {
      // Doküman varsa, veriyi ve ID'yi birleştirip döndür
      return { id: appSnap.id, ...appSnap.data() } as App;
    } else {
      // Doküman yoksa null döndür
      console.log('Böyle bir uygulama bulunamadı!');
      return null;
    }
  } catch (error) {
    console.error("Firestore okuma hatası (getDoc):", error);
    // Gerçek uygulamada daha iyi hata yönetimi yapılabilir
    return null;
  }
}

// Yardımcı: Sayıyı formatlama (opsiyonel)
const formatNumber = (num: number | null | undefined): string => {
  if (num === null || num === undefined) return '-';
  return num.toLocaleString('tr-TR'); // Binlik ayıracı ekler
};

// Yardımcı: Para birimini formatlama (opsiyonel)
const formatCurrency = (amount: number | null | undefined): string => {
  if (amount === null || amount === undefined) return '-';
  return amount.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' }); // Örnek: TRY
};

// Yeni Yardımcı: Timestamp'ı Ay Yıl formatında göster
const formatMonthYear = (timestamp: Timestamp | null | undefined): string => {
  if (!timestamp) return 'Belirtilmemiş';
  return timestamp.toDate().toLocaleDateString('tr-TR', { year: 'numeric', month: 'long' }); // Örnek: Ocak 2024
};

// Sayfa component'i (asenkron olabilir çünkü içinde await kullanıyoruz)
export default async function AppDetailPage({ params }: AppDetailPageProps) {
  const appId = params.appId; // URL'den appId'yi al
  const app = await getAppData(appId); // Uygulama verisini çek

  // Uygulama bulunamazsa veya hata olursa
  if (!app) {
    return (
      <div className="container mx-auto p-4 text-center">
        <h1 className="text-2xl font-bold mb-4 text-red-600">Uygulama Bulunamadı</h1>
        <p>Aradığınız uygulama mevcut değil veya yüklenirken bir hata oluştu.</p>
        <Link href="/apps-manager" className="mt-4 inline-block text-blue-600 hover:underline">
          &larr; Uygulama Listesine Geri Dön
        </Link>
      </div>
    );
  }

  // Platformu her zaman dizi yap (gösterim için)
  let displayPlatforms: string[] = [];
  if (typeof app.platform === 'string') {
    displayPlatforms = [app.platform];
  } else if (Array.isArray(app.platform)) {
    displayPlatforms = app.platform;
  }

  // Uygulama bulunduysa detayları göster
  return (
    <div className="container mx-auto p-4 max-w-4xl">
       <Link href="/apps-manager" className="mb-6 inline-block text-sm text-accent hover:underline">
          &larr; Uygulama Listesine Geri Dön
        </Link>
      {/* Apply frosted glass to the main app detail card */}
      <div className="mb-8 p-6 rounded-lg bg-white/20 backdrop-blur-lg text-white">
        <h1 className="text-3xl font-bold mb-3 text-white">{app.name}</h1>

        {app.status && (
          <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full mb-4 ${
              /* Adjust status badge colors for better visibility on frosted glass */
              app.status === 'Yayınlandı' ? 'bg-green-500/80 text-white' :
              app.status === 'Geliştiriliyor' ? 'bg-blue-500/80 text-white' :
              app.status === 'Test' ? 'bg-yellow-500/80 text-white' :
              app.status === 'Arşivlendi' ? 'bg-gray-500/80 text-white' :
              'bg-purple-500/80 text-white' // Diğer durumlar için
            }`}>
            {app.status}
          </span>
        )}

        {app.description && (
          <p className="text-white/80 mb-4 whitespace-pre-wrap">{app.description}</p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-sm text-foreground/80 border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
          {displayPlatforms.length > 0 && (
             <div><strong>Platform:</strong> {displayPlatforms.join(', ')}</div>
          )}
          {app.createdAt && (
             <div><strong>Oluşturulma:</strong> {app.createdAt.toDate().toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
          )}
          {(app.userCount !== null && app.userCount !== undefined) && (
             <div><strong>Kullanıcı Sayısı:</strong> {formatNumber(app.userCount)}</div>
          )}
          {(app.monthlyRevenue !== null && app.monthlyRevenue !== undefined) && (
             <div><strong>Aylık Kazanç:</strong> {formatCurrency(app.monthlyRevenue)}</div>
          )}
          {/* Yeni: Geliştirme Başlangıcı */}
          <div><strong>Geliştirme Başlangıcı:</strong> {formatMonthYear(app.developmentStartDate)}</div>
          <div><strong>ID:</strong> <code className="text-xs bg-gray-100 dark:bg-gray-700 text-foreground/70 p-1 rounded">{app.id}</code></div>
        </div>
      </div>
       {/* Düzenleme butonu/linki eklendi */}
       <div className="text-right mb-8">
         <Link 
            href={`/apps-manager/${app.id}/edit`} 
             /* Apply new primary button style (using Link as button) */
            className="inline-block bg-[#F72585] hover:bg-[#E01B74] text-white font-semibold text-lg py-4 px-8 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#F72585] focus:ring-offset-white/20 transition duration-150 ease-in-out"
            >
           Düzenle
         </Link>
       </div>

       {/* Metrik Geçmişi Grafiği */}
       <AppMetricsChart appId={app.id} />

       {/* Yeni Metrik Ekleme Formu */}
       <AddMetricForm appId={app.id} />

    </div>
  );
}

// İsteğe bağlı: Dinamik sayfalar için metadata oluşturma
export async function generateMetadata({ params }: AppDetailPageProps) {
  const app = await getAppData(params.appId);
  if (!app) {
    return { title: 'Uygulama Bulunamadı' };
  }
  return {
    title: `${app.name} - Uygulama Detayları`,
    description: app.description || `Detayları görüntüle: ${app.name}`,
  };
} 
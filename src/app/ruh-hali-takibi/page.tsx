import AddMoodEntryForm from '@/components/ruh-hali/AddMoodEntryForm';
import Link from 'next/link';

export const metadata = {
    title: 'Ruh Hali & Enerji Takibi',
    description: 'Günlük ruh hali ve enerji seviyenizi kaydedin.',
};

export default function RuhHaliTakibiPage() {
    return (
        <div className="container mx-auto p-4 max-w-2xl">
            <h1 className="text-3xl font-bold mb-6 text-foreground">Ruh Hali & Enerji Takibi</h1>
            <p className="mb-6 text-foreground/80">
                Her gün buraya gelerek o günkü ruh halinizi ve enerji seviyenizi kaydedebilirsiniz.
                Bu, zaman içindeki genel durumunuzu fark etmenize yardımcı olabilir.
            </p>

            {/* Ruh Hali Ekleme/Güncelleme Formu */}
            <AddMoodEntryForm />

            {/* İleride buraya geçmiş kayıtların bir özeti veya grafiği eklenebilir */}
            {/* <MoodHistory /> */}
        </div>
    );
} 
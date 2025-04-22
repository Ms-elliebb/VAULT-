import AddEntryForm from '@/components/yemek-gunlugu/AddEntryForm';
import EntryList from '@/components/yemek-gunlugu/EntryList';
import Link from 'next/link';

export const metadata = {
    title: 'Yemek Günlüğü',
    description: 'Günlük yemek kayıtlarınızı tutun.',
};

export default function YemekGunluguPage() {
    return (
        <div className="container mx-auto p-4 max-w-3xl">
            {/* İsteğe bağlı: Geri dönme linki */}
            {/* <Link href="/" className="mb-6 inline-block text-sm text-accent hover:underline">
                &larr; Ana Sayfaya Geri Dön
            </Link> */}

            <h1 className="text-3xl font-bold mb-6 text-foreground">Yemek Günlüğü</h1>

            {/* Yeni Kayıt Ekleme Formu */}
            <AddEntryForm />

            {/* Kayıt Listesi */}
            <EntryList />
        </div>
    );
} 
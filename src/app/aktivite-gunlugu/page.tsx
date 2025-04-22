import AddActivityForm from '@/components/aktivite-gunlugu/AddActivityForm';
import ActivityList from '@/components/aktivite-gunlugu/ActivityList';
import Link from 'next/link';

export const metadata = {
    title: 'Aktivite Günlüğü',
    description: 'Günlük fiziksel aktivitelerinizi kaydedin.',
};

export default function AktiviteGunluguPage() {
    return (
        <div className="container mx-auto p-4 max-w-3xl">
            <h1 className="text-3xl font-bold mb-6 text-foreground">Aktivite Günlüğü</h1>
            <p className="mb-6 text-foreground/80">
                Yaptığınız yürüyüş, egzersiz, temizlik gibi fiziksel aktiviteleri buraya kaydederek hareketliliğinizi takip edebilirsiniz.
            </p>

            {/* Yeni Aktivite Ekleme Formu */}
            <AddActivityForm />

            {/* Aktivite Listesi */}
            <ActivityList />
        </div>
    );
} 
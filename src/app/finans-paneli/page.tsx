import AddIncomeForm from '@/components/finans/gelir/AddIncomeForm';
import IncomeList from '@/components/finans/gelir/IncomeList';
import RecurringExpensesManager from '@/components/finans/giderler/RecurringExpensesManager';
import AddSpendingForm from '@/components/finans/harcamalar/AddSpendingForm';
import SpendingList from '@/components/finans/harcamalar/SpendingList';
import MonthlySummary from '@/components/finans/ozet/MonthlySummary';
import Link from 'next/link';

export const metadata = {
    title: 'Finans Paneli',
    description: 'Gelir ve giderlerinizi takip edin.',
};

export default function FinansPaneliPage() {
    return (
        <div className="container mx-auto p-4 max-w-4xl"> {/* Biraz daha geniş olabilir */}
            <h1 className="text-3xl font-bold mb-6 text-foreground">Finans Paneli</h1>
            <p className="mb-8 text-foreground/80">
                Bu panel üzerinden aylık gelirlerinizi, düzenli giderlerinizi ve anlık harcamalarınızı takip edebilirsiniz.
            </p>

            {/* Aylık Özet Bölümü Eklendi (En Üste) */}
            <section className="mb-12">
                <MonthlySummary />
            </section>

            {/* Gelir Bölümü */}
            <section className="mb-12">
                 <h2 className="text-2xl font-semibold mb-4 text-foreground border-b pb-2">Gelir Yönetimi</h2>
                 {/* Yeni Gelir Ekleme Formu */}
                 <AddIncomeForm />

                 {/* Gelir Listesi */}
                 <IncomeList />
             </section>

            {/* Düzenli Giderler Bölümü Eklendi */}
            <section className="mb-12">
                 <h2 className="text-2xl font-semibold mb-4 text-foreground border-b pb-2">Düzenli Gider Yönetimi</h2>
                 <RecurringExpensesManager />
             </section>

            {/* Anlık Harcama Bölümü Eklendi */}
            <section className="mb-12">
                 <h2 className="text-2xl font-semibold mb-4 text-foreground border-b pb-2">Harcama Günlüğü</h2>
                 <AddSpendingForm />
                 <SpendingList />
             </section>

             {/* TODO: Diğer bölümler buraya eklenecek (Düzenli Giderler, Harcamalar, Özet) */}

        </div>
    );
} 
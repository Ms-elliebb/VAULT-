"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { collection, query, orderBy, onSnapshot, Timestamp, deleteDoc, doc } from "firebase/firestore";
import { db } from '@/lib/firebase';
import { toast } from 'react-hot-toast';

// Firestore'dan gelen veri tipi
interface FoodEntry {
    id: string; // Firestore belge ID'si
    entryTime: Timestamp;
    foodDescription: string;
    createdAt: Timestamp;
}

// Gruplanmış veri için tip
interface GroupedEntries {
    [date: string]: FoodEntry[]; // Anahtar: "23 Temmuz 2024", Değer: O güne ait kayıtlar dizisi
}

const formatEntryTime = (timestamp: Timestamp): string => {
    if (!timestamp) return '-';
    // Sadece saati (HH:MM) göster
    return timestamp.toDate().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', hour12: false });
};

const formatEntryDate = (timestamp: Timestamp): string => {
    if (!timestamp) return '-';
    // Sadece tarihi göster
    return timestamp.toDate().toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' });
}

const EntryList = () => {
  const [entries, setEntries] = useState<FoodEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // entryTime'a göre *artan* sıralama gruplamayı kolaylaştırır, en yeni gün en sonda olur.
    // Ancak kullanıcı genellikle en yeni kayıtları en üstte görmek ister.
    // Bu yüzden azalan sıralama ile alıp, gruplarken Map kullanarak sırayı koruyalım.
    const q = query(collection(db, "foodDiaryEntries"), orderBy("entryTime", "desc"));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const entriesData: FoodEntry[] = [];
      querySnapshot.forEach((doc) => {
        entriesData.push({ id: doc.id, ...doc.data() } as FoodEntry);
      });
      setEntries(entriesData); // Ham veriyi state'e aktar
      setLoading(false);
    }, (error) => {
      console.error("Yemek günlüğü verilerini çekerken hata:", error);
      toast.error("Kayıtlar yüklenirken bir hata oluştu.");
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Ham `entries` değiştiğinde gruplamayı yeniden hesapla
  const groupedEntries = useMemo(() => {
     // Daha sağlam: Map kullanmak ve Map'in eklenme sırasını korumasından faydalanmak.
     const orderedGroups = new Map<string, FoodEntry[]>();
      entries.forEach(entry => {
         const dateKey = formatEntryDate(entry.entryTime);
         if (!orderedGroups.has(dateKey)) {
              orderedGroups.set(dateKey, []);
          }
          orderedGroups.get(dateKey)!.push(entry);
      });
      return orderedGroups;

  }, [entries]); // `entries` değiştiğinde yeniden hesapla

  const handleDelete = async (id: string) => {
      if (!confirm("Bu kaydı silmek istediğinizden emin misiniz?")) {
          return;
      }
      try {
          await deleteDoc(doc(db, "foodDiaryEntries", id));
          toast.success("Kayıt başarıyla silindi.");
      } catch (error) {
          console.error("Kayıt silinirken hata:", error);
          toast.error("Kayıt silinirken bir hata oluştu.");
      }
  }

  if (loading) {
    return <div className="text-center p-4 text-foreground/70">Kayıtlar yükleniyor...</div>;
  }

  // Gruplanmış Map boşsa veya hiç entry yoksa
   if (groupedEntries.size === 0) {
    return <div className="text-center p-4 text-foreground/70">Henüz yemek kaydı eklenmemiş.</div>;
   }

  // Gruplanmış veriyi render et
  return (
    <div className="space-y-6"> {/* Günler arası boşluk artırıldı */}
      <h2 className="text-xl font-semibold mb-4 text-foreground">Yemek Kayıtları</h2>
      {/* Map üzerinden dönerek her bir gün grubunu render et */}
      {Array.from(groupedEntries.entries()).map(([date, dailyEntries]) => (
        <div key={date} className="p-4 border border-border rounded-lg bg-card shadow-sm"> {/* Günlük "hap" */}
          <h3 className="text-lg font-semibold mb-3 text-card-foreground border-b border-border pb-2">{date}</h3>
          <div className="space-y-3"> {/* Gün içi kayıtlar arası boşluk */}
            {dailyEntries.map((entry) => (
              <div key={entry.id} className="flex justify-between items-start gap-2">
                <p className="text-base text-card-foreground/90">
                  <span className="font-semibold text-sm mr-2">{formatEntryTime(entry.entryTime)}</span>
                   {entry.foodDescription}
                </p>
                <button
                  onClick={() => handleDelete(entry.id)}
                  className="text-red-500 hover:text-red-700 text-xs font-medium p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors flex-shrink-0" // flex-shrink-0 eklendi
                  aria-label="Kaydı sil"
                >
                  Sil
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default EntryList; 
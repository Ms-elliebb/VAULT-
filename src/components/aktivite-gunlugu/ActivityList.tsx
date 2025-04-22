"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { collection, query, orderBy, onSnapshot, Timestamp, deleteDoc, doc } from "firebase/firestore";
import { db } from '@/lib/firebase';
import { toast } from 'react-hot-toast';

// Firestore'dan gelen veri tipi
interface ActivityEntry {
    id: string;
    activityType: string;
    activityTime: Timestamp;
    durationMinutes: number;
    description?: string;
    createdAt: Timestamp;
}

// Gruplanmış veri için tip
interface GroupedActivities {
    [date: string]: ActivityEntry[];
}

// Zaman formatlama
const formatActivityTime = (timestamp: Timestamp): string => {
    if (!timestamp) return '-';
    return timestamp.toDate().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', hour12: false });
};

// Tarih formatlama
const formatActivityDate = (timestamp: Timestamp): string => {
    if (!timestamp) return '-';
    return timestamp.toDate().toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' });
}

const ActivityList = () => {
  const [activities, setActivities] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "activityEntries"), orderBy("activityTime", "desc")); // Saate göre azalan

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const activitiesData: ActivityEntry[] = [];
      querySnapshot.forEach((doc) => {
        activitiesData.push({ id: doc.id, ...doc.data() } as ActivityEntry);
      });
      setActivities(activitiesData);
      setLoading(false);
    }, (error) => {
      console.error("Aktivite verilerini çekerken hata:", error);
      toast.error("Aktiviteler yüklenirken bir hata oluştu.");
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Gruplama mantığı (Yemek günlüğündeki gibi)
  const groupedActivities = useMemo(() => {
     const orderedGroups = new Map<string, ActivityEntry[]>();
      activities.forEach(activity => {
         const dateKey = formatActivityDate(activity.activityTime);
         if (!orderedGroups.has(dateKey)) {
              orderedGroups.set(dateKey, []);
          }
          orderedGroups.get(dateKey)!.push(activity);
      });
      return orderedGroups;
  }, [activities]);

  const handleDelete = async (id: string) => {
      if (!confirm("Bu aktivite kaydını silmek istediğinizden emin misiniz?")) {
          return;
      }
      try {
          await deleteDoc(doc(db, "activityEntries", id));
          toast.success("Aktivite kaydı başarıyla silindi.");
      } catch (error) {
          console.error("Aktivite silinirken hata:", error);
          toast.error("Aktivite silinirken bir hata oluştu.");
      }
  }

  if (loading) {
    return <div className="text-center p-4 text-foreground/70">Aktiviteler yükleniyor...</div>;
  }

  if (groupedActivities.size === 0) {
    return <div className="text-center p-4 text-foreground/70">Henüz aktivite kaydı eklenmemiş.</div>;
  }

  // Gruplanmış veriyi render et
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold mb-4 text-foreground">Aktivite Kayıtları</h2>
      {Array.from(groupedActivities.entries()).map(([date, dailyActivities]) => (
        <div key={date} className="p-4 border border-border rounded-lg bg-card shadow-sm">
          <h3 className="text-lg font-semibold mb-3 text-card-foreground border-b border-border pb-2">{date}</h3>
          <div className="space-y-3">
            {dailyActivities.map((activity) => (
              <div key={activity.id} className="flex justify-between items-start gap-2">
                 {/* Aktivite Detayları ve Açıklama */}
                <div className="flex-grow">
                     <div>
                         <span className="font-semibold text-sm mr-2">{formatActivityTime(activity.activityTime)}</span>
                         <span className="text-base text-card-foreground/90">{activity.activityType}</span>
                         <span className="text-xs text-muted-foreground ml-2">({activity.durationMinutes} dk)</span>
                     </div>
                     {activity.description && (
                        <p className="text-sm text-muted-foreground mt-1 ml-1 pl-6">
                            {activity.description}
                        </p>
                     )}
                 </div>
                 {/* Silme Butonu */}
                <button
                  onClick={() => handleDelete(activity.id)}
                  className="text-red-500 hover:text-red-700 text-xs font-medium p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors flex-shrink-0 mt-0.5"
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

export default ActivityList; 
"use client";

import React, { useState, useEffect } from 'react';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  Timestamp,
  Query
} from "firebase/firestore";
import { db } from '@/lib/firebase';
import { toast } from 'react-hot-toast';

// Task verisinin tipini tanımlayalım
interface Task {
  id: string;
  text: string;
  completed: boolean;
  createdAt?: Timestamp;
  dueDate?: Timestamp | null;
  types: string[]; // ['Günlük', 'Haftalık'] gibi
  completedAt?: Timestamp | null;
}

// Kaldırılan tarih fonksiyonları
/*
const getStartOfDay = ...
const getEndOfDay = ...
const getStartOfWeek = ...
const getEndOfWeek = ...
const getStartOfMonth = ...
const getEndOfMonth = ...
*/

// --- Yardımcı Tarih Fonksiyonları ---

const isSameDay = (date1: Date | null | undefined, date2: Date | null | undefined): boolean => {
  if (!date1 || !date2) return false;
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getDate() === date2.getDate();
};

const isYesterday = (dateToCheck: Date | null | undefined, today: Date): boolean => {
  if (!dateToCheck) return false;
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  return isSameDay(dateToCheck, yesterday);
};

// Haftanın başlangıcını (Pazartesi) döndürür
const getStartOfWeek = (date: Date): Date => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0); // Günün başlangıcı
  const day = d.getDay(); // 0 Pazar, 1 Pazartesi...
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Pazartesi'ye ayarla
  return new Date(d.setDate(diff));
};

// Belirtilen tarihin verilen hafta içinde olup olmadığını kontrol eder (Pazartesi-Pazar)
const isDateInWeek = (dateToCheck: Date | null | undefined, startOfWeek: Date): boolean => {
  if (!dateToCheck) return false;
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999); // Haftanın sonu

  return dateToCheck >= startOfWeek && dateToCheck <= endOfWeek;
};

// Belirtilen tarihin verilen ay içinde olup olmadığını kontrol eder
const isDateInMonth = (dateToCheck: Date | null | undefined, monthDate: Date): boolean => {
    if (!dateToCheck) return false;
    return dateToCheck.getFullYear() === monthDate.getFullYear() &&
           dateToCheck.getMonth() === monthDate.getMonth();
};

// --- TaskList Component --- 

type TaskView = 'Günlük' | 'Haftalık' | 'Aylık';
const taskViews: TaskView[] = ['Günlük', 'Haftalık', 'Aylık'];

const TaskList = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<TaskView>('Günlük');

  // Firestore'dan görevleri dinle (DÜZELTİLMİŞ SORGULAMA)
  useEffect(() => {
    setLoading(true);
    setError(null);

    const tasksCollection = collection(db, "tasks");

    // TÜM görevleri createdAt'e göre sıralayarak çek
    const q = query(tasksCollection, orderBy("createdAt", "desc")) as Query<Task>;

    // Eski switch bloğu ve where sorguları kaldırıldı.
    /*
    try {
      switch (activeView) { ... }
    } catch (queryError) { ... }
    */

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const tasksData: Task[] = [];
      querySnapshot.forEach((doc) => {
        tasksData.push({ ...doc.data(), id: doc.id } as Task);
      });
      setTasks(tasksData);
      setLoading(false);
    }, (err) => {
      console.error(`Firestore okuma hatası:`, err);
      // Basitleştirilmiş hata mesajı
      setError(`Görevler yüklenirken bir hata oluştu.`);
      setLoading(false);
    });

    return () => unsubscribe();
  // Bağımlılık dizisinden activeView kaldırıldı, çünkü sorgu artık ona bağlı değil.
  }, []);

  // Görevin tamamlanma durumunu değiştiren fonksiyon
  const toggleComplete = async (taskId: string, currentStatus: boolean) => {
    const taskRef = doc(db, "tasks", taskId);
    try {
      await updateDoc(taskRef, {
        completed: !currentStatus,
        completedAt: !currentStatus ? serverTimestamp() : null
      });
      toast.success("Görev durumu başarıyla güncellendi.");
    } catch (err) {
      console.error("Görev güncelleme hatası:", err);
      toast.error("Görev durumu güncellenirken bir hata oluştu.");
    }
  };

  // Görevi silen fonksiyon
  const deleteTask = async (taskId: string) => {
    const taskRef = doc(db, "tasks", taskId);
    try {
      await deleteDoc(taskRef);
      toast.success("Görev başarıyla silindi.");
    } catch (err) {
      console.error("Görev silme hatası:", err);
      toast.error("Görev silinirken bir hata oluştu.");
    }
  };

  // Görevi yarına erteleme fonksiyonu
  const postponeTask = async (taskId: string) => {
    const taskRef = doc(db, "tasks", taskId);
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      // İsteğe bağlı: Yarının başlangıcına ayarlayabiliriz
      // tomorrow.setHours(0, 0, 0, 0);
      await updateDoc(taskRef, {
        dueDate: Timestamp.fromDate(tomorrow)
      });
      toast.success("Görev yarına ertelendi.");
    } catch (err) {
      console.error("Görev erteleme hatası:", err);
      toast.error("Görev ertelenirken bir hata oluştu.");
    }
  };

  // Yardımcı: Tarihi formatlama
  const formatDate = (timestamp: Timestamp | null | undefined): string => {
    if (!timestamp) return "";
    return timestamp.toDate().toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' });
  };

  // Görevleri filtrele ve grupla
  const today = new Date();
  const startOfThisWeek = getStartOfWeek(today);
  const startOfLastWeek = new Date(startOfThisWeek);
  startOfLastWeek.setDate(startOfThisWeek.getDate() - 7);
  const startOfThisMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const pendingTasksRaw = tasks.filter(task => !task.completed);
  const completedTasksRaw = tasks.filter(task => task.completed);

  const pendingFilteredTasks = pendingTasksRaw.filter(task => task.types.includes(activeView));
  const completedFilteredTasks = completedTasksRaw.filter(task => task.types.includes(activeView));

  // Tamamlananları grupla
  const groupedCompletedTasks = {
    today: completedFilteredTasks.filter(task => isSameDay(task.completedAt?.toDate(), today)).sort((a, b) => (b.completedAt?.toMillis() ?? 0) - (a.completedAt?.toMillis() ?? 0)),
    yesterday: completedFilteredTasks.filter(task => isYesterday(task.completedAt?.toDate(), today)).sort((a, b) => (b.completedAt?.toMillis() ?? 0) - (a.completedAt?.toMillis() ?? 0)),
    thisWeek: completedFilteredTasks.filter(task => {
      const completedDate = task.completedAt?.toDate();
      return completedDate && isDateInWeek(completedDate, startOfThisWeek) && !isSameDay(completedDate, today) && !isYesterday(completedDate, today);
    }).sort((a, b) => (b.completedAt?.toMillis() ?? 0) - (a.completedAt?.toMillis() ?? 0)),
    lastWeek: completedFilteredTasks.filter(task => {
        const completedDate = task.completedAt?.toDate();
        return completedDate && isDateInWeek(completedDate, startOfLastWeek);
    }).sort((a, b) => (b.completedAt?.toMillis() ?? 0) - (a.completedAt?.toMillis() ?? 0)),
    thisMonth: completedFilteredTasks.filter(task => {
        const completedDate = task.completedAt?.toDate();
        return completedDate && isDateInMonth(completedDate, startOfThisMonth) && !isDateInWeek(completedDate, startOfThisWeek) && !isDateInWeek(completedDate, startOfLastWeek);
    }).sort((a, b) => (b.completedAt?.toMillis() ?? 0) - (a.completedAt?.toMillis() ?? 0)),
    older: completedFilteredTasks.filter(task => {
        const completedDate = task.completedAt?.toDate();
        return completedDate && !isDateInMonth(completedDate, startOfThisMonth);
    }).sort((a, b) => (b.completedAt?.toMillis() ?? 0) - (a.completedAt?.toMillis() ?? 0)),
  };

  const groupOrder: (keyof typeof groupedCompletedTasks)[] = ['today', 'yesterday', 'thisWeek', 'lastWeek', 'thisMonth', 'older'];
  const groupLabels: Record<keyof typeof groupedCompletedTasks, string> = {
      today: 'Bugün Tamamlananlar',
      yesterday: 'Dün Tamamlananlar',
      thisWeek: 'Bu Hafta Tamamlananlar',
      lastWeek: 'Geçen Hafta Tamamlananlar',
      thisMonth: 'Bu Ay Tamamlananlar',
      older: 'Önceki Aylar'
  };

  // Yükleme durumu
  if (loading) {
    return <p className="text-center py-4 text-foreground/50">Görevler yükleniyor...</p>;
  }

  // Hata durumu
  if (error) {
    return (
        <div className="text-red-600 bg-red-100 border border-red-400 rounded p-4 text-center my-4">
            <p>{error}</p>
        </div>
    );
  }

  // Görev listesi veya boş mesajı
  return (
    <div className="mb-8 p-6 rounded-lg bg-white/20 backdrop-blur-lg text-white">
      {/* Sekme Navigasyonu (Adjust styles) */}
      <div className="mb-6 border-b border-white/20">
        <nav className="-mb-px flex space-x-6" aria-label="Tabs">
          {taskViews.map((view) => (
            <button
              key={view}
              onClick={() => setActiveView(view)}
              /* Adjust tab styles */
              className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors duration-150 ease-in-out ${
                activeView === view
                  ? 'border-accent text-accent' // Use accent color for active tab
                  : 'border-transparent text-white/60 hover:text-white hover:border-white/50'
              }`}
            >
              {view}
            </button>
          ))}
        </nav>
      </div>

      {/* Görev Listesi */}
      {pendingFilteredTasks.length === 0 && completedFilteredTasks.length === 0 ? (
        <p className="text-center text-white/70 py-10">Bu sekmede gösterilecek görev yok.</p>
      ) : (
        <div className="space-y-8">
          {/* Yapılacaklar Bölümü */}
          <div>
            <h3 className="text-lg font-semibold mb-3 text-white/80">Yapılacaklar ({pendingFilteredTasks.length})</h3>
            {pendingFilteredTasks.length === 0 ? (
              <p className="text-sm text-white/50 py-4 text-center">Aktif görev bulunmuyor.</p>
            ) : (
              <ul className="space-y-3">
                {pendingFilteredTasks.map((task) => (
                   /* Apply frosted glass to list items */
                  <li key={task.id} className="rounded-md p-3 bg-white/10 backdrop-blur-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 group">
                    <div className="flex items-center flex-1 min-w-0 mr-2">
                      <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={() => toggleComplete(task.id, task.completed)}
                         /* Adjust checkbox style */
                        className="h-5 w-5 rounded text-primary focus:ring-primary/50 border-white/50 bg-black/20 mr-3 flex-shrink-0 cursor-pointer"
                      />
                      <span className="flex-1 break-words text-white">
                        {task.text}
                        {task.dueDate && (
                          <span className="ml-2 text-xs text-white/70 font-medium">({formatDate(task.dueDate)})</span>
                        )}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-center">
                       {/* Adjust button styles */}
                       <button
                          onClick={() => postponeTask(task.id)}
                          className="text-blue-300 hover:text-blue-200 text-xs font-medium p-1 rounded hover:bg-black/20 transition-colors"
                          title="Yarına Ertele"
                        >
                          Ertele
                       </button>
                       <button
                          onClick={() => deleteTask(task.id)}
                          className="text-white/40 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded"
                          title="Görevi Sil"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                       </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Tamamlananlar Bölümü (Adjust styles) */}
          <div>
            <h3 className="text-lg font-semibold mb-3 text-white/80 border-t border-white/20 pt-6">Tamamlananlar</h3>
            {completedFilteredTasks.length === 0 ? (
              <p className="text-sm text-white/50 py-4 text-center">Henüz tamamlanmış görev yok.</p>
            ) : (
              <div className="space-y-6">
                {groupOrder.map(groupKey => (
                  groupedCompletedTasks[groupKey].length > 0 && (
                    <div key={groupKey}>
                      <h4 className="text-sm font-semibold text-white/60 mb-2 uppercase tracking-wide">{groupLabels[groupKey]}</h4>
                      <ul className="space-y-3">
                        {groupedCompletedTasks[groupKey].map((task) => (
                           /* Apply frosted glass to completed list items */
                          <li key={task.id} className="rounded-md p-3 bg-black/20 backdrop-blur-sm flex items-center justify-between group opacity-80">
                            <div className="flex items-center flex-1 min-w-0 mr-2">
                               <input
                                type="checkbox"
                                checked={task.completed}
                                onChange={() => toggleComplete(task.id, task.completed)}
                                 /* Adjust checkbox style */
                                className="h-5 w-5 rounded text-primary focus:ring-primary/50 border-white/40 bg-black/20 mr-3 flex-shrink-0 cursor-pointer"
                              />
                              <span className="flex-1 break-words text-white/60 line-through">
                                {task.text}
                                {task.completedAt && (
                                  <span className="ml-2 text-xs text-white/50 font-medium">(✓ {formatDate(task.completedAt)})</span>
                                )}
                              </span>
                            </div>
                            <button
                               onClick={() => deleteTask(task.id)}
                               className="text-white/40 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded ml-auto flex-shrink-0"
                               title="Görevi Sil"
                             >
                               <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                   <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                               </svg>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskList; 
"use client";

import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  deleteDoc,
  updateDoc,
  Timestamp
} from "firebase/firestore";
import { db } from '@/lib/firebase';

// Fikir verisinin tipini tanımlayalım
interface Idea {
  id: string;
  text: string;
  createdAt?: Timestamp;
  priority?: 'Düşük' | 'Orta' | 'Yüksek'; // Öncelik tipleri
}

const IdeaList = () => {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const priorityLevels: Idea['priority'][] = ['Düşük', 'Orta', 'Yüksek'];

  // Firestore'dan fikirleri dinle (önceliğe göre de sıralayabiliriz, şimdilik tarihe göre)
  useEffect(() => {
    setLoading(true);
    // Önceliğe göre sıralama ekleyelim: Yüksek > Orta > Düşük, sonra tarihe göre
    // Firestore'da özel bir sayısal alanla (örn: priorityOrder: 0, 1, 2) veya
    // doğrudan string karşılaştırmasıyla yapılabilir. Stringler için:
    // 'Yüksek' > 'Orta' > 'Düşük' (alfabetik ters sıra) mantığı kurulabilir veya
    // birden fazla orderBy kullanılabilir (önce priority, sonra createdAt).
    // Şimdilik sadece oluşturulma tarihine göre sıralayalım.
    const q = query(collection(db, "ideas"), orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const ideasData: Idea[] = [];
      querySnapshot.forEach((doc) => {
        ideasData.push({ ...doc.data(), id: doc.id } as Idea);
      });
      setIdeas(ideasData);
      setLoading(false);
    }, (err) => {
      console.error("Firestore okuma hatası (ideas):", err);
      setError("Fikirler yüklenirken bir hata oluştu.");
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Fikri silme fonksiyonu
  const deleteIdea = async (ideaId: string) => {
    const ideaRef = doc(db, "ideas", ideaId);
    try {
      await deleteDoc(ideaRef);
      toast.success("Fikir başarıyla silindi.");
    } catch (err) {
      console.error("Fikir silme hatası:", err);
      toast.error("Fikir silinirken bir hata oluştu.");
    }
  };

  // Fikir önceliğini güncelleme fonksiyonu
  const updatePriority = async (ideaId: string, newPriority: Idea['priority']) => {
    const ideaRef = doc(db, "ideas", ideaId);
    try {
      await updateDoc(ideaRef, { priority: newPriority });
      toast.success("Öncelik güncellendi.");
    } catch (err) {
      console.error("Fikir öncelik güncelleme hatası:", err);
      toast.error("Fikir önceliği güncellenirken bir hata oluştu.");
    }
  };

  // Öncelik rengini belirleyen yardımcı fonksiyon
  const getPriorityClass = (priority: Idea['priority']) => {
    switch (priority) {
      case 'Yüksek': return 'bg-red-500/80 text-white border-red-400/80';
      case 'Orta': return 'bg-yellow-500/80 text-white border-yellow-400/80';
      case 'Düşük': return 'bg-green-500/80 text-white border-green-400/80';
      default: return 'bg-gray-500/80 text-white border-gray-400/80';
    }
  };

  if (loading) {
    return <p className="text-center py-4 text-gray-500">Fikirler yükleniyor...</p>;
  }

  if (error) {
    return <p className="text-red-600 text-center py-4">{error}</p>;
  }

  return (
    <div className="mb-8 p-6 rounded-lg bg-white/20 backdrop-blur-lg text-white">
      <h2 className="text-xl font-semibold mb-4 text-white">Kaydedilen Fikirler</h2>
      {ideas.length === 0 ? (
        <p className="text-center text-white/70 py-6">Henüz kaydedilmiş fikir yok.</p>
      ) : (
        <ul className="space-y-4">
          {ideas.map((idea) => (
            <li key={idea.id} className="rounded-md p-4 bg-white/10 backdrop-blur-md flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <p className="text-white flex-1 break-words mr-2">{idea.text}</p>

              <div className="flex items-center gap-2 flex-shrink-0 mt-2 sm:mt-0 w-full sm:w-auto justify-end">
                <div className="flex border rounded overflow-hidden border-white/30">
                  {priorityLevels.map(level => (
                    <button
                      key={level}
                      onClick={() => updatePriority(idea.id, level)}
                      title={`${level} Öncelik Ver`}
                      className={`px-2 py-0.5 text-xs font-medium transition-colors ${idea.priority === level ? getPriorityClass(level) : 'bg-black/20 text-white/80 hover:bg-black/40'} border-l first:border-l-0 border-white/30`}
                    >
                      {level}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => {
                    if (window.confirm('Bu fikri silmek istediğinize emin misiniz?')) {
                      deleteIdea(idea.id);
                    }
                  }}
                  className="text-red-400 hover:text-red-500 text-xs font-medium p-1 rounded hover:bg-black/20 transition-colors"
                  title="Fikri Sil"
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
  );
};

export default IdeaList; 
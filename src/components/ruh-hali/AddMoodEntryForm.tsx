"use client";

import React, { useState, useEffect } from 'react';
import { doc, setDoc, getDoc, serverTimestamp, Timestamp } from "firebase/firestore";
import { db } from '@/lib/firebase';
import { toast } from 'react-hot-toast';

// Ruh hali seçenekleri kelimelerle güncellendi ve çoğaltıldı
const moodOptions = [
    "Mutlu", "İyi", "Normal", "Üzgün", "Kızgın", "Stresli", "Yorgun", "Hasta",
    "Enerjik", "Umutlu", "Sakin", "Heyecanlı", "Endişeli", "Huzurlu",
    "Hayal Kırıklığına Uğramış", "Minnettar", "Odaklanmış"
];

// Günün tarihini YYYY-MM-DD formatında alır
const getTodayDateString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const day = today.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
}

const AddMoodEntryForm = () => {
  // selectedMood -> selectedMoods (string[])
  const [selectedMoods, setSelectedMoods] = useState<string[]>([]);
  const [energyLevel, setEnergyLevel] = useState<number>(5); // Ortadan başlasın
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true); // Günün verisini çekmek için

  const todayDateStr = getTodayDateString();

  // Bileşen yüklendiğinde bugünün kaydını çekmeyi dene
  useEffect(() => {
      const fetchTodaysEntry = async () => {
          setInitialLoading(true);
          const docRef = doc(db, "moodEntries", todayDateStr);
          try {
              const docSnap = await getDoc(docRef);
              if (docSnap.exists()) {
                  const data = docSnap.data();
                  // Firestore'dan gelen 'moods' dizisi veya eski 'mood' string'i kontrol et
                  let moodsToSet: string[] = [];
                  if (Array.isArray(data.moods)) {
                      // Yeni 'moods' alanı varsa ve bir diziyse, geçerli seçenekleri filtrele
                      moodsToSet = data.moods.filter((mood: string) => moodOptions.includes(mood));
                  } else if (data.mood && typeof data.mood === 'string' && moodOptions.includes(data.mood)) {
                      // Eski 'mood' alanı varsa ve geçerliyse, diziye çevir
                      moodsToSet = [data.mood];
                  }
                  setSelectedMoods(moodsToSet);
                  setEnergyLevel(data.energy === undefined ? 5 : data.energy);
                  setNotes(data.notes || '');
              } else {
                   // Kayıt yoksa state'leri sıfırla
                   setSelectedMoods([]);
                   setEnergyLevel(5);
                   setNotes('');
              }
          } catch (error) {
              console.error("Bugünün ruh hali kaydı çekilirken hata:", error);
              toast.error("Önceki kayıt yüklenirken bir sorun oluştu.");
          } finally {
              setInitialLoading(false);
          }
      };
      fetchTodaysEntry();
  }, [todayDateStr]); // Tarih değişirse yeniden çek

  // Ruh hali seçme/kaldırma fonksiyonu
  const handleMoodToggle = (mood: string) => {
      setSelectedMoods(prevSelectedMoods => {
          if (prevSelectedMoods.includes(mood)) {
              // Eğer zaten seçiliyse kaldır
              return prevSelectedMoods.filter(m => m !== mood);
          } else {
              // Eğer seçili değilse ekle
              return [...prevSelectedMoods, mood];
          }
      });
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // selectedMood -> selectedMoods kontrolü
    if (selectedMoods.length === 0) {
      toast.error("Lütfen en az bir ruh hali seçin.");
      return;
    }

    setLoading(true);
    const docRef = doc(db, "moodEntries", todayDateStr);

    try {
      // mood -> moods olarak güncelle, eski 'mood' alanını kaldırabiliriz (isteğe bağlı)
      await setDoc(docRef, {
        moods: selectedMoods, // Artık bir dizi kaydediyoruz
        energy: energyLevel,
        notes: notes.trim(),
        date: todayDateStr,
        updatedAt: serverTimestamp()
        // mood: deleteField() // Eski alanı silmek isterseniz (import { deleteField } from "firebase/firestore";)
      }, { merge: true }); // merge:true önemli, diğer alanları korur

      toast.success("Ruh hali kaydınız güncellendi!");
    } catch (err) {
      console.error("Firestore'a yazma hatası (Ruh Hali):", err);
      toast.error("Kayıt güncellenirken bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
      return <div className="text-center p-4 text-foreground/70">Günün kaydı yükleniyor...</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="mb-8 p-6 rounded-lg bg-white/20 backdrop-blur-lg text-white space-y-6">
      <h2 className="text-2xl font-semibold text-white">Bugünkü Ruh Hali & Enerji</h2>

      {/* Ruh Hali Seçici */}
      <div>
        <label className="block text-sm font-medium text-white/80 mb-2">
          Bugün nasıl hissediyorsun? (Birden fazla seçebilirsin) <span className="text-red-400">*</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {moodOptions.map(mood => (
            <button
              key={mood}
              type="button"
              // onClick: setSelectedMood -> handleMoodToggle
              onClick={() => handleMoodToggle(mood)}
              // className: selectedMood === mood -> selectedMoods.includes(mood)
              className={`px-4 py-2 border rounded-md text-sm font-medium transition-colors duration-150 ease-in-out ${
                selectedMoods.includes(mood) // Kontrolü dizi üzerinden yap
                  ? 'bg-accent text-accent-foreground border-accent shadow-sm'
                  : 'bg-black/20 border-white/30 text-white/80 hover:bg-black/40 hover:text-white hover:border-white/50'
              }`}
              disabled={loading}
            >
              {mood}
            </button>
          ))}
        </div>
      </div>

      {/* Enerji Seviyesi Slider */}
      <div>
        <label htmlFor="energyLevel" className="block text-sm font-medium text-white/80 mb-1">
          Enerji Seviyen (1 - 10)
        </label>
        <div className="flex items-center gap-4">
          <input
            id="energyLevel"
            type="range"
            min="1"
            max="10"
            step="1"
            value={energyLevel}
            onChange={(e) => setEnergyLevel(parseInt(e.target.value, 10))}
            className="w-full h-2 bg-black/30 rounded-lg appearance-none cursor-pointer accent-accent"
            disabled={loading}
          />
          <span className="font-semibold text-lg w-8 text-right text-white">{energyLevel}</span>
        </div>
      </div>

      {/* Açıklama Alanı */}
      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-white/80 mb-1">
          Bugünkü mental durumunun nedeni ne? (Opsiyonel)
        </label>
        <textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="w-full p-2 bg-black/20 border border-white/30 rounded text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition resize-y"
          placeholder="Kısaca not alabilirsin..."
          disabled={loading}
        />
      </div>

      {/* Submit Button */}
      <div className="text-right">
        <button
          type="submit"
          disabled={loading || selectedMoods.length === 0} // Butonu seçim yoksa da disable et
          className="w-full bg-[#F72585] hover:bg-[#E01B74] text-white font-semibold text-lg py-4 px-8 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#F72585] focus:ring-offset-white/20 disabled:opacity-70 disabled:cursor-not-allowed transition duration-150 ease-in-out"
        >
          {loading ? 'Kaydediliyor...' : 'Günü Kaydet/Güncelle'}
        </button>
      </div>
    </form>
  );
};

export default AddMoodEntryForm; 
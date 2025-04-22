"use client";

import React, { useState } from 'react';
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from '@/lib/firebase';
import { toast } from 'react-hot-toast';

const AddIdeaForm = () => {
  const [ideaText, setIdeaText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ideaText.trim()) {
      toast.error('Fikir boş olamaz.');
      return;
    }
    if (ideaText.length > 1000) { // Örnek bir karakter limiti
      toast.error('Fikir en fazla 1000 karakter olabilir.');
      return;
    }

    setIsSubmitting(true);

    try {
      await addDoc(collection(db, 'ideas'), {
        text: ideaText.trim(),
        createdAt: serverTimestamp(),
        priority: 'Orta' // Varsayılan öncelik
      });
      setIdeaText(''); // Formu temizle
      toast.success('Fikir başarıyla eklendi!');
    } catch (err) {
      console.error("Firestore yazma hatası (addDoc - idea):", err);
      toast.error('Fikir eklenirken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mb-8 p-6 rounded-lg bg-white/20 backdrop-blur-lg text-white">
      <h2 className="text-xl font-semibold mb-4 text-white">Yeni Fikir Ekle</h2>
      <textarea
        value={ideaText}
        onChange={(e) => {
          setIdeaText(e.target.value);
        }}
        placeholder="Aklınızdaki fikri buraya yazın..."
        className="w-full p-3 bg-black/20 border border-white/30 rounded text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition duration-150 ease-in-out mb-4 h-24 resize-none"
        rows={3}
        maxLength={1000}
        disabled={isSubmitting}
      />
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-[#F72585] hover:bg-[#E01B74] text-white font-semibold text-lg py-4 px-8 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#F72585] focus:ring-offset-white/20 disabled:opacity-70 disabled:cursor-not-allowed transition duration-150 ease-in-out"
      >
        {isSubmitting ? 'Ekleniyor...' : 'Fikri Ekle'}
      </button>
    </form>
  );
};

export default AddIdeaForm; 
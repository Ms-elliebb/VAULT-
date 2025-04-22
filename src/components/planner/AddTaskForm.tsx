"use client"; // Bu satır önemli, çünkü useState ve olay yöneticileri kullanacağız

import React, { useState } from 'react';
import { collection, addDoc, serverTimestamp, Timestamp } from "firebase/firestore";
import { db } from '@/lib/firebase'; // Firebase yapılandırmamızı import ediyoruz
import { toast } from 'react-hot-toast';

const taskTypes = ['Günlük', 'Haftalık', 'Aylık'];

const AddTaskForm = () => {
  const [taskText, setTaskText] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCheckboxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = event.target;
    setSelectedTypes(prev =>
      checked ? [...prev, value] : prev.filter(type => type !== value)
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskText.trim()) {
      toast.error('Görev metni boş olamaz.');
      return;
    }
    if (selectedTypes.length === 0) {
        toast.error('Lütfen en az bir görev türü seçin (Günlük, Haftalık, Aylık).');
        return;
    }

    let dueDateTimestamp: Timestamp | null = null;
    if (dueDate) {
      try {
        const date = new Date(dueDate);
        if (isNaN(date.getTime())) {
          throw new Error("Geçersiz tarih");
        }
        dueDateTimestamp = Timestamp.fromDate(date);
      } catch (error) {
        console.error("Tarih çevirme hatası:", error);
        toast.error("Geçersiz bitiş tarihi formatı.");
        return;
      }
    }

    setIsSubmitting(true);

    try {
      await addDoc(collection(db, 'tasks'), {
        text: taskText.trim(),
        completed: false,
        createdAt: serverTimestamp(),
        types: selectedTypes,
        dueDate: dueDateTimestamp,
        completedAt: null
      });
      setTaskText('');
      setSelectedTypes([]);
      setDueDate('');
      toast.success('Görev başarıyla eklendi!');
    } catch (err) {
      console.error("Firestore yazma hatası (addTask):", err);
      toast.error('Görev eklenirken bir hata oluştu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mb-8 p-6 rounded-lg bg-white/20 backdrop-blur-lg text-white">
      <h2 className="text-xl font-semibold mb-4 text-white">Yeni Görev Ekle</h2>
      <textarea
        value={taskText}
        onChange={(e) => setTaskText(e.target.value)}
        placeholder="Yapılacak görevi yazın..."
        className="w-full p-3 bg-black/20 border border-white/30 rounded text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition duration-150 ease-in-out mb-4 resize-y min-h-[60px]"
        rows={2}
        disabled={isSubmitting}
      />
      <div className="mb-4">
        <label className="block text-sm font-medium text-white/80 mb-2">Görev Türü (Bir veya daha fazla seçin):</label>
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          {taskTypes.map((type) => (
            <label key={type} className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                value={type}
                checked={selectedTypes.includes(type)}
                onChange={handleCheckboxChange}
                disabled={isSubmitting}
                className="rounded text-primary focus:ring-primary/50 h-4 w-4 border-white/50 bg-black/20"
              />
              <span className="text-sm text-white">{type}</span>
            </label>
          ))}
        </div>
      </div>
      <div className="mb-4">
        <label htmlFor="dueDate" className="block text-sm font-medium text-white/80 mb-1">
          Bitiş Tarihi (Opsiyonel)
        </label>
        <input
          id="dueDate"
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="w-full p-2 bg-black/20 border border-white/30 rounded text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition duration-150 ease-in-out"
          disabled={isSubmitting}
        />
      </div>
      <button
        type="submit"
        disabled={isSubmitting || !taskText.trim() || selectedTypes.length === 0}
        className="w-full bg-[#F72585] hover:bg-[#E01B74] text-white font-semibold text-lg py-4 px-8 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#F72585] focus:ring-offset-white/20 disabled:opacity-70 disabled:cursor-not-allowed transition duration-150 ease-in-out"
      >
        {isSubmitting ? 'Ekleniyor...' : 'Görevi Ekle'}
      </button>
    </form>
  );
};

export default AddTaskForm; 
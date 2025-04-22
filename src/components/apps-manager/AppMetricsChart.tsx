"use client";

import React, { useState, useEffect } from 'react';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  Timestamp
} from "firebase/firestore";
import { db } from '@/lib/firebase';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

interface AppMetricsChartProps {
  appId: string;
}

// Firestore'dan gelen veri
interface MetricData {
  metricTimestamp: Timestamp;
  userCount: number;
  monthlyRevenue: number;
}

// Grafik için işlenmiş veri noktası
interface ChartDataPoint {
  date: string; // YYYY-MM formatında
  Kullanıcılar?: number;
  Kazanç?: number;
}

// Yardımcı: Timestamp'ı YYYY-MM formatına çevir
const formatTimestampToYearMonth = (timestamp: Timestamp): string => {
  const date = timestamp.toDate();
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Ay 0-11 arası olduğu için +1
  return `${year}-${month}`;
};

const AppMetricsChart: React.FC<AppMetricsChartProps> = ({ appId }) => {
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!appId) return; // appId yoksa işlem yapma

    setLoading(true);
    setError(null);

    const metricsCollectionRef = collection(db, 'apps', appId, 'metrics');
    const q = query(metricsCollectionRef, orderBy("metricTimestamp", "asc")); // Tarihe göre artan sırala

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const processedData: ChartDataPoint[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data() as MetricData;
        // Timestamp ve diğer alanların varlığını kontrol et
        if (data.metricTimestamp) {
            processedData.push({
              date: formatTimestampToYearMonth(data.metricTimestamp),
              // Değerler null/undefined ise 0 kullan
              Kullanıcılar: data.userCount ?? 0,
              Kazanç: data.monthlyRevenue ?? 0,
            });
        }
      });
      
      // Aynı aya ait verileri birleştirmek veya sonuncuyu almak yerine şimdilik hepsini listeliyoruz.
      // Daha gelişmiş bir grafikte aynı aya ait veriler ortalama veya toplam alınabilir.
      setChartData(processedData);
      setLoading(false);
    }, (err) => {
      console.error("Firestore okuma hatası (metrics):", err);
      setError("Grafik verileri yüklenirken bir hata oluştu.");
      setLoading(false);
    });

    return () => unsubscribe(); // Cleanup listener on component unmount
  }, [appId]);

  if (loading) {
    return <div className="text-center py-6 text-foreground/50">Grafik yükleniyor...</div>;
  }

  if (error) {
    return <div className="text-center py-6 text-red-500">{error}</div>;
  }

  if (chartData.length === 0) {
    return <div className="text-center py-6 text-foreground/50">Gösterilecek grafik verisi bulunmuyor.</div>;
  }

  // Renkleri tema renklerimizle eşleştirelim
  const userColor = "#facc15"; // accent (Keep this yellow-ish for users)
  const revenueColor = "#60A5FA"; // accent (Use the blue accent for revenue)

  return (
    /* Apply frosted glass: remove border, bg-background, shadow. Add bg-white/20, backdrop-blur-lg, text-white */
    <div className="mt-8 mb-8 p-6 rounded-lg bg-white/20 backdrop-blur-lg text-white">
      <h3 className="text-lg font-semibold mb-4 text-white">Metrik Geçmişi</h3>
      {/* ResponsiveContainer grafiğin kapsayıcısına uyum sağlamasını sağlar */}
      <ResponsiveContainer width="100%" height={300}>
         {/* Basit bir AreaChart kullanalım */}
         <AreaChart
           data={chartData}
           margin={{
             top: 10,
             right: 30,
             left: 0,
             bottom: 0,
           }}
         >
           <defs>
             <linearGradient id="colorUser" x1="0" y1="0" x2="0" y2="1">
               <stop offset="5%" stopColor={userColor} stopOpacity={0.8}/>
               <stop offset="95%" stopColor={userColor} stopOpacity={0}/>
             </linearGradient>
             <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
               <stop offset="5%" stopColor={revenueColor} stopOpacity={0.8}/>
               <stop offset="95%" stopColor={revenueColor} stopOpacity={0}/>
             </linearGradient>
           </defs>
           <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} stroke="#FFFFFF" />
           <XAxis dataKey="date" fontSize={12} tick={{ fill: '#FFFFFF', opacity: 0.6 }} />
           {/* İki ayrı Y ekseni tanımlayalım */}
           <YAxis yAxisId="left" label={{ value: 'Kullanıcılar', angle: -90, position: 'insideLeft', fill: '#FFFFFF', opacity: 0.8, fontSize: 12 }} fontSize={12} tick={{ fill: userColor }} />
           <YAxis yAxisId="right" orientation="right" label={{ value: 'Kazanç (₺)', angle: 90, position: 'insideRight', fill: '#FFFFFF', opacity: 0.8, fontSize: 12 }} fontSize={12} tick={{ fill: revenueColor }} />
           <Tooltip 
              /* Adjust tooltip style */
             contentStyle={{ backgroundColor: 'rgba(0, 0, 0, 0.7)', border: '1px solid rgba(255, 255, 255, 0.3)', borderRadius: '4px', fontSize: '12px'}} 
             itemStyle={{ color: '#FFFFFF'}} 
             labelStyle={{ color: '#FFFFFF'}} // Label color
           />
           <Legend wrapperStyle={{ fontSize: '12px', color: '#FFFFFF' }} />
           {/* Use gradient fills for areas */}
           <Area yAxisId="left" type="monotone" dataKey="Kullanıcılar" stackId="1" stroke={userColor} fillOpacity={1} fill="url(#colorUser)" name="Kullanıcı Sayısı" />
           <Area yAxisId="right" type="monotone" dataKey="Kazanç" stackId="2" stroke={revenueColor} fillOpacity={1} fill="url(#colorRevenue)" name="Aylık Kazanç (TRY)"/>
         </AreaChart>
       </ResponsiveContainer>
    </div>
  );
};

export default AppMetricsChart; 
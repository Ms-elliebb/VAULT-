import Image from "next/image";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center p-4">
      <h1 className="text-4xl font-bold mb-4 text-gray-800">Hayat Kontrol Merkezi Açıldı</h1>
      <p className="text-lg text-gray-600 mb-8 leading-relaxed">
        Her şey karmakarışık olabilir. Ama burada sırayla canını yakacağız.
      </p>
      {/* İsteğe bağlı olarak buraya daha fazla içerik veya bileşen eklenebilir */}
    </div>
  );
}

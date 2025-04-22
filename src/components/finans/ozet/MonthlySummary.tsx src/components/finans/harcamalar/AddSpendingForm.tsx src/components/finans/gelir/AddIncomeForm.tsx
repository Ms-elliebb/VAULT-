  return (
    /* Apply frosted glass: remove border, bg-secondary, shadow. Add bg-white/20, backdrop-blur-lg, text-white */
    <div className="mb-8 p-6 rounded-lg bg-white/20 backdrop-blur-lg text-white">
      <h2 className="text-2xl font-semibold mb-5 text-white">Aylık Özet</h2>

      {/* Ay Seçici (Adjust styles) */}
      <div className="mb-6">
        <label htmlFor="summaryMonth" className="block text-sm font-medium text-white/80 mb-1">
          Özet Ayı
        </label>
        <input
          id="summaryMonth"
          type="month"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          /* Adjust input style for frosted glass */
          className="p-2 bg-black/20 border border-white/30 rounded text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition appearance-none"
          max={getCurrentYearMonth()}
        />
      </div>

      {/* Özet Bilgileri (Adjust text/card styles) */}
      {loading && <div className="text-center py-4 text-white/70">Özet hesaplanıyor...</div>}
      {error && <div className="text-center py-4 text-red-400 bg-red-900/30 rounded p-2">{error}</div>}
      {summaryData && !loading && (
        <div className="space-y-6">
           {/* Ana Finansal Durum (Adjust card styles) */}
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              {/* Apply frosted glass to inner cards (lighter shade) */}
              <div className="p-4 rounded-lg bg-white/10 backdrop-blur-md">
                 <p className="text-sm font-medium text-white/70 uppercase tracking-wide">Toplam Gelir</p>
                 <p className="text-2xl font-bold text-green-400 mt-1">{formatCurrency(summaryData.totalIncome)}</p> {/* Adjusted success color */}
              </div>
               <div className="p-4 rounded-lg bg-white/10 backdrop-blur-md">
                 <p className="text-sm font-medium text-white/70 uppercase tracking-wide">Toplam Harcama</p>
                 <p className="text-2xl font-bold text-red-400 mt-1">{formatCurrency(summaryData.totalSpending)}</p> {/* Adjusted destructive color */}
              </div>
               <div className="p-4 rounded-lg bg-white/10 backdrop-blur-md">
                 <p className={`text-sm font-medium text-white/70 uppercase tracking-wide`}>Net Bakiye</p>
                 <p className={`text-2xl font-bold mt-1 ${summaryData.netBalance >= 0 ? 'text-green-400' : 'text-red-400'}`}>{formatCurrency(summaryData.netBalance)}</p> {/* Adjusted colors */}
              </div>
           </div>

           {/* Harcama Kategorileri Dağılımı (Adjust list item styles) */}
           <div>
             <h4 className="text-lg font-semibold mb-3 text-white">Harcama Dağılımı</h4>
              {sortedCategories.length > 0 ? (
                 <ul className="space-y-2">
                    {sortedCategories.map(({ category, amount, percentage }) => (
                        /* Apply frosted glass to list items */
                        <li key={category} className="flex justify-between items-center text-sm p-2 bg-black/20 rounded">
                           <span className="text-white/80">{category}</span>
                            <span className="font-medium text-white">{formatCurrency(amount)}
                              <span className="text-xs text-white/60 ml-2">({percentage.toFixed(1)}%)</span>
                            </span>
                        </li>
                    ))}
                 </ul>
              ) : (
                  <p className="text-sm text-white/70">Bu ay için harcama kaydı bulunamadı.</p>
              )}
           </div>
        </div>
      )}
    </div>
  );
}; 
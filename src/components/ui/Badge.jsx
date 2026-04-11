'use client'

const Badge = ({ value, type }) => {
  // --- Styling untuk Tipe STATUS ---
  if (type.toLowerCase() === 'status') {
    let colors = 'bg-gray-600 text-gray-300'

    if (value === 'Selesai') colors = 'bg-green-500 text-white'
    else if (value === 'Sedang Dikerjakan') colors = 'bg-yellow-500 text-white'
    else if (value === 'Buntu') colors = 'bg-red-500 text-white'
    else if (value === 'Belum Mulai') colors = 'bg-gray-500 text-white'

    return (
      <div className={`flex items-center justify-center w-full h-full text-xs font-bold ${colors}`}>{value || ''}</div>
    )
  }

  // --- Styling untuk Tipe PRIORITAS ---
  if (type.toLowerCase() === 'prioritas') {
    let colors = 'text-gray-400 border border-gray-600'

    if (value === 'Tinggi') colors = 'text-purple-400 border border-purple-800 bg-purple-500/10'
    else if (value === 'Medium') colors = 'text-sky-400 border border-sky-800 bg-sky-500/10'
    else if (value === 'Rendah') colors = 'text-green-400 border border-green-800 bg-green-500/10'

    return (
      <div className={`flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-medium ${colors}`}>
        {value || ''}
      </div>
    )
  }

  // Fallback untuk tipe lain
  return <span>{value || ''}</span>
}

export default Badge

interface OdontogramProps {
  selectedTeeth: number[];
  onTeethSelect: (teeth: number[]) => void;
  treatedTeeth?: number[];
}

export default function Odontogram({ selectedTeeth, onTeethSelect, treatedTeeth = [] }: OdontogramProps) {
  // Adult teeth numbering (FDI system)
  const upperTeeth = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
  const lowerTeeth = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];

  const toggleTooth = (toothNumber: number) => {
    const newSelection = selectedTeeth.includes(toothNumber)
      ? selectedTeeth.filter(t => t !== toothNumber)
      : [...selectedTeeth, toothNumber];
    
    onTeethSelect(newSelection);
  };

  const getToothClass = (toothNumber: number) => {
    let baseClass = "w-8 h-8 border-2 rounded-lg flex items-center justify-center text-xs font-bold cursor-pointer transition-all hover:scale-105 ";
    
    if (selectedTeeth.includes(toothNumber)) {
      baseClass += "bg-blue-600 text-white border-blue-600 ";
    } else if (treatedTeeth.includes(toothNumber)) {
      baseClass += "bg-green-100 text-green-800 border-green-300 ";
    } else {
      baseClass += "bg-white text-gray-700 border-gray-300 hover:border-blue-400 ";
    }
    
    return baseClass;
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h4 className="text-sm font-medium text-gray-700 mb-4">Odontograma - Sistema FDI</h4>
        
        {/* Upper Teeth */}
        <div className="mb-4">
          <div className="text-xs text-gray-500 mb-2">Arcada Superior</div>
          <div className="flex justify-center space-x-1">
            {upperTeeth.map((tooth) => (
              <button
                key={tooth}
                type="button"
                onClick={() => toggleTooth(tooth)}
                className={getToothClass(tooth)}
                title={`Dente ${tooth}`}
              >
                {tooth}
              </button>
            ))}
          </div>
        </div>

        {/* Lower Teeth */}
        <div>
          <div className="text-xs text-gray-500 mb-2">Arcada Inferior</div>
          <div className="flex justify-center space-x-1">
            {lowerTeeth.map((tooth) => (
              <button
                key={tooth}
                type="button"
                onClick={() => toggleTooth(tooth)}
                className={getToothClass(tooth)}
                title={`Dente ${tooth}`}
              >
                {tooth}
              </button>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex justify-center space-x-6 mt-4 text-xs">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-white border border-gray-300 rounded"></div>
            <span className="text-gray-600">Normal</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-blue-600 rounded"></div>
            <span className="text-gray-600">Selecionado</span>
          </div>
          {treatedTeeth.length > 0 && (
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-green-100 border border-green-300 rounded"></div>
              <span className="text-gray-600">Com tratamento</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
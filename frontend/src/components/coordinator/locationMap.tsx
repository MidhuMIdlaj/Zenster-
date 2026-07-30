export default function LocationMap() {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 h-full">
        <div className="mb-4">
          <h3 className="text-lg font-bold">User Locations</h3>
          <p className="text-sm text-gray-500">Real-time view of active users</p>
        </div>
        <div className="h-64 bg-indigo-50 rounded-lg relative overflow-hidden">
          <div className="w-full h-full bg-gradient-to-br from-indigo-200 via-cyan-100 to-slate-100" />
          
          {/* Animated Markers */}
          <div className="absolute top-1/4 left-1/4 flex flex-col items-center">
            <div className="animate-ping-slow absolute w-8 h-8 bg-indigo-500 rounded-full opacity-30"></div>
            <div className="relative w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
              8
            </div>
            <div className="mt-1 bg-white px-2 py-1 rounded shadow-md text-xs">New York</div>
          </div>
          
          <div className="absolute bottom-1/3 right-1/3 flex flex-col items-center">
            <div className="animate-ping-slow absolute w-8 h-8 bg-indigo-500 rounded-full opacity-30"></div>
            <div className="relative w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
              12
            </div>
            <div className="mt-1 bg-white px-2 py-1 rounded shadow-md text-xs">London</div>
          </div>
          
          <div className="absolute top-1/2 left-1/2 flex flex-col items-center">
            <div className="animate-ping-slow absolute w-8 h-8 bg-indigo-500 rounded-full opacity-30"></div>
            <div className="relative w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
              5
            </div>
            <div className="mt-1 bg-white px-2 py-1 rounded shadow-md text-xs">Paris</div>
          </div>
        </div>
      </div>
    );
  }
export default function Loader({
    text = "Loading QBO Data...",
    subText = "Please wait, magic in progress ✨",
}) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
            <div className="flex flex-col items-center gap-6">

                {/* Animated Rings */}
                <div className="relative w-20 h-20">
                    <div className="absolute inset-0 rounded-full border-4 border-blue-200"></div>
                    <div className="absolute inset-0 rounded-full border-4 border-t-blue-600 border-r-transparent border-b-transparent animate-spin"></div>
                </div>

                {/* Main Text */}
                <h2 className="text-xl font-bold text-gray-800 tracking-wide">
                    {text}
                </h2>

                {/* Sub Text */}
                <p className="text-sm text-gray-500 animate-pulse text-center">
                    {subText}
                </p>
            </div>
        </div>
    );
}


export default function ServicesSection() {
  const specialties = [
    "Orthodonti",
    "Prosthodonti",
    "Dental Implan",
    "Pedodonti",
    "Endodonti",
    "Minor Surgery",
  ];

  return (
    <section id="services" className="bg-[#f0efed] py-20 lg:py-28">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
        {/* Section Title */}
        <h2
          className="text-5xl lg:text-7xl font-medium tracking-tight mb-10"
          style={{ fontFamily: "var(--font-playfair)" }}
        >
          Our Service
        </h2>

        {/* Main Service Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Basic Dental Care */}
          <div className="bg-[#e8e7e4] rounded-2xl p-8 relative overflow-hidden min-h-[280px]">
            <h3
              className="text-2xl lg:text-3xl font-bold text-black mb-6"
              style={{ fontFamily: "var(--font-playfair)" }}
            >
              Basic Dental Care
            </h3>
            <ul className="space-y-1.5 text-sm text-gray-700">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-gray-700 rounded-full" />
                Scaling
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-gray-700 rounded-full" />
                Tambal Gigi
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-gray-700 rounded-full" />
                Cabut Gigi
              </li>
            </ul>
            {/* Tool image */}
            <div className="absolute right-4 top-4 w-32 h-48 lg:w-40 lg:h-56">
              <img
                src="/dental-tool.jpg"
                alt="Dental tool"
                className="w-full h-full object-contain"
              />
            </div>
          </div>

          {/* Aesthetic Care */}
          <div className="bg-[#e8e7e4] rounded-2xl p-8 relative overflow-hidden min-h-[280px]">
            <h3
              className="text-2xl lg:text-3xl font-medium text-gray-500 mb-6"
              style={{ fontFamily: "var(--font-playfair)" }}
            >
              Aesthetic Care
            </h3>
            <ul className="space-y-1.5 text-sm text-gray-700">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-gray-700 rounded-full" />
                Dental Whitening
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-gray-700 rounded-full" />
                Veneer
              </li>
            </ul>
            {/* Tooth image */}
            <div className="absolute right-2 top-2 w-36 h-48 lg:w-44 lg:h-56">
              <img
                src="/tooth-3d.jpg"
                alt="3D Tooth"
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        </div>

        {/* Specialty Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {specialties.map((specialty) => (
            <div
              key={specialty}
              className="bg-[#e8e7e4] rounded-2xl py-8 px-6 flex items-center justify-center text-center hover:bg-[#dddcd9] transition-colors cursor-pointer"
            >
              <span
                className="text-xl lg:text-2xl font-medium text-gray-500"
                style={{ fontFamily: "var(--font-playfair)" }}
              >
                {specialty}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

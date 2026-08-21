import { ArrowUpRight } from "lucide-react";

export default function AboutSection() {
  return (
    <section id="about" className="bg-[#f0efed] py-20 lg:py-28">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
        {/* Section Title */}
        <h2
          className="text-5xl lg:text-7xl font-medium tracking-tight mb-10"
          style={{ fontFamily: "var(--font-playfair)" }}
        >
          About
        </h2>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Mission Card */}
            <div className="bg-[#e8e7e4] rounded-2xl p-8 lg:p-10">
              <p className="text-sm text-gray-500 tracking-wide uppercase mb-4">
                Our Mission
              </p>
              <h3
                className="text-3xl lg:text-4xl font-medium leading-snug tracking-tight"
                style={{ fontFamily: "var(--font-playfair)" }}
              >
                Help you achieve a{" "}
                <span className="text-teal-600">
                  healthy, confident smile
                </span>{" "}
                that lasts a lifetime
              </h3>
              <p className="text-right text-sm text-gray-500 mt-6">
                — CEO Happy
              </p>
            </div>

            {/* Feature Cards */}
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-[#e8e7e4] rounded-2xl p-6 lg:p-8 flex flex-col justify-between min-h-[180px]">
                <ArrowUpRight className="w-8 h-8 text-gray-700 self-end" />
                <h4
                  className="text-xl lg:text-2xl font-medium mt-auto"
                  style={{ fontFamily: "var(--font-playfair)" }}
                >
                  Skilled
                  <br />
                  Dentists
                </h4>
              </div>
              <div className="bg-[#e8e7e4] rounded-2xl p-6 lg:p-8 flex flex-col justify-between min-h-[180px]">
                <ArrowUpRight className="w-8 h-8 text-gray-700 self-end" />
                <h4
                  className="text-xl lg:text-2xl font-medium mt-auto"
                  style={{ fontFamily: "var(--font-playfair)" }}
                >
                  Comfortable
                  <br />
                  Environment
                </h4>
              </div>
            </div>
          </div>

          {/* Right Column - Image + Gallery */}
          <div className="space-y-6">
            {/* Main Image */}
            <div className="rounded-2xl overflow-hidden h-[350px] lg:h-[400px]">
              <img
                src="/dental-equipment.jpg"
                alt="Dental clinic equipment"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Gallery Row */}
            <div className="flex items-center gap-4">
              <p className="text-xs font-semibold tracking-[0.15em] uppercase text-gray-500 shrink-0">
                OUR GALLERY:
              </p>
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="w-14 h-14 rounded-full border-2 border-white overflow-hidden"
                  >
                    <img
                      src="/dental-equipment.jpg"
                      alt={`Gallery ${i}`}
                      className="w-full h-full object-cover"
                      style={{
                        objectPosition: `${i * 25}% center`,
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

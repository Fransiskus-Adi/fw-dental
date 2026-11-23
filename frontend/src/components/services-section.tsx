import Image from "next/image";
import { ArrowRight } from "lucide-react";

const careGroups = [
  { title: "Basic Dental Care", treatments: ["Scaling", "Tambal Gigi", "Cabut Gigi"] },
  { title: "Aesthetic Care", treatments: ["Dental Whitening", "Veneer"] },
];

const specialties = [
  "Orthodonti",
  "Prosthodonti",
  "Dental Implan",
  "Pedodonti",
  "Endodonti",
  "Minor Surgery",
];

export default function ServicesSection() {
  return (
    <section
      id="services"
      aria-labelledby="services-heading"
      className="scroll-mt-24 bg-[#fbfaf7] py-16 text-stone-950 sm:py-20 lg:py-28"
    >
      <div className="mx-auto grid max-w-[1400px] gap-9 px-6 lg:grid-cols-2 lg:gap-16 lg:px-10 xl:gap-24">
        <div className="min-w-0 lg:col-start-2 lg:row-start-1 lg:py-4">
          <h2
            id="services-heading"
            className="mb-7 text-[clamp(2.375rem,4.8vw,4.25rem)] font-semibold leading-[1.05] tracking-[-0.045em] lg:mb-9"
          >
            Dental Services
          </h2>

          <div className="divide-y divide-stone-200 border-y border-stone-200">
            {careGroups.map(({ title, treatments }) => (
              <div key={title} className="py-4 sm:py-5">
                <h3 className="text-lg font-semibold tracking-tight sm:text-[1.375rem]">{title}</h3>
                <ul role="list" className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm leading-relaxed text-stone-700 sm:text-base">
                  {treatments.map((treatment) => (
                    <li key={treatment} className="flex items-center gap-2">
                      <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-teal-700" />
                      {treatment}
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            <div className="pb-3 pt-4 sm:pb-4 sm:pt-5">
              <h3 className="text-lg font-semibold tracking-tight sm:text-[1.375rem]">Specialty Care</h3>
              <ul role="list" className="mt-2 grid grid-cols-2 gap-x-4 text-sm text-stone-700 sm:gap-x-8 sm:text-base">
                {specialties.map((specialty) => (
                  <li key={specialty} className="border-b border-stone-200/80 py-2.5 last:border-b-0 nth-last-[2]:border-b-0">
                    {specialty}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <a
            href="#location"
            className="mt-7 inline-flex min-h-12 items-center gap-3 rounded-full bg-teal-700 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-teal-800 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-700"
          >
            Book an Appointment
            <ArrowRight aria-hidden="true" className="size-4 shrink-0" />
          </a>
        </div>

        <div className="relative aspect-[4/2.65] overflow-hidden rounded-2xl bg-stone-200 lg:col-start-1 lg:row-start-1 lg:aspect-auto lg:rounded-3xl">
          <Image
            src="/dental-equipment.jpg"
            alt="Dental treatment room with a patient chair and examination light"
            fill
            sizes="(min-width: 1400px) 612px, (min-width: 1024px) 46vw, 94vw"
            className="scale-105 object-cover object-[55%_50%]"
          />
        </div>
      </div>
    </section>
  );
}

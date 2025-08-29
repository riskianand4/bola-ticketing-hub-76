import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Ticket, Users } from "lucide-react";
import { Link } from "react-router-dom";
interface SlideData {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  ctaText: string;
  ctaLink: string;
  imgslide: string;
  stats?: {
    label: string;
    value: string;
  }[];
}
const slides: SlideData[] = [
  {
    id: 1,
    title: "LASKAR RENCONG",
    subtitle: "LANTAK LAJU!",
    description:
      "Dukung Persiraja Banda Aceh di Stadion Harapan Bangsa. Rasakan atmosfer luar biasa bersama SKULL!",
    ctaText: "Beli Tiket Sekarang",
    ctaLink: "/tickets",
    imgslide: "/bg/RonaldoSlide.png",
    stats: [
      {
        label: "Match",
        value: "15 Des",
      },
      {
        label: "Kick Off",
        value: "19:30",
      },
      {
        label: "Venue",
        value: "Harapan Bangsa",
      },
    ],
  },
  {
    id: 2,
    title: "PERSIRAJA STORE",
    subtitle: "Official Merchandise",
    description:
      "Koleksi jersey resmi, aksesoris, dan merchandise eksklusif Persiraja. Tunjukkan dukungan Anda!",
    ctaText: "Belanja Sekarang",
    ctaLink: "/shop",
    imgslide: "/bg/RonaldoSlide2.png",
    stats: [
      {
        label: "Jersey",
        value: "Rp 299K",
      },
      {
        label: "Scarf",
        value: "Rp 99K",
      },
      {
        label: "Free Shipping",
        value: "500K+",
      },
    ],
  },
  {
    id: 3,
    title: "SKULL COMMUNITY",
    subtitle: "Suporter Kutaraja Untuk Lantak Laju",
    description:
      "Bergabung dengan komunitas suporter terbesar Aceh. Bersama kita dukung Persiraja meraih prestasi!",
    ctaText: "Gabung Komunitas",
    ctaLink: "/about",
    imgslide: "/bg/RonaldoSlide3.png",
    stats: [
      {
        label: "Members",
        value: "50K+",
      },
      {
        label: "Since",
        value: "1957",
      },
      {
        label: "Spirit",
        value: "100%",
      },
    ],
  },
];
export function HeroSlider() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlay, setIsAutoPlay] = useState(true);
  useEffect(() => {
    if (!isAutoPlay) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [isAutoPlay]);
  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };
  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };
  const currentSlideData = slides[currentSlide];
  return (
    <section
      className="relative h-[78vh] lg:h-[100vh] overflow-hidden bg-cover bg-center bg-no-repeat "
      style={{
        backgroundImage: `url('/bg/football-field-bg.jpg')`,
      }}
      onMouseEnter={() => setIsAutoPlay(false)}
      onMouseLeave={() => setIsAutoPlay(true)}
    >
      <div className="absolute inset-0 bg-black/60" />

      <div className="relative h-full flex items-center">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center sm:mt-60 mt-20">
            <div className="text-white space-y-6 animate-fade-in z-10">
              <div className="space-y-2">
                <h1 className="text-2xl lg:text-6xl font-bold leading-tight">
                  {currentSlideData.title}
                </h1>
                <h2 className="text-xl lg:text-3xl font-semibold text-secondary">
                  {currentSlideData.subtitle}
                </h2>
              </div>

              <p className="text-md lg:text-xl text-gray-200 max-w-lg leading-relaxed">
                {currentSlideData.description}
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link to={currentSlideData.ctaLink}>
                  <Button
                    size="lg"
                    className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 text-md font-semibold"
                  >
                    <Ticket className="mr-2 h-5 w-5" />
                    {currentSlideData.ctaText}
                  </Button>
                </Link>
                <Link to="/about">
                  <Button
                    size="lg"
                    variant="outline"
                    className=" text-white hover:bg-gray-900  px-8 py-3 text-md font-semibold"
                  >
                    <Users className="mr-2 h-5 w-5" />
                    Tentang Kami
                  </Button>
                </Link>
              </div>
            </div>
            <div
              className=" pt-10 pointer-events-none absolute inset-0 z-0 opacity-20 flex justify-center lg:static lg:z-auto  lg:opacity-100 lg:pointer-events-auto lg:flex lg:justify-end lg:max-h-[900px] lg:mt-20 lg:mr-20"
            >
              <img src={currentSlideData.imgslide} alt="" className=" w-full h-full object-cover lg:w-auto lg:h-auto lg:max-w-full lg:object-contain" />
            </div>
          </div>
        </div>
      </div>
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex space-x-2">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`w-2 h-2 rounded-full transition-all duration-200 ${
              index === currentSlide
                ? "bg-white scale-125"
                : "bg-white/50 hover:bg-white/70"
            }`}
          />
        ))}
      </div>
    </section>
  );
}

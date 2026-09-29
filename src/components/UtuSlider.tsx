// Auto-scrolling marquee of UTU official website slider images (curated local copies).
// Optimized with translate3d GPU acceleration, async decoding, and layout dimension marks.
const slides = [
  "H_202609081645450868.jpg",
  "H_202609081645238813.jpg",
  "H_202609081645044436.jpg",
  "H_202609081644435059.jpg",
  "H_202609081642185536.jpg",
  "H_202609081641318250.jpg",
  "H_202609081855478633.jpg",
  "H_202608131137373101.jpg",
  "H_202608131132480272.jpg",
  "H_202608131130253056.jpg",
  "H_202608131127511313.jpg",
  "H_202608131124095202.jpg",
  "H_202608131121359095.jpg",
  "H_202608131119580179.jpg",
  "H_202608131118149856.jpg",
  "H_202608131114076536.jpg",
  "H_202608131110304783.jpg",
  "H_202401111500040399.jpg",
];

// Duplicate for seamless infinite loop
const track = [...slides, ...slides];

const UtuSlider = () => (
  <section className="py-10 overflow-hidden bg-background/50 contain-paint">
    <p className="text-center text-[10px] tracking-[0.25em] uppercase text-foreground/40 mb-6 font-medium">
      Veer Madho Singh Bhandari Uttarakhand Technical University
    </p>

    <div
      className="flex gap-4 w-max utu-slider-track"
      style={{
        animation: "utu-scroll 50s linear infinite",
        willChange: "transform",
        transform: "translate3d(0, 0, 0)",
        backfaceVisibility: "hidden",
      }}
      onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.animationPlayState = "paused")}
      onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.animationPlayState = "running")}
    >
      {track.map((fname, i) => (
        <div key={i} className="flex-shrink-0 w-64 h-44 rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-[transform,box-shadow] duration-200 ease-emil-out hover:-translate-y-1 bg-muted/20 cursor-pointer select-none">
          <img
            src={`/utu-slider/${fname}`}
            alt="UTU campus"
            width={256}
            height={176}
            decoding="async"
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-250 ease-emil-out will-change-transform hover:scale-105"
          />
        </div>
      ))}
    </div>

    <style>{`
      @keyframes utu-scroll {
        0%   { transform: translate3d(0, 0, 0); }
        100% { transform: translate3d(-50%, 0, 0); }
      }
      @media (prefers-reduced-motion: reduce) {
        .utu-slider-track {
          animation: none !important;
          transform: none !important;
        }
      }
    `}</style>
  </section>
);

export default UtuSlider;

import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { getAllGalleryImages } from "@/lib/galleryStore";
import { ArrowRight, Sparkles } from "lucide-react";
import DriftWall, { DriftWallItem } from "@/components/ui/DriftWall";

const HomeGallery = () => {
    const images = getAllGalleryImages();
    const driftItems: DriftWallItem[] = images.map((img) => ({
        image: img.image_url,
        title: img.title,
        href: "/gallery",
    }));

    return (
        <section className="pt-24 pb-16 relative overflow-hidden">
            <div className="container mx-auto px-4 mb-10">
                <div className="flex flex-col md:flex-row justify-between items-end gap-6">
                    <div className="max-w-2xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 backdrop-blur-md mb-3">
                            <Sparkles className="w-3.5 h-3.5 text-primary animate-pulse" />
                            <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                                Interactive Visual Stream
                            </span>
                        </div>
                        <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary via-purple-300 to-primary/60 bg-clip-text text-transparent">
                            Moments Captured
                        </h2>
                        <p className="text-lg sm:text-xl text-muted-foreground">
                            A dynamic 3D glimpse into life at TECHSHASTRA — from high-stakes hackathons to collaborative innovations. Hover over any tile to inspect.
                        </p>
                    </div>
                    <Link to="/gallery">
                        <Button size="lg" className="rounded-full group shadow-lg shadow-primary/20">
                            Explore Full Gallery ({images.length} Photos)
                            <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Full-width edge-to-edge seamless DriftWall */}
            <div className="w-full h-[520px] sm:h-[600px] md:h-[660px] bg-transparent relative overflow-hidden">
                <DriftWall
                    items={driftItems}
                    columns={8}
                    tileWidth={260}
                    tileHeight={165}
                    gap={20}
                    tilt={10}
                    turn={-6}
                    perspective={1200}
                    depth={80}
                    scale={1.35}
                    speed={36}
                    direction="up"
                    variance={0.4}
                    parallax={0.4}
                    lift={60}
                    fade={0}
                    dim={0.7}
                    overlayColor="hsl(var(--background) / 0.45)"
                />
            </div>
        </section>
    );
};

export default HomeGallery;

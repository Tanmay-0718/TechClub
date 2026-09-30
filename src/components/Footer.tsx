import { Linkedin, Instagram, Mail } from "lucide-react";
import { Link } from "react-router-dom";
import { openCookieSettings } from "@/components/CookieConsentBanner";

const Footer = () => {
  return (
    <footer className="relative border-t border-foreground/5 py-16">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-3 gap-12 mb-12">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <img src="/favicon.ico" alt="TECHSHASTRA Logo" className="w-8 h-8 object-contain" />
              <span className="font-heading text-lg tracking-[0.15em] font-light text-foreground">
                TECHSHASTRA
              </span>
            </div>
            <p className="text-sm font-light text-foreground/35 leading-relaxed">
              Innovate · Create · Dominate<br />
              The official technical club of UTU Dehradun.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-xs font-light tracking-widest uppercase text-foreground/30 mb-5">Quick Links</h3>
            <ul className="space-y-3 text-sm font-light">
              <li><Link to="/about" className="text-foreground/40 hover:text-foreground active:scale-95 transition-[color,transform] duration-150 ease-emil-out inline-block">About Us</Link></li>
              <li><Link to="/projects" className="text-foreground/40 hover:text-foreground active:scale-95 transition-[color,transform] duration-150 ease-emil-out inline-block">Projects</Link></li>
              <li><Link to="/events" className="text-foreground/40 hover:text-foreground active:scale-95 transition-[color,transform] duration-150 ease-emil-out inline-block">Events</Link></li>
              <li><a href="/#team" className="text-foreground/40 hover:text-foreground active:scale-95 transition-[color,transform] duration-150 ease-emil-out inline-block">Team</a></li>
              <li><Link to="/privacy" className="text-foreground/40 hover:text-foreground active:scale-95 transition-[color,transform] duration-150 ease-emil-out inline-block">Privacy & Cookies</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-xs font-light tracking-widest uppercase text-foreground/30 mb-5">Connect</h3>
            <div className="space-y-2 text-sm font-light text-foreground/35 mb-5">
              <p>Uttarakhand Technical University</p>
              <p>Dehradun, Uttarakhand</p>
            </div>
            <div className="flex gap-3">
              <a
                href="https://www.linkedin.com/company/tech-shastra/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-primary/8 flex items-center justify-center hover:bg-primary/15 active:scale-90 transition-[transform,background-color] duration-150 ease-emil-out"
              >
                <Linkedin className="w-4 h-4 text-foreground/40 group-hover:text-primary" />
              </a>
              <a
                href="https://www.instagram.com/techshastra_utu"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-primary/8 flex items-center justify-center hover:bg-primary/15 active:scale-90 transition-[transform,background-color] duration-150 ease-emil-out"
              >
                <Instagram className="w-4 h-4 text-foreground/40 group-hover:text-primary" />
              </a>
              <a
                href="mailto:vmsb.utu.ddn.2023@gmail.com"
                className="w-9 h-9 rounded-full bg-primary/8 flex items-center justify-center hover:bg-primary/15 active:scale-90 transition-[transform,background-color] duration-150 ease-emil-out"
              >
                <Mail className="w-4 h-4 text-foreground/40 group-hover:text-primary" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-8 border-t border-foreground/5 text-center space-y-4">
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs font-light text-foreground/45">
            <Link to="/privacy" className="hover:text-primary transition-colors">
              Privacy Policy
            </Link>
            <span className="text-foreground/20">·</span>
            <button
              type="button"
              onClick={openCookieSettings}
              className="hover:text-primary transition-colors cursor-pointer inline-flex items-center gap-1.5"
            >
              <span>Cookie Settings</span>
            </button>
            <span className="text-foreground/20">·</span>
            <Link to="/contact" className="hover:text-primary transition-colors">
              Support & Contact
            </Link>
          </div>
          <p className="text-[10px] tracking-[0.3em] uppercase text-foreground/20 font-light">
            Building Uttarakhand's next generation of technologists and founders.
          </p>
          <p className="text-xs font-light tracking-wider text-foreground/25">
            &copy; {new Date().getFullYear()} TECHSHASTRA. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

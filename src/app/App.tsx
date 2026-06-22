import { useState, useEffect } from "react"
import {
  Phone, MapPin, Clock, Menu, X,
  Wrench, Settings, Zap, Gauge, Shield, Wind,
  ArrowRight, Mail, CheckCircle, Plus, Pencil, Trash2, LogOut, Lock,
  Instagram, CreditCard,
} from "lucide-react"
import { motion, AnimatePresence } from "motion/react"
import logoImg from "@/imports/image-2.png"
import garageExteriorImg from "@/imports/image garage exterieur.png"
import garageInteriorImg from "@/imports/image garage interrieur voiture premier plan.png"
import serviceIciImg from "@/imports/affiche-services-ici.png"
import articleSelectionImg from "@/imports/image montran le garage de cedric.avif"
import articleOpeningImg from "@/imports/journal affichant cedric qui ouvre son nouveau garage.avif"
import articleEthanolImg from "@/imports/journal disans que le garage MAC Auto Moto convertie les moteurs a l'ethanols.avif"
import articleSolidarityImg from "@/imports/journal disant ungeste solidaire pour le festival des colporteur d'histoire.avif"
import { projectId, publicAnonKey } from "/utils/supabase/info"

type Page = "accueil" | "services" | "galerie" | "apropos" | "contact" | "admin"

interface Offer {
  id: string
  title: string
  description: string
  badge: string
  imageUrl: string
  validUntil: string
  createdAt?: string
}

interface HistoryEntry {
  id: string
  actor: string
  action: string
  target: string
  detail: string
  createdAt: string
}

const ADMIN_PASSWORD_HASH = "83a67118aac5c71d76ad49d6c6f2e48f9537a2c898a92897923d702bb5396c0f"
const ADMIN_HISTORY_KEY = "amc-admin-history"
const ADMIN_HISTORY_RETENTION_MS = 3 * 24 * 60 * 60 * 1000
const API = `https://${projectId}.supabase.co/functions/v1/make-server-be42ff6e`
const headers = { "Content-Type": "application/json", "Authorization": `Bearer ${publicAnonKey}` }

async function sha256(value: string) {
  const bytes = new TextEncoder().encode(value)
  const hash = await crypto.subtle.digest("SHA-256", bytes)
  return Array.from(new Uint8Array(hash), b => b.toString(16).padStart(2, "0")).join("")
}

interface SiteSettings {
  phone: string
  phone2: string
  email: string
  address: string
  city: string
  postalCode: string
  facebook: string
  instagram: string
  heroSubtitle: string
  aboutTitle: string
  aboutText1: string
  aboutText2: string
  aboutText3: string
  contactAdviceTitle: string
  contactAdviceText1: string
  contactAdviceText2: string
  hours: { day: string; hours: string }[]
}

function cleanupLocalHistory(entries: HistoryEntry[]) {
  const limit = Date.now() - ADMIN_HISTORY_RETENTION_MS
  return entries.filter(entry => new Date(entry.createdAt).getTime() >= limit)
}

function getLocalHistory() {
  try {
    const parsed = JSON.parse(localStorage.getItem(ADMIN_HISTORY_KEY) || "[]") as HistoryEntry[]
    const cleaned = cleanupLocalHistory(parsed)
    localStorage.setItem(ADMIN_HISTORY_KEY, JSON.stringify(cleaned))
    return cleaned
  } catch (_error) {
    return []
  }
}

const DEFAULT_SETTINGS: SiteSettings = {
  phone: "09 54 15 87 72",
  phone2: "07 66 05 55 89",
  email: "amcautomoto@gmail.com",
  address: "5 Chemin de Saizerelle",
  city: "Marbache",
  postalCode: "54820",
  facebook: "https://www.facebook.com/amcautomoto/?locale=fr_FR",
  instagram: "https://www.instagram.com/amcautomoto",
  heroSubtitle: "Entretien, réparation et diagnostic pour toutes marques. Un garage indépendant local, fiable et réactif.",
  aboutTitle: "Un garage de confiance depuis plus de 20 ans",
  aboutText1: "AMC Auto Moto est un garage indépendant implanté à Marbache, en Meurthe-et-Moselle. Spécialisé en mécanique automobile et motocycle, nous intervenons sur tous types de véhicules, toutes marques confondues.",
  aboutText2: "Notre équipe qualifiée met son savoir-faire au service des particuliers de Marbache, Pont-à-Mousson et des communes environnantes. Chaque intervention est réalisée avec soin, rigueur et transparence.",
  aboutText3: "Nous croyons qu'un bon garage, c'est avant tout une relation de confiance durable avec ses clients. C'est pourquoi nous privilégions la clarté sur les devis, la rapidité d'exécution et la qualité des pièces utilisées.",
  contactAdviceTitle: "Pour un devis, appelez avec les infos du véhicule",
  contactAdviceText1: "Préparez la marque, le modèle, l'année, la motorisation et le kilométrage.",
  contactAdviceText2: "Pour les pneus, notez la dimension indiquée sur le flanc du pneu.",
  hours: [
    { day: "Lundi – Vendredi", hours: "9h00 – 12h00 / 14h00 – 18h00" },
    { day: "Samedi", hours: "Fermé" },
    { day: "Dimanche", hours: "Fermé" },
  ],
}

const api = {
  getOffers: () => fetch(`${API}/offers`, { headers }).then(r => r.json()) as Promise<Offer[]>,
  createOffer: (data: Omit<Offer, "id" | "createdAt">, actor: string) =>
    fetch(`${API}/offers`, { method: "POST", headers, body: JSON.stringify({ ...data, actor }) }).then(r => r.json()) as Promise<Offer>,
  updateOffer: (id: string, data: Partial<Offer>, actor: string) =>
    fetch(`${API}/offers/${id}`, { method: "PUT", headers, body: JSON.stringify({ ...data, actor }) }).then(r => r.json()) as Promise<Offer>,
  deleteOffer: (id: string, actor: string) =>
    fetch(`${API}/offers/${id}`, { method: "DELETE", headers, body: JSON.stringify({ actor }) }).then(r => r.json()),
  getSettings: () => fetch(`${API}/settings`, { headers }).then(r => r.json()) as Promise<Partial<SiteSettings>>,
  saveSettings: (s: SiteSettings, actor: string) =>
    fetch(`${API}/settings`, { method: "PUT", headers, body: JSON.stringify({ settings: s, actor }) }).then(r => r.json()) as Promise<SiteSettings>,
  getHistory: () => fetch(`${API}/history`, { headers }).then(r => r.json()) as Promise<HistoryEntry[]>,
}

// --- Image URLs ---------------------------------------------------------------
const IMGS = {
  hero:     "https://images.unsplash.com/photo-1676018366904-c083ed678e60?w=1920&h=1080&fit=crop&auto=format",
  about:    "https://images.unsplash.com/photo-1632405862117-236585cfb757?w=1200&h=800&fit=crop&auto=format",
  tools:    "https://images.unsplash.com/photo-1570129476815-ba368ac77013?w=800&h=600&fit=crop&auto=format",
  workshop: "https://images.unsplash.com/photo-1560801124-4a95dc193b94?w=800&h=600&fit=crop&auto=format",
  car1:     "https://images.unsplash.com/photo-1570396005418-db78f32e2b29?w=800&h=600&fit=crop&auto=format",
  audi:     "https://images.unsplash.com/photo-1758793248636-da8268a0a423?w=800&h=600&fit=crop&auto=format",
  wheel:    "https://images.unsplash.com/photo-1761312833216-2eaee1a5b0aa?w=800&h=600&fit=crop&auto=format",
  building: "https://images.unsplash.com/photo-1572283046480-e990be92d301?w=800&h=600&fit=crop&auto=format",
}

// --- Animation helpers --------------------------------------------------------
const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] } },
}
const fadeIn = {
  hidden: { opacity: 0 },
  show:   { opacity: 1, transition: { duration: 0.7 } },
}
const stagger = (delay = 0.1) => ({
  hidden: {},
  show:   { transition: { staggerChildren: delay } },
})
const pageTransition = {
  initial:  { opacity: 0, y: 24 },
  animate:  { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
  exit:     { opacity: 0, y: -16, transition: { duration: 0.3 } },
}

// --- Data ---------------------------------------------------------------------
const NAV: { label: string; page: Page }[] = [
  { label: "Accueil",  page: "accueil" },
  { label: "Services", page: "services" },
  { label: "Offres",   page: "galerie" },
  { label: "À propos", page: "apropos" },
  { label: "Contact",  page: "contact" },
]

const SERVICES = [
  {
    icon: Settings,
    title: "Révision & Vidange",
    short: "Vidange dès 82€ TTC · Révision dès 133€ TTC. Filtres huile, habitacle, air, gasoil et bougies inclus.",
    price: "Dès 82€ TTC",
    details: ["Vidange : dès 82€ TTC", "Révision : dès 133€ TTC", "Filtres huile / air / habitacle / gasoil", "Remplacement bougies"],
    img: "https://images.unsplash.com/photo-1487754180451-c456f719a1fc?w=800&h=600&fit=crop&auto=format",
  },
  {
    icon: Gauge,
    title: "Pneus",
    short: "Montage dès 15€ TTC · Crevaison 25€ TTC (auto) · Moto dès 22,50€ TTC. Commande toutes dimensions.",
    price: "Dès 15€ TTC",
    details: ["Montage auto : dès 15€ TTC", "Crevaison : 25€ TTC", "Montage moto : dès 22,50€ TTC", "Commande toutes dimensions"],
    img: "https://images.unsplash.com/photo-1645445522156-9ac06bc7a767?w=800&h=600&fit=crop&auto=format",
  },
  {
    icon: Wind,
    title: "Climatisation",
    short: "Dès 29,90€ TTC. Bilan, recharge R134A et R1234YF, recherche de fuite, nettoyage et désinfection.",
    price: "Dès 29,90€ TTC",
    details: ["Bilan climatisation", "Recharge R134A / R1234YF", "Recharge + filtre habitacle + désinfection", "Recherche de fuite"],
    img: "https://images.unsplash.com/photo-1615906655593-ad0386982a0f?w=800&h=600&fit=crop&auto=format",
  },
  {
    icon: Zap,
    title: "Diagnostic Électronique",
    short: "Lecture de codes défauts OBD, analyse des capteurs, remise à zéro voyants. Toutes marques.",
    price: "Sur devis",
    details: ["Lecture codes défauts OBD", "Analyse capteurs", "Remise à zéro voyants", "Tests électroniques approfondis"],
    img: "https://images.unsplash.com/photo-1590363718520-6cc406cd0fd1?w=800&h=600&fit=crop&auto=format",
  },
  {
    icon: Wrench,
    title: "Mécanique Générale",
    short: "Distribution, embrayage, turbo, amortisseurs, batterie, injecteurs, freinage. Auto et moto.",
    price: "Sur devis",
    details: ["Distribution / embrayage", "Turbo / amortisseurs", "Batterie / injecteurs", "Freinage / suspension"],
    img: "https://images.unsplash.com/photo-1770656505767-32ed52b1a8ca?w=800&h=600&fit=crop&auto=format",
  },
  {
    icon: Shield,
    title: "Entretien Moto",
    short: "Vidange dès 90€ TTC (filtre huile, air, bougie) · Pneus dès 22,50€ TTC. Kit chaîne, freins, mécanique.",
    price: "Dès 90€ TTC",
    details: ["Vidange : dès 90€ TTC", "Pneus : dès 22,50€ TTC", "Kit chaîne / joint spy fourche", "Freinage / mécanique sur devis"],
    img: "https://images.unsplash.com/photo-1636761358757-0a616eb9e17e?w=800&h=600&fit=crop&auto=format",
  },
]

const GALLERY = [
  { src: IMGS.car1,     alt: "Véhicule en atelier",       ratio: "3/4" },
  { src: IMGS.workshop, alt: "Atelier AMC Auto Moto",      ratio: "4/3" },
  { src: IMGS.tools,    alt: "Outillage professionnel",    ratio: "4/3" },
  { src: IMGS.audi,     alt: "Véhicule en révision",       ratio: "4/3" },
  { src: IMGS.wheel,    alt: "Montage pneu",               ratio: "4/3" },
  { src: IMGS.hero,     alt: "Mécanicien au travail",      ratio: "16/9" },
  { src: IMGS.building, alt: "Extérieur du garage",        ratio: "4/3" },
  { src: IMGS.about,    alt: "Contrôle véhicule",          ratio: "3/4" },
]

const GARAGE_PHOTOS = [
  {
    src: garageExteriorImg,
    title: "Garage AMC Auto Moto à Marbache",
    text: "Un atelier local identifié, accessible et équipé pour accueillir voitures et motos.",
  },
  {
    src: garageInteriorImg,
    title: "Interventions en atelier",
    text: "Des véhicules pris en charge sur place, avec un environnement de travail propre et professionnel.",
  },
]

const PRESS_CLIPPINGS = [
  { src: articleOpeningImg, title: "Ouverture du garage", source: "Presse locale" },
  { src: articleSelectionImg, title: "Garage distingué", source: "Reconnaissance professionnelle" },
  { src: articleEthanolImg, title: "Conversion éthanol", source: "L'Est Républicain" },
  { src: articleSolidarityImg, title: "Action solidaire locale", source: "L'Est Républicain" },
  { src: serviceIciImg, title: "Carrosserie, pare-brise, climatisation", source: "Services complémentaires" },
]

// --- Navbar -------------------------------------------------------------------
function Navbar({ current, navigate, settings }: { current: Page; navigate: (p: Page) => void; settings: SiteSettings }) {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40)
    window.addEventListener("scroll", fn)
    return () => window.removeEventListener("scroll", fn)
  }, [])

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-[#0c0c0c]/96 backdrop-blur-md border-b border-white/8" : "bg-transparent"
      }`}
    >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <button
          onClick={() => navigate("accueil")}
            className="flex items-center gap-2 sm:gap-3 group min-w-0"
        >
          <img
            src={logoImg as string}
            alt="AMC Auto Moto"
            className="h-10 w-10 sm:h-12 sm:w-12 object-contain shrink-0"
          />
          <span className="font-heading text-white font-bold text-sm xl:text-base tracking-[0.12em] xl:tracking-[0.15em] uppercase hidden sm:block whitespace-nowrap">
            AMC <span className="text-[#c8102e]">Auto</span> Moto
          </span>
        </button>

        {/* Desktop links */}
        <div className="hidden lg:flex items-center gap-5 xl:gap-8">
          {NAV.map(({ label, page }) => (
            <button
              key={page}
              onClick={() => navigate(page)}
            className={`text-xs tracking-[0.14em] xl:tracking-[0.2em] uppercase font-medium transition-colors duration-200 ${
                current === page
                  ? "text-[#c8102e]"
                  : "text-white/60 hover:text-white"
              }`}
            >
              {label}
            </button>
          ))}
          <a
            href={`tel:${settings.phone.replace(/\s/g, "")}`}
            className="flex items-center gap-2 bg-[#c8102e] text-white px-4 xl:px-5 py-2.5 text-xs font-bold tracking-[0.16em] xl:tracking-[0.2em] uppercase hover:bg-[#a50d26] transition-colors duration-200"
          >
            <Phone size={13} />
            Appeler
          </a>
        </div>

        {/* Mobile toggle */}
        <button
          className="lg:hidden text-white p-2 -mr-2"
          onClick={() => setOpen(!open)}
          aria-label="Menu"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="lg:hidden bg-[#0c0c0c]/98 border-t border-white/8 px-6 pt-4 pb-6 flex flex-col gap-1">
          {NAV.map(({ label, page }) => (
            <button
              key={page}
              onClick={() => { navigate(page); setOpen(false) }}
              className={`text-left py-3 border-b border-white/5 text-sm tracking-[0.15em] uppercase font-medium ${
                current === page ? "text-[#c8102e]" : "text-white/60"
              }`}
            >
              {label}
            </button>
          ))}
          <a
            href={`tel:${settings.phone.replace(/\s/g, "")}`}
            className="mt-4 flex items-center justify-center gap-2 bg-[#c8102e] text-white py-3.5 text-xs font-bold tracking-[0.2em] uppercase"
          >
            <Phone size={14} />
            {settings.phone}
          </a>
        </div>
      )}
    </nav>
  )
}

// --- Footer -------------------------------------------------------------------
function Footer({ navigate, settings }: { navigate: (p: Page) => void; settings: SiteSettings }) {
  return (
    <footer className="bg-[#080808] border-t border-white/8 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-12 mb-12">
          <div>
            <div className="flex items-center gap-3 mb-5">
              <img src={logoImg as string} alt="AMC Auto Moto" className="h-10 w-10 object-contain" />
              <span className="font-heading text-white font-bold tracking-[0.15em] uppercase">
                AMC Auto Moto
              </span>
            </div>
            <p className="text-white/40 text-sm leading-relaxed">
              Garage indépendant spécialisé en entretien et réparation automobile et moto à Marbache, Meurthe-et-Moselle.
            </p>
          </div>

          <div>
            <p className="text-white/30 text-[10px] tracking-[0.25em] uppercase mb-4">Navigation</p>
            <div className="flex flex-col gap-2.5">
              {NAV.map(({ label, page }) => (
                <button
                  key={page}
                  onClick={() => navigate(page)}
                  className="text-white/50 text-sm text-left hover:text-white transition-colors"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-white/30 text-[10px] tracking-[0.25em] uppercase mb-4">Contact</p>
            <div className="flex flex-col gap-4">
              <a href={`tel:${settings.phone.replace(/\s/g, "")}`} className="flex items-center gap-3 text-white/50 text-sm hover:text-white transition-colors">
                <Phone size={13} className="text-[#c8102e] shrink-0" />
                {settings.phone}
              </a>
              {settings.phone2 && (
                <a href={`tel:${settings.phone2.replace(/\s/g, "")}`} className="flex items-center gap-3 text-white/50 text-sm hover:text-white transition-colors">
                  <Phone size={13} className="text-[#c8102e] shrink-0" />
                  {settings.phone2}
                </a>
              )}
              {settings.email && (
                <a href={`mailto:${settings.email}`} className="flex items-center gap-3 text-white/50 text-sm hover:text-white transition-colors">
                  <Mail size={13} className="text-[#c8102e] shrink-0" />
                  {settings.email}
                </a>
              )}
              <div className="flex items-start gap-3 text-white/50 text-sm">
                <MapPin size={13} className="text-[#c8102e] mt-0.5 shrink-0" />
                {settings.address}<br />{settings.postalCode} {settings.city}
              </div>
              <div className="flex items-center gap-3 text-white/50 text-sm">
                <Clock size={13} className="text-[#c8102e] shrink-0" />
                Lun–Ven {settings.hours[0]?.hours}
              </div>
              <div className="flex items-center gap-4 mt-1">
                <a href={settings.facebook} target="_blank" rel="noopener noreferrer" className="text-white/30 hover:text-white transition-colors text-xs tracking-widest uppercase">Facebook</a>
                {settings.instagram && <a href={settings.instagram} target="_blank" rel="noopener noreferrer" className="text-white/30 hover:text-white transition-colors text-xs tracking-widest uppercase">Instagram</a>}
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-white/8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-white/20 text-xs">© 2025 AMC Auto Moto — Tous droits réservés</p>
          <div className="flex items-center gap-4">
            <p className="text-white/20 text-xs">{settings.postalCode} {settings.city}, Meurthe-et-Moselle (54)</p>
            <button
              onClick={() => navigate("admin")}
              className="text-white/20 hover:text-white/50 transition-colors text-xs px-2 py-1"
              title="Accès administration"
            >
              Admin
            </button>
          </div>
        </div>
      </div>
    </footer>
  )
}

// --- Home Page ----------------------------------------------------------------
function HomePage({ navigate, settings }: { navigate: (p: Page) => void; settings: SiteSettings }) {
  return (
    <motion.div {...pageTransition}>
      {/* Hero */}
      <section className="relative min-h-[100svh] flex items-center justify-center overflow-hidden bg-[#050505] py-24 sm:py-28">
        {/* Parallax background */}
        <motion.img
          src={IMGS.hero}
          alt="Mécanicien au travail"
          className="absolute inset-0 w-full h-full object-cover"
          initial={{ opacity: 0, scale: 1.08 }}
          animate={{ opacity: 0.38, scale: 1 }}
          transition={{ duration: 1.6, ease: "easeOut" }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,5,5,0.72)_0%,rgba(5,5,5,0.46)_38%,rgba(5,5,5,0.9)_100%)]" />


        <motion.div
          className="relative z-10 text-center px-4 sm:px-6 max-w-5xl mx-auto w-full"
          variants={stagger(0.15)}
          initial="hidden"
          animate="show"
        >
          {/* Logo hero */}
          <motion.div
            className="flex justify-center mb-4 sm:mb-5 md:mb-6 relative"
            variants={fadeIn}
          >
            <div className="absolute left-1/2 top-1/2 h-[72%] w-[125%] -translate-x-1/2 -translate-y-1/2 pointer-events-none" style={{ background: "radial-gradient(ellipse at center, rgba(12,12,12,0.42) 18%, rgba(12,12,12,0.16) 48%, transparent 70%)" }} />
            <img
              src={logoImg as string}
              alt="AMC Auto Moto"
              className="h-[clamp(4.75rem,13vw,9.5rem)] w-[clamp(4.75rem,13vw,9.5rem)] max-h-[18svh] max-w-[18svh] object-contain relative z-10"
            />
          </motion.div>

          <motion.div
            variants={fadeUp}
            className="inline-flex max-w-full flex-wrap items-center justify-center gap-2 sm:gap-3 border border-white/18 bg-[#c8102e]/95 text-white text-[9px] sm:text-[10px] tracking-[0.18em] sm:tracking-[0.32em] uppercase px-4 sm:px-6 py-2.5 mb-6 sm:mb-8 shadow-[0_10px_35px_rgba(200,16,46,0.22)]"
          >
            <MapPin size={10} />
            {settings.city} · {settings.postalCode} · Meurthe-et-Moselle
          </motion.div>

          <motion.h1
            variants={fadeUp}
            className="font-heading text-[clamp(2.45rem,7.6vw,6.3rem)] text-white font-bold leading-[0.96] tracking-tight mb-5 sm:mb-6 break-words drop-shadow-[0_12px_35px_rgba(0,0,0,0.45)]"
          >
            Votre expert<br />
            <motion.span
              className="text-[#c8102e] inline-block"
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              Auto & Moto
            </motion.span>
          </motion.h1>

          <motion.p variants={fadeUp} className="text-white/72 text-sm sm:text-base md:text-lg leading-relaxed max-w-2xl mx-auto mb-8 sm:mb-10">
            {settings.heroSubtitle}
          </motion.p>

          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <motion.a
              href={`tel:${settings.phone.replace(/\s/g, "")}`}
              className="flex items-center gap-3 bg-[#c8102e] text-white px-6 sm:px-8 py-3.5 sm:py-4 font-bold tracking-[0.16em] sm:tracking-[0.2em] uppercase text-xs w-full sm:w-auto justify-center"
              whileHover={{ scale: 1.04, backgroundColor: "#a50d26" }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
            >
              <Phone size={14} />
              Prendre rendez-vous
            </motion.a>
            <motion.button
              onClick={() => navigate("services")}
              className="flex items-center gap-3 border text-white px-6 sm:px-8 py-3.5 sm:py-4 font-bold tracking-[0.16em] sm:tracking-[0.2em] uppercase text-xs w-full sm:w-auto justify-center"
              style={{ borderColor: "rgba(255,255,255,0.25)" }}
              whileHover={{ scale: 1.04, borderColor: "rgba(255,255,255,0.5)" }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
            >
              Nos services <ArrowRight size={14} />
            </motion.button>
          </motion.div>

          <motion.div variants={fadeUp} className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-px bg-white/12 max-w-2xl mx-auto text-left">
            {["Devis clair", "Toutes marques", "Auto & moto"].map((item) => (
              <div key={item} className="bg-black/45 px-5 py-3 text-center backdrop-blur-sm">
                <span className="text-white/80 text-[10px] font-bold tracking-[0.18em] uppercase">{item}</span>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-5 sm:bottom-8 left-1/2 -translate-x-1/2 hidden sm:flex flex-col items-center gap-3 text-white/25"
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <span className="text-[9px] tracking-[0.35em] uppercase">Défiler</span>
          <div className="w-px h-10 bg-gradient-to-b from-white/25 to-transparent" />
        </motion.div>
      </section>

      {/* Climate announcement banner */}
      <section className="bg-[#0077c8] border-y border-[#6ed7ff]/35 overflow-hidden">
        <div className="relative whitespace-nowrap py-4">
          <motion.div
            className="flex w-max items-center"
            animate={{ x: ["0%", "-50%"] }}
            transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          >
            {[0, 1].map((copy) => (
              <div key={copy} className="flex shrink-0 items-center gap-16 pr-16">
              {[
                "Climatisation : anticipez les vacances, les créneaux partent vite",
                "Recharge, diagnostic et contrôle clim chez AMC Auto Moto",
                "Prenez rendez-vous avant le rush des départs",
              ].map((message) => (
                <div key={`${copy}-${message}`} className="flex items-center gap-4">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#bff2ff]" />
                  <span className="font-heading text-white text-base md:text-lg font-bold tracking-[0.12em] uppercase">
                    {message}
                  </span>
                </div>
              ))}
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Stats strip */}
      <motion.section
        className="hidden"
        initial="hidden" whileInView="show" viewport={{ once: true, margin: "-60px" }}
        variants={stagger(0.12)}
      >
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-white/8">
          {[
            { count: 20, suffix: "+", label: "Années d'expérience" },
            { count: null, text: "Toutes",      label: "Marques acceptées" },
            { count: null, text: "Auto & Moto", label: "Double spécialité" },
          ].map(({ count, suffix, text, label }) => (
            <motion.div key={label} variants={fadeUp} className="flex flex-col items-center py-7 sm:py-5">
              <span className="font-heading text-3xl md:text-4xl text-white font-bold tracking-tight">
                {count !== null ? `${count}${suffix}` : text}
              </span>
              <span className="text-white/35 text-[10px] tracking-[0.25em] uppercase mt-1.5">{label}</span>
            </motion.div>
          ))}
        </div>
      </motion.section>

      <section className="py-24 md:py-32 px-4 sm:px-6 max-w-7xl mx-auto">
        <motion.div
          className="grid grid-cols-1 lg:grid-cols-[0.85fr_1.15fr] gap-14 lg:gap-20 items-start"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
          variants={stagger(0.12)}
        >
          <motion.div variants={fadeUp}>
            <span className="text-[#c8102e] text-[10px] tracking-[0.35em] uppercase block mb-4">Le garage, en vrai</span>
            <h2 className="font-heading text-4xl md:text-5xl text-white font-bold tracking-tight leading-tight mb-8">
              Un atelier local, visible et reconnu à Marbache
            </h2>
            <p className="text-white/64 text-sm leading-relaxed mb-10 max-w-xl">
              Ces photos montrent le garage réel et l'atelier AMC Auto Moto. Ici, pas de vitrine impersonnelle : vous savez où vous déposez votre véhicule et à qui vous le confiez.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-white/12">
              {["Atelier à Marbache", "Auto & moto", "Accueil direct", "Diagnostic sur place"].map((item) => (
                <div key={item} className="bg-[#111111] px-5 py-4">
                  <span className="text-white/80 text-[10px] font-bold tracking-[0.18em] uppercase">{item}</span>
                </div>
              ))}
            </div>

            <div className="mt-12 group overflow-hidden border border-white/18 bg-[#0c0c0c] shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
              <div className="h-64 md:h-80 overflow-hidden">
                <img
                  src={GARAGE_PHOTOS[1].src as string}
                  alt={GARAGE_PHOTOS[1].title}
                  className="w-full h-full object-cover object-left opacity-95 group-hover:opacity-100 group-hover:scale-[1.02] transition-all duration-700"
                />
              </div>
              <div className="p-5">
                <h3 className="font-heading text-xl text-white font-bold tracking-tight mb-2">{GARAGE_PHOTOS[1].title}</h3>
                <p className="text-white/58 text-sm leading-relaxed">{GARAGE_PHOTOS[1].text}</p>
              </div>
            </div>
          </motion.div>

          <motion.div variants={fadeUp}>
            <div className="group overflow-hidden border border-white/14 bg-[#111111]">
              <div className="h-72 md:h-[34rem] overflow-hidden">
                <img
                  src={GARAGE_PHOTOS[0].src as string}
                  alt={GARAGE_PHOTOS[0].title}
                  className="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-[1.02] transition-all duration-700"
                />
              </div>
              <div className="p-5">
                <h3 className="font-heading text-xl text-white font-bold tracking-tight mb-2">{GARAGE_PHOTOS[0].title}</h3>
                <p className="text-white/55 text-sm leading-relaxed">{GARAGE_PHOTOS[0].text}</p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      <section className="px-4 sm:px-6 max-w-7xl mx-auto pb-24">
        <motion.div
          className="border border-white/14 bg-[#111111] p-6 md:p-8"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
          variants={stagger(0.08)}
        >
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5 mb-8">
            <div>
              <motion.span variants={fadeUp} className="text-[#c8102e] text-[10px] tracking-[0.35em] uppercase block mb-4">
                Preuves locales
              </motion.span>
              <motion.h2 variants={fadeUp} className="font-heading text-3xl md:text-4xl text-white font-bold tracking-tight">
                Ils parlent de nous
              </motion.h2>
            </div>
            <motion.p variants={fadeUp} className="text-white/58 text-sm leading-relaxed max-w-xl">
              Articles, annonces et actions locales : des preuves concrètes qui racontent l'histoire du garage et son ancrage dans la région.
            </motion.p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {PRESS_CLIPPINGS.map(({ src, title, source }) => (
              <motion.div key={title} variants={fadeUp} className="group bg-[#0c0c0c] border border-white/10 overflow-hidden">
                <div className="aspect-[4/5] overflow-hidden bg-white">
                  <img
                    src={src as string}
                    alt={title}
                    className="w-full h-full object-cover transition-opacity duration-300 group-hover:opacity-95"
                  />
                </div>
                <div className="p-4">
                  <p className="text-[#c8102e] text-[9px] tracking-[0.18em] uppercase font-bold mb-2">{source}</p>
                  <h3 className="text-white text-sm font-semibold leading-snug">{title}</h3>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Services grid */}
      <section className="py-24 px-6 max-w-7xl mx-auto">
        <motion.div
          className="mb-16 text-center"
          initial="hidden" whileInView="show" viewport={{ once: true }}
          variants={stagger(0.1)}
        >
          <motion.span variants={fadeUp} className="text-[#c8102e] text-[10px] tracking-[0.35em] uppercase block mb-4">Nos prestations</motion.span>
          <motion.h2 variants={fadeUp} className="font-heading text-4xl md:text-5xl text-white font-bold tracking-tight">
            Ce que nous faisons
          </motion.h2>
        </motion.div>
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-white/8"
          initial="hidden" whileInView="show" viewport={{ once: true, margin: "-60px" }}
          variants={stagger(0.08)}
        >
          {SERVICES.map(({ icon: Icon, title, short, price }) => (
            <motion.button
              key={title}
              onClick={() => navigate("services")}
              className="bg-[#0c0c0c] p-8 text-left group relative overflow-hidden"
              variants={fadeUp}
              whileHover={{ backgroundColor: "#141414" }}
              transition={{ duration: 0.25 }}
            >
              {/* Hover red glow corner */}
              <motion.div
                className="absolute top-0 right-0 w-16 h-16 bg-[#c8102e]/8 pointer-events-none"
                initial={{ opacity: 0, scale: 0 }}
                whileHover={{ opacity: 1, scale: 1 }}
                style={{ originX: 1, originY: 0 }}
                transition={{ duration: 0.3 }}
              />
              <motion.div
                className="w-10 h-10 flex items-center justify-center border mb-6"
                style={{ borderColor: "rgba(200,16,46,0.35)" }}
                whileHover={{ borderColor: "rgba(200,16,46,0.9)", rotate: 8 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Icon size={17} className="text-[#c8102e]" />
              </motion.div>
              <div className="flex items-start justify-between gap-2 mb-3">
                <h3 className="font-heading text-xl text-white font-bold tracking-tight">{title}</h3>
                {price && <span className="text-[#c8102e] text-[10px] font-bold tracking-wider shrink-0 mt-1">{price}</span>}
              </div>
              <p className="text-white/45 text-sm leading-relaxed">{short}</p>
              <motion.div
                className="mt-6 flex items-center gap-2 text-[#c8102e] text-[10px] tracking-[0.2em] uppercase"
                initial={{ opacity: 0, x: -8 }}
                whileHover={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.25 }}
              >
                Détails <ArrowRight size={11} />
              </motion.div>
            </motion.button>
          ))}
        </motion.div>
        <motion.div
          className="text-center mt-10"
          initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
          transition={{ delay: 0.3 }}
        >
          <motion.button
            onClick={() => navigate("services")}
            className="inline-flex items-center gap-2 border text-xs font-bold tracking-[0.2em] uppercase px-8 py-4"
            style={{ borderColor: "rgba(255,255,255,0.2)", color: "rgba(255,255,255,0.7)" }}
            whileHover={{ borderColor: "rgba(200,16,46,0.6)", color: "#c8102e", scale: 1.03 }}
            transition={{ duration: 0.2 }}
          >
            Voir tous nos services <ArrowRight size={13} />
          </motion.button>
        </motion.div>
      </section>

      {/* Why us */}
      <section className="py-24 px-6 bg-[#0f0f0f] border-y border-white/8 overflow-hidden">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial="hidden" whileInView="show" viewport={{ once: true, margin: "-80px" }}
            variants={stagger(0.1)}
          >
            <motion.span variants={fadeUp} className="text-[#c8102e] text-[10px] tracking-[0.35em] uppercase block mb-5">Pourquoi nous choisir</motion.span>
            <motion.h2 variants={fadeUp} className="font-heading text-4xl md:text-5xl text-white font-bold tracking-tight leading-tight mb-7">
              L'exigence<br />d'un garage<br />indépendant
            </motion.h2>
            <motion.p variants={fadeUp} className="text-white/45 leading-relaxed mb-10 text-sm md:text-base">
              Chez AMC Auto Moto, chaque véhicule est traité avec le même soin. Nous allions expertise technique et relation de confiance durable, loin de l'anonymat des grandes enseignes.
            </motion.p>
            <motion.div variants={stagger(0.08)} className="flex flex-col gap-4 mb-10">
              {[
                "Devis gratuit et transparent",
                "Prise en charge rapide",
                "Équipe qualifiée et expérimentée",
                "Tarifs compétitifs sans compromis",
              ].map((item) => (
                <motion.div key={item} variants={fadeUp} className="flex items-center gap-3">
                  <motion.div whileInView={{ scale: [0, 1.3, 1] }} viewport={{ once: true }} transition={{ duration: 0.4 }}>
                    <CheckCircle size={15} className="text-[#c8102e] shrink-0" />
                  </motion.div>
                  <span className="text-white/65 text-sm">{item}</span>
                </motion.div>
              ))}
            </motion.div>
            <motion.button
              variants={fadeUp}
              onClick={() => navigate("contact")}
              className="flex items-center gap-3 bg-[#c8102e] text-white px-8 py-4 font-bold tracking-[0.2em] uppercase text-xs"
              whileHover={{ scale: 1.04, backgroundColor: "#a50d26" }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
            >
              Nous contacter <ArrowRight size={14} />
            </motion.button>
          </motion.div>

          <motion.div
            className="relative"
            initial={{ opacity: 0, x: 60 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="overflow-hidden">
              <motion.img
                src={IMGS.about}
                alt="Atelier AMC Auto Moto"
                className="w-full h-[480px] object-cover bg-[#1a1a1a]"
                whileHover={{ scale: 1.04 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              />
            </div>
            <div className="absolute -bottom-4 -left-4 w-28 h-28 border border-[#c8102e]/30 pointer-events-none" />
            <div className="absolute -top-4 -right-4 w-28 h-28 border border-white/10 pointer-events-none" />
          </motion.div>
        </div>
      </section>

      {/* Payment section */}
      <motion.section
        className="py-20 px-6 bg-[#0c0c0c] border-y border-white/8"
        initial="hidden" whileInView="show" viewport={{ once: true }}
        variants={stagger(0.1)}
      >
        <div className="max-w-7xl mx-auto">
          <motion.div variants={fadeUp} className="text-center mb-12">
            <span className="text-[#c8102e] text-[10px] tracking-[0.35em] uppercase block mb-4">Facilités de paiement</span>
            <h2 className="font-heading text-4xl md:text-5xl text-white font-bold tracking-tight">
              Payez en plusieurs fois
            </h2>
            <p className="text-white/40 mt-3 text-sm max-w-md mx-auto">
              En partenariat avec COFIDIS — sans frais pour le paiement 3x et 4x.
            </p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-white/8">
            {[
              {
                title: "3 ou 4 fois sans frais",
                tag: "Sans frais",
                desc: "Premier règlement par carte bancaire le jour de la vente. Frais de dossier selon le montant.",
                docs: ["Pièce d'identité valide", "RIB (hors bornes de retrait)", "CB liée au RIB"],
              },
              {
                title: "5 ou 10 fois",
                tag: "Crédit",
                desc: "Premier règlement par carte bancaire le jour de la vente. Selon le montant, des justificatifs supplémentaires peuvent être demandés.",
                docs: ["Pièce d'identité valide", "RIB + CB liée au RIB", "Justificatif de domicile (–3 mois)", "Dernière fiche de paie"],
              },
            ].map(({ title, tag, desc, docs }) => (
              <motion.div key={title} variants={fadeUp} className="bg-[#0c0c0c] p-8 md:p-10">
                <div className="flex items-start gap-4 mb-5">
                  <div className="w-10 h-10 flex items-center justify-center border shrink-0" style={{ borderColor: "rgba(200,16,46,0.35)" }}>
                    <CreditCard size={16} className="text-[#c8102e]" />
                  </div>
                  <div>
                    <span className="text-[#c8102e] text-[10px] font-bold tracking-[0.2em] uppercase">{tag}</span>
                    <h3 className="font-heading text-xl text-white font-bold tracking-tight">{title}</h3>
                  </div>
                </div>
                <p className="text-white/45 text-sm leading-relaxed mb-5">{desc}</p>
                <div className="space-y-2">
                  {docs.map(d => (
                    <div key={d} className="flex items-center gap-2 text-sm text-white/50">
                      <div className="w-1 h-1 bg-[#c8102e] shrink-0" />
                      {d}
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
          <motion.p variants={fadeUp} className="mt-8 mx-auto max-w-4xl border-t border-white/10 pt-5 text-center text-xs md:text-sm font-medium text-white/45 leading-relaxed">
            La demande doit être formulée lors de l'élaboration du devis. Octroi soumis à acceptation de COFIDIS.
          </motion.p>
        </div>
      </motion.section>

      {/* CTA band */}
      <motion.section
        className="bg-[#c8102e] overflow-hidden relative"
        initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        {/* Shimmer sweep */}
        <motion.div
          className="absolute inset-y-0 w-32 bg-white/10 skew-x-[-20deg] pointer-events-none"
          initial={{ left: "-20%" }}
          animate={{ left: "120%" }}
          transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 3, ease: "easeInOut" }}
        />
        <div className="max-w-7xl mx-auto px-6 py-14 flex flex-col md:flex-row items-center justify-between gap-6 relative">
          <motion.div
            initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.6 }}
          >
            <h2 className="font-heading text-3xl md:text-4xl text-white font-bold tracking-tight mb-1.5">
              Besoin d'un entretien ou d'une réparation ?
            </h2>
            <p className="text-white/65 text-sm">Appelez-nous — prise en charge rapide garantie.</p>
          </motion.div>
          <motion.a
            href={`tel:${settings.phone.replace(/\s/g, "")}`}
            className="shrink-0 flex items-center gap-3 bg-white text-[#c8102e] px-8 py-4 font-bold tracking-[0.2em] uppercase text-xs"
            whileHover={{ scale: 1.05, backgroundColor: "#f0f0f0" }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
          >
            <Phone size={15} />
            {settings.phone}
          </motion.a>
        </div>
      </motion.section>
    </motion.div>
  )
}

// --- Services Page ------------------------------------------------------------
function ServicesPage({ navigate, settings }: { navigate: (p: Page) => void; settings: SiteSettings }) {
  return (
    <div className="pt-16">
      {/* Header */}
      <div className="relative py-24 px-6 overflow-hidden bg-[#0a0a0a]">
        <img
          src={IMGS.tools}
          alt=""
          aria-hidden
          className="absolute inset-0 w-full h-full object-cover opacity-10"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0c0c0c]/80 to-[#0c0c0c]" />
        <div className="relative max-w-7xl mx-auto text-center">
          <span className="text-[#c8102e] text-[10px] tracking-[0.35em] uppercase block mb-4">Ce que nous proposons</span>
          <h1 className="font-heading text-5xl md:text-6xl text-white font-bold tracking-tight">Nos services</h1>
          <p className="text-white/40 mt-4 max-w-md mx-auto text-sm">
            Intervention sur tous types de véhicules — automobiles et motos, toutes marques confondues.
          </p>
        </div>
      </div>

      {/* Service list */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 md:py-16">
        <div className="border border-white/28 divide-y divide-white/16 shadow-[0_0_0_1px_rgba(255,255,255,0.05),0_24px_80px_rgba(0,0,0,0.35)]">
          {SERVICES.map(({ title, short, details, img, price }) => (
            <div key={title} className="flex flex-col md:flex-row group hover:bg-white/[0.02] transition-colors duration-300">
              <div className="md:w-64 lg:w-72 shrink-0 overflow-hidden bg-[#1a1a1a]">
                <img src={img} alt={title} className="w-full h-40 md:h-full object-cover opacity-60 group-hover:opacity-80 group-hover:scale-[1.03] transition-all duration-500" />
              </div>
              <div className="flex-1 p-6 sm:p-8 md:p-10">
                <div className="mb-6">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
                    <h2 className="font-heading text-2xl md:text-3xl text-white font-bold tracking-tight">{title}</h2>
                    {price && (
                      <div className="shrink-0 w-full sm:w-auto min-w-44 self-start border border-[#ff2a49]/70 bg-[#c8102e] px-5 py-4 text-left shadow-[0_0_32px_rgba(200,16,46,0.28)]">
                        <span className="block text-white/75 text-[9px] font-bold tracking-[0.24em] uppercase leading-none mb-2">
                          Prix client
                        </span>
                        <span className="block text-white text-lg md:text-xl font-bold tracking-[0.04em] uppercase leading-none">
                          {price}
                        </span>
                      </div>
                    )}
                  </div>
                  <p className="text-white/62 text-sm leading-relaxed mt-3 max-w-3xl">{short}</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-y-3 gap-x-5">
                  {details.map((d) => (
                    <div key={d} className="flex items-start gap-2.5 text-sm text-white/68">
                      <div className="w-1.5 h-1.5 mt-2 bg-[#c8102e] shrink-0" />{d}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Décalaminage — service spécial */}
        <div className="mt-4 border border-white/20 bg-[#111111] flex flex-col md:flex-row items-center gap-8 p-8 md:p-10 shadow-[0_18px_60px_rgba(0,0,0,0.28)]">
          <div className="shrink-0 text-center md:text-left">
            <span className="text-[#c8102e] text-[10px] font-bold tracking-[0.2em] uppercase block mb-1">Service spécial</span>
            <p className="font-heading text-2xl text-white font-bold">Décalaminage moteur</p>
            <p className="inline-block bg-[#c8102e] text-white font-heading text-xl font-bold mt-3 px-4 py-2">Dès 69,90€ TTC</p>
          </div>
          <div className="w-px h-16 bg-white/8 hidden md:block shrink-0" />
          <div className="flex-1">
            <p className="text-white/64 text-sm leading-relaxed mb-4">
              Élimination de la calamine moteur sans produit chimique ni corrosif — procédé écologique par enrichissement naturel air/carburant.
              Réduit la consommation de carburant jusqu'à <strong className="text-white/70">15%</strong> et les émissions polluantes jusqu'à <strong className="text-white/70">50%</strong>.
            </p>
            <div className="flex flex-wrap gap-4 text-xs text-white/58">
              {["Sans produit chimique", "Non agressif pour le véhicule", "Procédé écologique", "Résultat immédiat"].map(t => (
                <div key={t} className="flex items-center gap-1.5"><div className="w-1 h-1 bg-[#c8102e]" />{t}</div>
              ))}
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-14 bg-[#111111] border border-white/8 p-10 text-center">
          <h3 className="font-heading text-3xl text-white font-bold mb-3">Un autre besoin ?</h3>
          <p className="text-white/45 text-sm mb-8">Nous intervenons sur tout type de véhicule. Contactez-nous pour étudier votre demande.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href={`tel:${settings.phone.replace(/\s/g, "")}`}
              className="flex items-center justify-center gap-3 bg-[#c8102e] text-white px-8 py-4 font-bold tracking-[0.2em] uppercase text-xs hover:bg-[#a50d26] transition-colors"
            >
              <Phone size={14} />
              {settings.phone}
            </a>
            <button
              onClick={() => navigate("contact")}
              className="flex items-center justify-center gap-3 border border-white/20 text-white/70 px-8 py-4 font-bold tracking-[0.2em] uppercase text-xs hover:border-white/40 hover:text-white transition-colors"
            >
              <Mail size={14} />
              Formulaire de contact
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// --- Galerie Page -------------------------------------------------------------
function GaleriePage({ offers, settings }: { offers: Offer[]; settings: SiteSettings }) {
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null)

  useEffect(() => {
    if (!selectedOffer) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelectedOffer(null)
    }

    document.body.style.overflow = "hidden"
    window.addEventListener("keydown", handleKeyDown)

    return () => {
      document.body.style.overflow = ""
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [selectedOffer])

  return (
    <div className="pt-16 min-h-screen flex flex-col">
      <div className="py-24 px-6 text-center">
        <span className="text-[#c8102e] text-[10px] tracking-[0.35em] uppercase block mb-4">Bons plans & promotions</span>
        <h1 className="font-heading text-5xl md:text-6xl text-white font-bold tracking-tight">Nos offres</h1>
      </div>

      <div className="flex-1 px-6 pb-24 max-w-7xl mx-auto w-full">
        {offers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-20 h-20 border border-white/10 flex items-center justify-center mb-8">
              <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8 text-white/20" stroke="currentColor" strokeWidth={1.2}>
                <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" strokeLinecap="round" strokeLinejoin="round"/>
                <rect x="9" y="3" width="6" height="4" rx="1" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M9 12h6M9 16h4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h2 className="font-heading text-3xl text-white font-bold tracking-tight mb-3">Aucune offre en ce moment</h2>
            <p className="text-white/40 text-sm leading-relaxed mb-10 max-w-sm">
              Suivez notre page Facebook pour être informé de nos promotions et bons plans en temps réel.
            </p>
            <a
              href={settings.facebook}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 bg-[#1877F2] text-white px-8 py-4 font-bold tracking-[0.15em] uppercase text-sm hover:bg-[#1565d8] transition-colors duration-200"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.886v2.267h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/></svg>
              Voir la page Facebook
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-white/8">
            {offers.map((offer) => (
              <button
                key={offer.id}
                type="button"
                onClick={() => setSelectedOffer(offer)}
                className="bg-[#0c0c0c] flex flex-col text-left group focus:outline-none focus:ring-2 focus:ring-[#c8102e]/70 focus:ring-offset-2 focus:ring-offset-[#0c0c0c]"
                aria-label={`Afficher l'offre ${offer.title} en grand`}
              >
                {offer.imageUrl && (
                  <div className="overflow-hidden h-48 bg-[#1a1a1a]">
                    <img src={offer.imageUrl} alt={offer.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  </div>
                )}
                <div className="p-7 flex flex-col flex-1">
                  {offer.badge && (
                    <span className="inline-block bg-[#c8102e] text-white text-[10px] font-bold tracking-[0.2em] uppercase px-3 py-1 mb-4 self-start">
                      {offer.badge}
                    </span>
                  )}
                  <h3 className="font-heading text-xl text-white font-bold tracking-tight mb-2">{offer.title}</h3>
                  <p className="text-white/50 text-sm leading-relaxed flex-1">{offer.description}</p>
                  {offer.validUntil && (
                    <p className="text-white/25 text-[11px] mt-4 tracking-wider">
                      Valable jusqu'au {new Date(offer.validUntil).toLocaleDateString("fr-FR")}
                    </p>
                  )}
                  <span className="mt-6 inline-flex items-center gap-2 text-[#c8102e] text-[10px] font-bold tracking-[0.2em] uppercase">
                    Voir l'offre <ArrowRight size={13} className="transition-transform group-hover:translate-x-1" />
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedOffer && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 px-4 py-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedOffer(null)}
            role="dialog"
            aria-modal="true"
            aria-labelledby="offer-modal-title"
          >
            <motion.div
              className="relative w-full max-w-5xl max-h-[90vh] overflow-y-auto bg-[#0c0c0c] border border-white/10 shadow-2xl"
              initial={{ opacity: 0, y: 24, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.98 }}
              transition={{ duration: 0.22 }}
              onClick={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setSelectedOffer(null)}
                className="absolute right-4 top-4 z-10 w-10 h-10 flex items-center justify-center bg-black/70 border border-white/15 text-white/70 hover:text-white hover:border-white/40 transition-colors"
                aria-label="Fermer l'offre agrandie"
              >
                <X size={18} />
              </button>

              {selectedOffer.imageUrl && (
                <div className="bg-[#1a1a1a]">
                  <img src={selectedOffer.imageUrl} alt={selectedOffer.title} className="w-full max-h-[58vh] object-contain" />
                </div>
              )}

              <div className="p-7 md:p-10">
                {selectedOffer.badge && (
                  <span className="inline-block bg-[#c8102e] text-white text-[10px] font-bold tracking-[0.2em] uppercase px-3 py-1 mb-5">
                    {selectedOffer.badge}
                  </span>
                )}
                <h2 id="offer-modal-title" className="font-heading text-4xl md:text-5xl text-white font-bold tracking-tight mb-4">
                  {selectedOffer.title}
                </h2>
                <p className="text-white/60 text-base md:text-lg leading-relaxed whitespace-pre-line">
                  {selectedOffer.description}
                </p>
                {selectedOffer.validUntil && (
                  <p className="text-white/35 text-xs mt-7 tracking-[0.18em] uppercase">
                    Valable jusqu'au {new Date(selectedOffer.validUntil).toLocaleDateString("fr-FR")}
                  </p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// --- Admin Page ---------------------------------------------------------------
function AdminPage({ offers, setOffers, settings, setSettings, navigate }: {
  offers: Offer[]
  setOffers: (o: Offer[]) => void
  settings: SiteSettings
  setSettings: (s: SiteSettings) => void
  navigate: (p: Page) => void
}) {
  const [authed, setAuthed]     = useState(() => sessionStorage.getItem("amc-admin-authed") === "true")
  const [pwd, setPwd]           = useState("")
  const [pwdError, setPwdError] = useState(false)
  const [tab, setTab]           = useState<"offres" | "contact" | "textes" | "historique">("offres")
  const [history, setHistory]   = useState<HistoryEntry[]>([])

  // Offers state
  const [editing, setEditing]   = useState<Offer | null>(null)
  const [offerForm, setOfferForm] = useState({ title: "", description: "", badge: "", imageUrl: "", validUntil: "" })
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving]     = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  // Settings state
  const [settingsForm, setSettingsForm] = useState<SiteSettings>(settings)
  const [savingSettings, setSavingSettings] = useState(false)
  const [savedSettings, setSavedSettings]   = useState(false)

  const inp = "w-full bg-[#0c0c0c] border border-white/14 text-white px-4 py-3 text-sm focus:border-[#c8102e]/70 focus:ring-2 focus:ring-[#c8102e]/15 focus:outline-none transition-colors placeholder:text-white/25"
  const lbl = "text-white/50 text-[10px] tracking-[0.2em] uppercase block mb-2"
  const adminTabs: { id: typeof tab; label: string; help: string }[] = [
    { id: "offres", label: "Offres", help: `${offers.length} publiée${offers.length > 1 ? "s" : ""}` },
    { id: "contact", label: "Contact", help: "Coordonnées & horaires" },
    { id: "textes", label: "Textes", help: "Accueil, contact, à propos" },
    { id: "historique", label: "Historique", help: "Modifs des 3 jours" },
  ]

  useEffect(() => {
    if (authed) refreshHistory()
  }, [authed])

  const askActor = () => {
    const actor = prompt("Prénom de la personne qui fait cette modification :")?.trim()
    if (!actor) alert("Le prénom est obligatoire pour enregistrer une modification.")
    return actor || null
  }

  const addLocalHistory = (actor: string, action: string, target: string, detail = "") => {
    const entry: HistoryEntry = {
      id: crypto.randomUUID(),
      actor,
      action,
      target,
      detail,
      createdAt: new Date().toISOString(),
    }
    const next = cleanupLocalHistory([entry, ...getLocalHistory()]).slice(0, 100)
    localStorage.setItem(ADMIN_HISTORY_KEY, JSON.stringify(next))
    setHistory(next)
  }

  const refreshHistory = () => {
    api.getHistory()
      .then(remoteHistory => {
        const remote = Array.isArray(remoteHistory) ? remoteHistory : []
        const local = getLocalHistory()
        const merged = cleanupLocalHistory([...remote, ...local])
          .filter((entry, index, entries) => entries.findIndex(item => item.id === entry.id) === index)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        setHistory(merged)
      })
      .catch(err => {
        console.log("Erreur historique:", err)
        setHistory(getLocalHistory())
      })
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (await sha256(pwd) === ADMIN_PASSWORD_HASH) {
      sessionStorage.setItem("amc-admin-authed", "true")
      setAuthed(true)
      setSettingsForm(settings)
    }
    else setPwdError(true)
  }

  const handleLogout = () => {
    sessionStorage.removeItem("amc-admin-authed")
    setAuthed(false)
    navigate("accueil")
  }

  // -- Offers handlers --
  const openNew = () => { setEditing(null); setOfferForm({ title: "", description: "", badge: "", imageUrl: "", validUntil: "" }); setShowForm(true) }
  const openEdit = (o: Offer) => { setEditing(o); setOfferForm({ title: o.title, description: o.description, badge: o.badge, imageUrl: o.imageUrl, validUntil: o.validUntil }); setShowForm(true) }

  const handleSaveOffer = async (e: React.FormEvent) => {
    e.preventDefault()
    const actor = askActor()
    if (!actor) return
    setSaving(true)
    try {
      if (editing) {
        const updated = await api.updateOffer(editing.id, offerForm, actor)
        setOffers(offers.map(o => o.id === editing.id ? updated : o))
        addLocalHistory(actor, "Modification", "Offre", updated.title || offerForm.title)
      } else {
        const created = await api.createOffer(offerForm, actor)
        setOffers([created, ...offers])
        addLocalHistory(actor, "Création", "Offre", created.title || offerForm.title)
      }
      setShowForm(false)
      refreshHistory()
    } catch (err) { console.log("Erreur offre:", err); alert("Erreur. Vérifiez votre connexion.") }
    finally { setSaving(false) }
  }

  const handleDeleteOffer = async (id: string) => {
    if (!confirm("Supprimer cette offre ?")) return
    const actor = askActor()
    if (!actor) return
    const deletedOffer = offers.find(o => o.id === id)
    setDeleting(id)
    try {
      await api.deleteOffer(id, actor)
      setOffers(offers.filter(o => o.id !== id))
      addLocalHistory(actor, "Suppression", "Offre", deletedOffer?.title || id)
      refreshHistory()
    }
    catch (err) { console.log("Erreur suppression:", err); alert("Erreur lors de la suppression.") }
    finally { setDeleting(null) }
  }

  // -- Settings handlers --
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    const actor = askActor()
    if (!actor) return
    setSavingSettings(true)
    try {
      const saved = await api.saveSettings(settingsForm, actor)
      setSettings(saved)
      setSavedSettings(true)
      addLocalHistory(actor, "Modification", "Réglages du site", tab === "contact" ? "Coordonnées ou horaires" : "Textes du site")
      refreshHistory()
      setTimeout(() => setSavedSettings(false), 2500)
    } catch (err) { console.log("Erreur settings:", err); alert("Erreur lors de la sauvegarde.") }
    finally { setSavingSettings(false) }
  }

  const setHour = (i: number, field: "day" | "hours", val: string) => {
    const hours = [...settingsForm.hours]
    hours[i] = { ...hours[i], [field]: val }
    setSettingsForm(p => ({ ...p, hours }))
  }

  const removeHour = (i: number) => {
    setSettingsForm(p => ({ ...p, hours: p.hours.filter((_, index) => index !== i) }))
  }

  // -- Login screen --
  if (!authed) return (
    <div className="pt-16 min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <div className="w-14 h-14 border border-white/10 flex items-center justify-center">
            <Lock size={20} className="text-[#c8102e]" />
          </div>
        </div>
        <h2 className="font-heading text-3xl text-white font-bold text-center tracking-tight mb-2">Espace admin</h2>
        <p className="text-white/30 text-sm text-center mb-8">Accès réservé à l'équipe AMC</p>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className={lbl}>Mot de passe</label>
            <input type="password" value={pwd} onChange={e => { setPwd(e.target.value); setPwdError(false) }}
              className={`${inp} ${pwdError ? "border-[#c8102e]/60" : ""}`} placeholder="••••••••" autoFocus />
            {pwdError && <p className="text-[#c8102e] text-xs mt-2">Mot de passe incorrect</p>}
          </div>
          <button type="submit" className="w-full bg-[#c8102e] text-white py-4 font-bold tracking-[0.2em] uppercase text-xs hover:bg-[#a50d26] transition-colors">
            Se connecter
          </button>
        </form>
        <button onClick={() => navigate("accueil")} className="mt-6 w-full text-white/30 text-xs text-center hover:text-white/60 transition-colors">
          ← Retour au site
        </button>
      </div>
    </div>
  )

  return (
    <div className="pt-16 min-h-screen bg-[#080808]">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-[#0c0c0c]/95 backdrop-blur border-b border-white/8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <p className="text-[#c8102e] text-[10px] tracking-[0.28em] uppercase mb-1">Gestion du site</p>
            <h2 className="font-heading text-2xl text-white font-bold tracking-tight">Admin AMC Auto Moto</h2>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            {adminTabs.map(({ id, label, help }) => (
              <button key={id} onClick={() => setTab(id)}
                className={`px-4 py-3 text-left border transition-colors ${tab === id ? "bg-[#c8102e] border-[#c8102e] text-white" : "bg-[#111111] border-white/10 text-white/55 hover:text-white hover:border-white/25"}`}>
                <span className="block text-xs font-bold tracking-[0.15em] uppercase">{label}</span>
                <span className="block text-[11px] text-white/45 mt-0.5">{help}</span>
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            {tab === "offres" && (
              <button onClick={openNew} className="flex items-center gap-2 bg-[#c8102e] text-white px-4 py-3 font-bold tracking-[0.15em] uppercase text-xs hover:bg-[#a50d26] transition-colors">
                <Plus size={13} /> Nouvelle offre
              </button>
            )}
            <button onClick={() => navigate("accueil")} className="border border-white/12 text-white/55 text-xs hover:text-white hover:border-white/30 transition-colors px-4 py-3 font-bold tracking-[0.14em] uppercase">
              Voir le site
            </button>
            <button onClick={handleLogout} className="w-11 h-11 flex items-center justify-center border border-white/12 text-white/35 hover:text-white hover:border-white/30 transition-colors" title="Déconnexion">
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 md:py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
          <div className="bg-[#111111] border border-white/10 p-5">
            <p className="text-white/35 text-[10px] tracking-[0.22em] uppercase mb-2">Offres actives</p>
            <p className="font-heading text-3xl text-white font-bold">{offers.length}</p>
          </div>
          <div className="bg-[#111111] border border-white/10 p-5">
            <p className="text-white/35 text-[10px] tracking-[0.22em] uppercase mb-2">Téléphone</p>
            <p className="font-heading text-2xl text-white font-bold">{settingsForm.phone || "Non renseigné"}</p>
          </div>
          <div className="bg-[#111111] border border-white/10 p-5">
            <p className="text-white/35 text-[10px] tracking-[0.22em] uppercase mb-2">Ville</p>
            <p className="font-heading text-2xl text-white font-bold">{settingsForm.city || "Non renseignée"}</p>
          </div>
          <div className="bg-[#111111] border border-white/10 p-5">
            <p className="text-white/35 text-[10px] tracking-[0.22em] uppercase mb-2">Dernière modif</p>
            <p className="font-heading text-2xl text-white font-bold">{history[0]?.actor || "Aucune"}</p>
          </div>
        </div>

        {/* -- TAB: OFFRES -- */}
        {tab === "offres" && (<>
          {showForm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
              <div className="bg-[#111111] border border-white/10 w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between px-7 py-5 border-b border-white/8">
                  <h3 className="font-heading text-xl text-white font-bold">{editing ? "Modifier l'offre" : "Nouvelle offre"}</h3>
                  <button onClick={() => setShowForm(false)} className="text-white/30 hover:text-white"><X size={18} /></button>
                </div>
                <form onSubmit={handleSaveOffer} className="p-7 space-y-5">
                  <div><label className={lbl}>Titre *</label><input required value={offerForm.title} onChange={e => setOfferForm(p => ({ ...p, title: e.target.value }))} className={inp} placeholder="Ex : Vidange à prix réduit" /></div>
                  <div><label className={lbl}>Description *</label><textarea required rows={3} value={offerForm.description} onChange={e => setOfferForm(p => ({ ...p, description: e.target.value }))} className={`${inp} resize-none`} placeholder="Décrivez l'offre..." /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className={lbl}>Étiquette</label><input value={offerForm.badge} onChange={e => setOfferForm(p => ({ ...p, badge: e.target.value }))} className={inp} placeholder="Promo, Nouveau…" /></div>
                    <div><label className={lbl}>Valable jusqu'au</label><input type="date" value={offerForm.validUntil} onChange={e => setOfferForm(p => ({ ...p, validUntil: e.target.value }))} className={inp} /></div>
                  </div>
                  <div>
                    <label className={lbl}>Image (lien URL)</label>
                    <input type="url" value={offerForm.imageUrl} onChange={e => setOfferForm(p => ({ ...p, imageUrl: e.target.value }))} className={inp} placeholder="https://..." />
                    <p className="text-white/20 text-[11px] mt-1.5">Coller l'adresse web d'une photo</p>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button type="submit" disabled={saving} className="flex-1 bg-[#c8102e] text-white py-3.5 font-bold tracking-[0.15em] uppercase text-xs disabled:opacity-60">
                      {saving ? "Enregistrement…" : editing ? "Enregistrer" : "Publier l'offre"}
                    </button>
                    <button type="button" onClick={() => setShowForm(false)} className="px-6 border border-white/15 text-white/50 text-xs hover:text-white">Annuler</button>
                  </div>
                </form>
              </div>
            </div>
          )}
          {offers.length === 0 ? (
            <div className="text-center py-20 border border-white/8">
              <p className="text-white/30 text-sm mb-6">Aucune offre publiée pour l'instant.</p>
              <button onClick={openNew} className="inline-flex items-center gap-2 bg-[#c8102e] text-white px-6 py-3 font-bold tracking-[0.15em] uppercase text-xs hover:bg-[#a50d26] transition-colors">
                <Plus size={14} /> Créer la première offre
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {offers.map(offer => (
                <div key={offer.id} className="bg-[#111111] border border-white/8 p-6 flex items-start gap-5">
                  {offer.imageUrl && <img src={offer.imageUrl} alt={offer.title} className="w-16 h-16 object-cover shrink-0 bg-[#1a1a1a]" />}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      {offer.badge && <span className="bg-[#c8102e] text-white text-[10px] font-bold tracking-widest uppercase px-2 py-0.5">{offer.badge}</span>}
                      <h4 className="font-heading text-lg text-white font-bold">{offer.title}</h4>
                    </div>
                    <p className="text-white/40 text-sm line-clamp-2">{offer.description}</p>
                    {offer.validUntil && <p className="text-white/25 text-[11px] mt-1">Jusqu'au {new Date(offer.validUntil).toLocaleDateString("fr-FR")}</p>}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => openEdit(offer)} className="w-8 h-8 flex items-center justify-center border border-white/10 text-white/40 hover:text-white hover:border-white/30 transition-colors"><Pencil size={13} /></button>
                    <button onClick={() => handleDeleteOffer(offer.id)} disabled={deleting === offer.id} className="w-8 h-8 flex items-center justify-center border border-white/10 text-white/40 hover:text-[#c8102e] hover:border-[#c8102e]/40 transition-colors disabled:opacity-40"><Trash2 size={13} /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>)}

        {/* -- TAB: CONTACT & HORAIRES -- */}
        {tab === "contact" && (
          <form onSubmit={handleSaveSettings} className="space-y-8">
            <div className="grid grid-cols-1 xl:grid-cols-[1fr_22rem] gap-6 items-start">
              <div className="bg-[#111111] border border-white/8 p-6 md:p-7 space-y-6">
                <div>
                  <p className="text-[#c8102e] text-[10px] tracking-[0.25em] uppercase mb-2">Coordonnées</p>
                  <h3 className="font-heading text-2xl text-white font-bold">Informations affichées sur le site</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div><label className={lbl}>Téléphone principal</label><input value={settingsForm.phone} onChange={e => setSettingsForm(p => ({ ...p, phone: e.target.value }))} className={inp} placeholder="09 54 15 87 72" /></div>
                  <div><label className={lbl}>Téléphone secondaire</label><input value={settingsForm.phone2} onChange={e => setSettingsForm(p => ({ ...p, phone2: e.target.value }))} className={inp} placeholder="07 66 05 55 89" /></div>
                  <div><label className={lbl}>E-mail</label><input type="email" value={settingsForm.email} onChange={e => setSettingsForm(p => ({ ...p, email: e.target.value }))} className={inp} placeholder="amcautomoto@gmail.com" /></div>
                  <div><label className={lbl}>Adresse</label><input value={settingsForm.address} onChange={e => setSettingsForm(p => ({ ...p, address: e.target.value }))} className={inp} placeholder="5 Chemin de Saizerelle" /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className={lbl}>Code postal</label><input value={settingsForm.postalCode} onChange={e => setSettingsForm(p => ({ ...p, postalCode: e.target.value }))} className={inp} placeholder="54820" /></div>
                    <div><label className={lbl}>Ville</label><input value={settingsForm.city} onChange={e => setSettingsForm(p => ({ ...p, city: e.target.value }))} className={inp} placeholder="Marbache" /></div>
                  </div>
                  <div><label className={lbl}>Lien Facebook</label><input value={settingsForm.facebook} onChange={e => setSettingsForm(p => ({ ...p, facebook: e.target.value }))} className={inp} placeholder="https://facebook.com/..." /></div>
                  <div><label className={lbl}>Lien Instagram</label><input value={settingsForm.instagram} onChange={e => setSettingsForm(p => ({ ...p, instagram: e.target.value }))} className={inp} placeholder="https://instagram.com/..." /></div>
                </div>
              </div>

              <div className="bg-[#111111] border border-white/8 p-6 md:p-7 xl:sticky xl:top-32">
                <p className="text-white/35 text-[10px] tracking-[0.22em] uppercase mb-4">Aperçu rapide</p>
                <div className="space-y-5 text-sm">
                  <div>
                    <p className="text-white/35 mb-1">Téléphone</p>
                    <p className="text-white font-semibold">{settingsForm.phone || "Non renseigné"}</p>
                    {settingsForm.phone2 && <p className="text-white/55 mt-1">{settingsForm.phone2}</p>}
                  </div>
                  <div>
                    <p className="text-white/35 mb-1">Adresse</p>
                    <p className="text-white font-semibold leading-relaxed">{settingsForm.address || "Adresse"}<br />{settingsForm.postalCode} {settingsForm.city}</p>
                  </div>
                  <div>
                    <p className="text-white/35 mb-1">Réseaux</p>
                    <p className="text-white/65 break-all">{settingsForm.facebook || "Facebook non renseigné"}</p>
                    {settingsForm.instagram && <p className="text-white/45 break-all mt-1">{settingsForm.instagram}</p>}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-[#111111] border border-white/8 p-6 md:p-7 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <p className="text-[#c8102e] text-[10px] tracking-[0.25em] uppercase mb-2">Horaires</p>
                  <h3 className="font-heading text-2xl text-white font-bold">Jours et ouvertures</h3>
                </div>
                <button type="button" onClick={() => setSettingsForm(p => ({ ...p, hours: [...p.hours, { day: "", hours: "" }] }))}
                  className="inline-flex items-center gap-2 border border-white/14 px-4 py-3 text-white/60 text-xs hover:text-white hover:border-white/30 transition-colors">
                  <Plus size={12} /> Ajouter une ligne
                </button>
              </div>
              {settingsForm.hours.map((h, i) => (
                <div key={i} className="grid grid-cols-1 md:grid-cols-[1fr_1.5fr_auto] gap-3 items-end">
                  <div><label className={lbl}>Jour</label><input value={h.day} onChange={e => setHour(i, "day", e.target.value)} className={inp} /></div>
                  <div><label className={lbl}>Horaires</label><input value={h.hours} onChange={e => setHour(i, "hours", e.target.value)} className={inp} placeholder="8h00 – 18h00 ou Fermé" /></div>
                  <button type="button" onClick={() => removeHour(i)} className="h-[46px] px-4 border border-white/12 text-white/35 hover:text-[#c8102e] hover:border-[#c8102e]/40 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>

            <button type="submit" disabled={savingSettings}
              className="w-full bg-[#c8102e] text-white py-4 font-bold tracking-[0.2em] uppercase text-xs hover:bg-[#a50d26] transition-colors disabled:opacity-60">
              {savingSettings ? "Sauvegarde…" : savedSettings ? "✓ Sauvegardé !" : "Enregistrer les modifications"}
            </button>
          </form>
        )}

        {/* -- TAB: TEXTES -- */}
        {tab === "textes" && (
          <form onSubmit={handleSaveSettings} className="space-y-8">
            <div className="bg-[#111111] border border-white/8 p-6 md:p-7 space-y-5">
              <div>
                <p className="text-[#c8102e] text-[10px] tracking-[0.25em] uppercase mb-2">Page d'accueil</p>
                <h3 className="font-heading text-2xl text-white font-bold">Phrase principale</h3>
              </div>
              <div>
                <label className={lbl}>Phrase d'accroche (sous le titre)</label>
                <textarea rows={3} value={settingsForm.heroSubtitle} onChange={e => setSettingsForm(p => ({ ...p, heroSubtitle: e.target.value }))} className={`${inp} resize-none`} />
              </div>
            </div>

            <div className="bg-[#111111] border border-white/8 p-6 md:p-7 space-y-5">
              <div>
                <p className="text-[#c8102e] text-[10px] tracking-[0.25em] uppercase mb-2">Page À propos</p>
                <h3 className="font-heading text-2xl text-white font-bold">Histoire du garage</h3>
              </div>
              <div><label className={lbl}>Grand titre</label><input value={settingsForm.aboutTitle} onChange={e => setSettingsForm(p => ({ ...p, aboutTitle: e.target.value }))} className={inp} /></div>
              <div><label className={lbl}>Paragraphe 1</label><textarea rows={4} value={settingsForm.aboutText1} onChange={e => setSettingsForm(p => ({ ...p, aboutText1: e.target.value }))} className={`${inp} resize-none`} /></div>
              <div><label className={lbl}>Paragraphe 2</label><textarea rows={4} value={settingsForm.aboutText2} onChange={e => setSettingsForm(p => ({ ...p, aboutText2: e.target.value }))} className={`${inp} resize-none`} /></div>
              <div><label className={lbl}>Paragraphe 3</label><textarea rows={4} value={settingsForm.aboutText3} onChange={e => setSettingsForm(p => ({ ...p, aboutText3: e.target.value }))} className={`${inp} resize-none`} /></div>
            </div>

            <div className="bg-[#111111] border border-white/8 p-6 md:p-7 space-y-5">
              <div>
                <p className="text-[#c8102e] text-[10px] tracking-[0.25em] uppercase mb-2">Page Contact</p>
                <h3 className="font-heading text-2xl text-white font-bold">Bloc réponse rapide</h3>
              </div>
              <div><label className={lbl}>Titre du bloc</label><input value={settingsForm.contactAdviceTitle} onChange={e => setSettingsForm(p => ({ ...p, contactAdviceTitle: e.target.value }))} className={inp} /></div>
              <div><label className={lbl}>Texte 1</label><textarea rows={3} value={settingsForm.contactAdviceText1} onChange={e => setSettingsForm(p => ({ ...p, contactAdviceText1: e.target.value }))} className={`${inp} resize-none`} /></div>
              <div><label className={lbl}>Texte 2</label><textarea rows={3} value={settingsForm.contactAdviceText2} onChange={e => setSettingsForm(p => ({ ...p, contactAdviceText2: e.target.value }))} className={`${inp} resize-none`} /></div>
            </div>

            <button type="submit" disabled={savingSettings}
              className="w-full bg-[#c8102e] text-white py-4 font-bold tracking-[0.2em] uppercase text-xs hover:bg-[#a50d26] transition-colors disabled:opacity-60">
              {savingSettings ? "Sauvegarde…" : savedSettings ? "✓ Sauvegardé !" : "Enregistrer les modifications"}
            </button>
          </form>
        )}

        {/* -- TAB: HISTORIQUE -- */}
        {tab === "historique" && (
          <div className="space-y-6">
            <div className="bg-[#111111] border border-white/8 p-6 md:p-7 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="text-[#c8102e] text-[10px] tracking-[0.25em] uppercase mb-2">Historique</p>
                <h3 className="font-heading text-2xl text-white font-bold">Modifications des 3 derniers jours</h3>
                <p className="text-white/40 text-sm mt-2">Chaque création, modification ou suppression demande un prénom et reste visible pendant 3 jours.</p>
              </div>
              <button type="button" onClick={refreshHistory} className="border border-white/14 px-5 py-3 text-white/60 text-xs font-bold tracking-[0.14em] uppercase hover:text-white hover:border-white/35 transition-colors">
                Actualiser
              </button>
            </div>

            {history.length === 0 ? (
              <div className="border border-white/8 bg-[#111111] p-10 text-center">
                <Clock size={22} className="text-white/25 mx-auto mb-4" />
                <p className="text-white/45 text-sm">Aucune modification enregistrée sur les 3 derniers jours.</p>
              </div>
            ) : (
              <div className="bg-[#111111] border border-white/8 divide-y divide-white/8">
                {history.map((entry) => (
                  <div key={entry.id} className="p-5 md:p-6 grid grid-cols-1 md:grid-cols-[12rem_1fr_auto] gap-4 md:items-center">
                    <div>
                      <p className="text-white text-sm font-bold">{entry.actor}</p>
                      <p className="text-white/35 text-xs mt-1">
                        {new Date(entry.createdAt).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}
                      </p>
                    </div>
                    <div>
                      <p className="text-white font-semibold">{entry.target}</p>
                      {entry.detail && <p className="text-white/45 text-sm mt-1">{entry.detail}</p>}
                    </div>
                    <span className="justify-self-start md:justify-self-end bg-[#0c0c0c] border border-white/10 px-3 py-1 text-[#c8102e] text-[10px] font-bold tracking-[0.18em] uppercase">
                      {entry.action}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}

// --- À propos Page ------------------------------------------------------------
function AProposPage({ navigate, settings }: { navigate: (p: Page) => void; settings: SiteSettings }) {
  return (
    <div className="pt-16">
      <div className="py-24 px-6 text-center">
        <span className="text-[#c8102e] text-[10px] tracking-[0.35em] uppercase block mb-4">Notre histoire</span>
        <h1 className="font-heading text-5xl md:text-6xl text-white font-bold tracking-tight">À propos</h1>
      </div>

      <div className="max-w-7xl mx-auto px-6 pb-24">
        {/* Story */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-24">
          <div className="relative">
            <img
              src={IMGS.about}
              alt="Atelier AMC Auto Moto"
              className="w-full h-[480px] object-cover bg-[#1a1a1a]"
            />
            <div className="absolute bottom-6 right-6 bg-[#c8102e] px-6 py-5">
              <span className="font-heading text-white font-bold text-4xl leading-none block">20+</span>
              <span className="text-white/75 text-[10px] tracking-[0.2em] uppercase block mt-1">Ans d'expérience</span>
            </div>
            <div className="absolute -bottom-4 -left-4 w-24 h-24 border border-white/10 pointer-events-none" />
          </div>

          <div>
            <h2 className="font-heading text-4xl md:text-5xl text-white font-bold tracking-tight leading-tight mb-7">
              {settings.aboutTitle}
            </h2>
            <div className="space-y-5 text-white/50 text-sm leading-relaxed">
              <p>{settings.aboutText1}</p>
              <p>{settings.aboutText2}</p>
              <p>{settings.aboutText3}</p>
            </div>
          </div>
        </div>

        {/* Values */}
        <div className="border-t border-white/8 pt-20">
          <div className="text-center mb-14">
            <span className="text-[#c8102e] text-[10px] tracking-[0.35em] uppercase block mb-4">Ce qui nous définit</span>
            <h2 className="font-heading text-4xl text-white font-bold tracking-tight">Nos valeurs</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-white/8">
            {[
              { title: "Confiance",   text: "Devis clairs, prix transparents et communication honnête à chaque étape de l'intervention." },
              { title: "Expertise",   text: "Des mécaniciens qualifiés, formés aux technologies automobiles modernes, qui savent de quoi ils parlent." },
              { title: "Proximité",   text: "Un service humain à taille locale, où vous êtes un client, pas un numéro." },
              { title: "Réactivité",  text: "Prise en charge rapide pour minimiser vos immobilisations et vous remettre sur la route." },
            ].map(({ title, text }) => (
              <div key={title} className="bg-[#0c0c0c] p-8 hover:bg-[#111111] transition-colors duration-300">
                <div className="w-8 h-0.5 bg-[#c8102e] mb-6" />
                <h3 className="font-heading text-xl text-white font-bold mb-3">{title}</h3>
                <p className="text-white/45 text-sm leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-16 text-center">
          <button
            onClick={() => navigate("contact")}
            className="inline-flex items-center gap-3 bg-[#c8102e] text-white px-10 py-4 font-bold tracking-[0.2em] uppercase text-xs hover:bg-[#a50d26] transition-colors"
          >
            <Phone size={14} />
            Prendre contact
          </button>
        </div>
      </div>
    </div>
  )
}

// --- Contact Page -------------------------------------------------------------
function ContactPage({ settings }: { settings: SiteSettings }) {
  const facebookUrl = settings.facebook || DEFAULT_SETTINGS.facebook

  return (
    <div className="pt-16">
      <div className="py-24 px-6 text-center">
        <span className="text-[#c8102e] text-[10px] tracking-[0.35em] uppercase block mb-4">Nous joindre</span>
        <h1 className="font-heading text-5xl md:text-6xl text-white font-bold tracking-tight">Contact</h1>
      </div>

      <div className="max-w-7xl mx-auto px-6 pb-24">
        {/* Big phone CTA */}
        <div className="bg-[#111111] border border-white/8 p-8 md:p-12 mb-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <p className="text-white/35 text-[10px] tracking-[0.3em] uppercase mb-2">Appel direct</p>
            <a
              href={`tel:${settings.phone.replace(/\s/g, "")}`}
              className="font-heading text-4xl md:text-5xl text-white font-bold tracking-tight hover:text-[#c8102e] transition-colors block"
            >
              {settings.phone}
            </a>
            <p className="text-white/35 text-xs mt-1.5">La façon la plus rapide de nous joindre</p>
          </div>
          <a
            href={`tel:${settings.phone.replace(/\s/g, "")}`}
            className="shrink-0 flex items-center gap-3 bg-[#c8102e] text-white px-8 py-4 font-bold tracking-[0.2em] uppercase text-xs hover:bg-[#a50d26] transition-colors"
          >
            <Phone size={15} />
            Appeler maintenant
          </a>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-8">
          <div className="bg-[#111111] border border-white/14 p-8 md:p-10">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-9">
              <div>
                <p className="text-[#c8102e] text-[10px] tracking-[0.3em] uppercase mb-2">Informations pratiques</p>
                <h3 className="font-heading text-3xl md:text-4xl text-white font-bold tracking-tight">Passez directement au garage</h3>
              </div>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${settings.address} ${settings.postalCode} ${settings.city}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 border border-white/25 text-white px-5 py-3 text-xs font-bold tracking-[0.16em] uppercase hover:border-white/50 transition-colors"
              >
                <MapPin size={14} />
                Itinéraire
              </a>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-white/10">
              <div className="bg-[#0c0c0c] p-6">
                <p className="text-white/40 text-[10px] tracking-[0.22em] uppercase mb-3">Adresse</p>
                <p className="text-white text-lg font-semibold leading-relaxed">{settings.address}<br />{settings.postalCode} {settings.city}</p>
              </div>
              <div className="bg-[#0c0c0c] p-6">
                <p className="text-white/40 text-[10px] tracking-[0.22em] uppercase mb-3">Téléphone</p>
                <a href={`tel:${settings.phone.replace(/\s/g, "")}`} className="text-white text-lg font-semibold hover:text-[#c8102e] transition-colors block">
                  {settings.phone}
                </a>
                {settings.phone2 && (
                  <a href={`tel:${settings.phone2.replace(/\s/g, "")}`} className="text-white/65 text-sm hover:text-[#c8102e] transition-colors block mt-1">
                    {settings.phone2}
                  </a>
                )}
              </div>
              {settings.email && (
                <div className="bg-[#0c0c0c] p-6">
                  <p className="text-white/40 text-[10px] tracking-[0.22em] uppercase mb-3">E-mail</p>
                  <a href={`mailto:${settings.email}`} className="text-white text-base font-semibold hover:text-[#c8102e] transition-colors break-all">
                    {settings.email}
                  </a>
                </div>
              )}
              <div className="bg-[#0c0c0c] p-6">
                <p className="text-white/40 text-[10px] tracking-[0.22em] uppercase mb-3">Facebook</p>
                <a href={facebookUrl} target="_blank" rel="noopener noreferrer" className="text-white text-base font-semibold hover:text-[#c8102e] transition-colors">
                  AMC Auto Moto
                </a>
              </div>
              <div className="bg-[#0c0c0c] p-6 md:col-span-2">
                <p className="text-white/40 text-[10px] tracking-[0.22em] uppercase mb-3">Horaires</p>
                <div className="space-y-2">
                  {settings.hours.map(({ day, hours }) => (
                    <div key={day} className="flex justify-between gap-6 text-sm">
                      <span className="text-white/55">{day}</span>
                      <span className={hours === "Fermé" ? "text-[#c8102e]" : "text-white"}>{hours}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              <a
                href={`tel:${settings.phone.replace(/\s/g, "")}`}
                className="flex items-center justify-center gap-3 bg-[#c8102e] text-white px-8 py-4 font-bold tracking-[0.18em] uppercase text-xs hover:bg-[#a50d26] transition-colors"
              >
                <Phone size={14} />
                Appeler maintenant
              </a>
              {settings.email && (
                <a
                  href={`mailto:${settings.email}`}
                  className="flex items-center justify-center gap-3 border border-white/20 text-white/80 px-8 py-4 font-bold tracking-[0.18em] uppercase text-xs hover:border-white/45 hover:text-white transition-colors"
                >
                  <Mail size={14} />
                  Envoyer un e-mail
                </a>
              )}
              <a
                href={facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-3 border border-white/20 text-white/80 px-8 py-4 font-bold tracking-[0.18em] uppercase text-xs hover:border-white/45 hover:text-white transition-colors"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5"><path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.886v2.267h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/></svg>
                Page Facebook
              </a>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div className="bg-[#111111] border border-white/14 p-8">
              <p className="text-[#c8102e] text-[10px] tracking-[0.3em] uppercase mb-3">Réponse rapide</p>
              <h3 className="font-heading text-2xl text-white font-bold tracking-tight mb-4">{settings.contactAdviceTitle}</h3>
              <div className="space-y-3 text-sm text-white/60 leading-relaxed">
                <p>{settings.contactAdviceText1}</p>
                <p>{settings.contactAdviceText2}</p>
              </div>
            </div>

            <div className="overflow-hidden border border-white/14 h-80 lg:flex-1 min-h-80 bg-[#1a1a1a]">
              <iframe
                src="https://www.openstreetmap.org/export/embed.html?bbox=6.1026%2C48.7777%2C6.1426%2C48.7977&layer=mapnik&marker=48.787695%2C6.122555"
                width="100%"
                height="100%"
                title="AMC Auto Moto - Marbache"
                className="grayscale opacity-80"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// --- App Root -----------------------------------------------------------------
export default function App() {
  const [page, setPage] = useState<Page>("accueil")
  const [offers, setOffers] = useState<Offer[]>([])
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS)

  useEffect(() => {
    api.getOffers().then(setOffers).catch(err => console.log("Erreur chargement offres:", err))
    api.getSettings().then(s => {
      if (s && Object.keys(s).length > 0) setSettings({ ...DEFAULT_SETTINGS, ...s })
    }).catch(err => console.log("Erreur chargement settings:", err))
  }, [])

  const navigate = (p: Page) => {
    setPage(p)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const isAdminPage = page === "admin"

  return (
    <div className="min-h-screen bg-[#0c0c0c] text-white overflow-x-hidden">
      {!isAdminPage && <Navbar current={page} navigate={navigate} settings={settings} />}

      <main>
        <AnimatePresence mode="wait">
          {page === "accueil"  && <HomePage  key="accueil"  navigate={navigate} settings={settings} />}
          {page === "services" && (
            <motion.div key="services" {...pageTransition}><ServicesPage navigate={navigate} settings={settings} /></motion.div>
          )}
          {page === "galerie"  && (
            <motion.div key="galerie"  {...pageTransition}><GaleriePage offers={offers} settings={settings} /></motion.div>
          )}
          {page === "apropos"  && (
            <motion.div key="apropos"  {...pageTransition}><AProposPage navigate={navigate} settings={settings} /></motion.div>
          )}
          {page === "contact"  && (
            <motion.div key="contact"  {...pageTransition}><ContactPage settings={settings} /></motion.div>
          )}
          {page === "admin"    && (
            <motion.div key="admin"    {...pageTransition}><AdminPage offers={offers} setOffers={setOffers} settings={settings} setSettings={setSettings} navigate={navigate} /></motion.div>
          )}
        </AnimatePresence>
      </main>

      {!isAdminPage && <Footer navigate={navigate} settings={settings} />}
    </div>
  )
}

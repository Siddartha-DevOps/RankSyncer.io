import React, { useState, useRef } from 'react';
import { 
  Copy, 
  Check, 
  Download, 
  Sparkles, 
  Image as ImageIcon, 
  Moon, 
  Sun,
  Layers,
  FileText,
  Bookmark,
  ChevronRight,
  Shield,
  Zap,
  CheckCircle2,
  Terminal,
  ExternalLink
} from 'lucide-react';

interface BrandIdentityCenterProps {
  currentTheme: 'light' | 'dark';
  onChangeTheme: (theme: 'light' | 'dark') => void;
}

export default function BrandIdentityCenter({ currentTheme, onChangeTheme }: BrandIdentityCenterProps) {
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [copiedSvg, setCopiedSvg] = useState<string | null>(null);
  const [logoText, setLogoText] = useState('RankSyncer');
  const [tldText, setTldText] = useState('.co');
  const [logoVariant, setLogoVariant] = useState<'full' | 'icon' | 'monochrome' | 'inverted'>('full');
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const colors = {
    primary: { hex: '#4ade80', label: 'Emerald Light', usage: 'Hover States & Accents' },
    primaryCore: { hex: '#22c55e', label: 'Emerald Core', usage: 'Primary Branding & CTA' },
    background: { hex: '#050d0a', label: 'Ink Black', usage: 'Main Background & Dashboard Canvas' },
    surface: { hex: '#0c1612', label: 'Forest Glass', usage: 'Cards, Modals & Sidebars' },
    border: { hex: '#14271f', label: 'Emerald Rim', usage: 'Borders & Structural Outlines' },
    textMuted: { hex: '#6b7280', label: 'Slate Muted', usage: 'Secondary details & Labels' },
    glow: { hex: 'rgba(34, 197, 94, 0.15)', label: 'Emerald Aura', usage: 'Glassmorphism glow filters' }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedToken(id);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  // SVG representation matching: leftmost 3 ascending bars + overlapping rightmost sync/circular arrow
  const getSvgCode = (variant: 'full' | 'icon' | 'monochrome' | 'inverted', darkTextBg = true) => {
    let iconColor = '#22c55e'; // default green
    let textColor = darkTextBg ? '#ffffff' : '#050d0a';
    let tldColor = '#4ade80';

    if (variant === 'monochrome') {
      iconColor = darkTextBg ? '#ffffff' : '#050d0a';
      textColor = darkTextBg ? '#ffffff' : '#050d0a';
      tldColor = darkTextBg ? '#ffffff' : '#050d0a';
    } else if (variant === 'inverted') {
      iconColor = '#050d0a';
      textColor = '#22c55e';
      tldColor = '#10b981';
    }

    const svgIcon = `
  <g transform="translate(15, 12)">
    <!-- Ascending ranking bars with elegant rounded borders -->
    <rect x="0" y="24" width="6" height="12" rx="2" fill="${iconColor}" />
    <rect x="10" y="14" width="6" height="22" rx="2" fill="${iconColor}" />
    <rect x="20" y="4" width="6" height="32" rx="2" fill="${iconColor}" opacity="0.9" />
    
    <!-- Sync arc arrow overlapping -->
    <path d="M 12 6 C 18 6, 28 10, 28 20 C 28 27, 21 32, 14 31" fill="none" stroke="${iconColor}" stroke-width="3.5" stroke-linecap="round" />
    <path d="M 10 31 L 15 27 M 10 31 L 16 35" stroke="${iconColor}" stroke-dasharray="none" stroke-width="3" stroke-linecap="round" />
  </g>`;

    if (variant === 'icon') {
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64" fill="none">
  ${svgIcon}
</svg>`;
    }

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 64" width="240" height="64" fill="none">
  ${svgIcon}
  <!-- Wordmark -->
  <text x="62" y="38" font-family="'Inter', sans-serif" font-size="22" font-weight="700" fill="${textColor}" letter-spacing="-0.5">${logoText}<tspan fill="${tldColor}" font-weight="900">${tldText}</tspan></text>
</svg>`;
  };

  const handleCopySvg = (v: 'full' | 'icon' | 'monochrome' | 'inverted') => {
    const code = getSvgCode(v).trim();
    navigator.clipboard.writeText(code);
    setCopiedSvg(v);
    setTimeout(() => setCopiedSvg(null), 2000);
  };

  // Convert rendered canvas state directly to PNG file download
  const generatePngDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Reset dimensions
    canvas.width = logoVariant === 'icon' ? 512 : 960;
    canvas.height = 512;

    // Background color based on variant
    ctx.fillStyle = logoVariant === 'inverted' ? '#4ade80' : '#050d0a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Apply scaling for sharp text
    const scale = logoVariant === 'icon' ? 6 : 4;
    ctx.save();
    
    if (logoVariant === 'icon') {
      // Centered Large Icon Drawing
      ctx.translate(canvas.width / 2 - 90, canvas.height / 2 - 100);
      ctx.scale(5, 5);
      
      const iconClr = '#22c55e';
      ctx.fillStyle = iconClr;
      ctx.strokeStyle = iconClr;
      ctx.lineWidth = 3.5;
      ctx.lineCap = 'round';

      // Bar 1
      ctx.beginPath();
      ctx.roundRect(0, 24, 6, 12, 2);
      ctx.fill();

      // Bar 2
      ctx.beginPath();
      ctx.roundRect(10, 14, 6, 22, 2);
      ctx.fill();

      // Bar 3
      ctx.beginPath();
      ctx.roundRect(20, 4, 6, 32, 2);
      ctx.fill();

      // Sync circular arc arrow
      ctx.beginPath();
      ctx.arc(17, 18, 12, -Math.PI / 1.5, Math.PI / 1.2);
      ctx.stroke();

      // Arrow head
      ctx.beginPath();
      ctx.moveTo(10, 31);
      ctx.lineTo(15, 27);
      ctx.moveTo(10, 31);
      ctx.lineTo(16, 35);
      ctx.stroke();

    } else {
      // Full Logo Wordmark Centered
      ctx.translate(canvas.width / 2 - 240, canvas.height / 2 - 50);
      ctx.scale(2, 2);

      let iconClr = logoVariant === 'monochrome' ? '#ffffff' : '#22c55e';
      let textClr = logoVariant === 'monochrome' ? '#ffffff' : '#ffffff';
      let tldClr = logoVariant === 'monochrome' ? '#ffffff' : '#4ade80';

      ctx.fillStyle = iconClr;
      ctx.strokeStyle = iconClr;
      ctx.lineWidth = 3.5;
      ctx.lineCap = 'round';

      // Draw Bars
      ctx.beginPath();
      ctx.roundRect(15, 24, 6, 12, 2);
      ctx.fill();

      ctx.beginPath();
      ctx.roundRect(25, 14, 6, 22, 2);
      ctx.fill();

      ctx.beginPath();
      ctx.roundRect(35, 4, 6, 32, 2);
      ctx.fill();

      // Sync arc string
      ctx.beginPath();
      ctx.arc(32, 18, 12, -Math.PI / 1.5, Math.PI / 1.2);
      ctx.stroke();

      // Arrow Head
      ctx.beginPath();
      ctx.moveTo(25, 31);
      ctx.lineTo(30, 27);
      ctx.moveTo(25, 31);
      ctx.lineTo(31, 35);
      ctx.stroke();

      // Text Wordmark
      ctx.fillStyle = textClr;
      ctx.font = 'bold 24px "Inter", sans-serif';
      ctx.fillText(logoText, 68, 32);

      // Tld dot/com text
      ctx.fillStyle = tldClr;
      const textWidth = ctx.measureText(logoText).width;
      ctx.fillText(tldText, 68 + textWidth, 32);
    }

    ctx.restore();

    // Trigger direct image binary download
    try {
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `${logoText.toLowerCase()}-brand-${logoVariant}.png`;
      link.href = dataUrl;
      link.click();
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-[#050d0a] text-slate-100 font-sans pb-24 relative overflow-hidden">
      
      {/* Decorative emerald cyber matrix grids */}
      <div 
        className="absolute inset-0 pointer-events-none z-0 opacity-15" 
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(74, 222, 128, 0.08) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(74, 222, 128, 0.08) 1px, transparent 1px)
          `,
          backgroundSize: '36px 36px'
        }}
      />

      {/* Extreme ambient back glows */}
      <div className="absolute top-[20%] left-10 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-[20%] right-10 w-[400px] h-[400px] bg-teal-500/10 rounded-full blur-[100px] pointer-events-none z-0" />

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 relative z-10 space-y-12">
        
        {/* Upper Header layout */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-[#14271f] pb-8">
          <div>
            <div className="flex items-center space-x-2.5">
              <span className="bg-emerald-500/20 border border-emerald-400/30 text-emerald-400 text-[10px] font-black uppercase px-2.5 py-1 rounded-full tracking-wider">
                RankSyncer Brand Asset System
              </span>
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            
            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight leading-none mt-2.5">
              RankSyncer.co <span className="text-[#4ade80]">Brand Identity</span>
            </h1>
            <p className="text-slate-400 text-sm mt-1.5 max-w-xl">
              Official technical assets, vector SVG layouts, live color system token guides, and high-contrast dark dashboard styling guidelines.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => onChangeTheme(currentTheme === 'light' ? 'dark' : 'light')}
              className="px-4 py-2.5 bg-[#0c1612] border border-[#14271f] hover:border-emerald-500 text-xs font-bold rounded-xl flex items-center gap-2 text-slate-350 transition-all cursor-pointer"
            >
              {currentTheme === 'light' ? <Moon className="h-3.5 w-3.5 text-emerald-400" /> : <Sun className="h-3.5 w-3.5 text-emerald-400" />}
              <span>Toggle Live App Preview Link Theme ({currentTheme})</span>
            </button>
          </div>
        </div>

        {/* 1. BRAND STRATEGY SUMMARY MATRICES */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#0c1612]/80 p-6 rounded-2xl border border-[#14271f] hover:border-[#22c55e]/40 transition-all">
            <h3 className="text-xs font-black text-emerald-405 tracking-wider uppercase text-[#4ade80] mb-3">Logo Concept</h3>
            <p className="text-xs text-slate-350 mb-3 leading-relaxed">
              An elegant combination representing high-performance automation:
            </p>
            <ul className="space-y-2 text-[11px] text-slate-400">
              <li className="flex items-start gap-2">
                <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Ascending Bars</strong> represent climbing keyword search rank metrics in Google or Bing.</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Sync Arc Arrow</strong> represents autonomic scheduled script content pushes directly to Webhooks.</span>
              </li>
            </ul>
          </div>

          <div className="bg-[#0c1612]/80 p-6 rounded-2xl border border-[#14271f] hover:border-[#22c55e]/40 transition-all">
            <h3 className="text-xs font-black text-emerald-405 tracking-wider uppercase text-[#4ade80] mb-3">Brand Tone</h3>
            <p className="text-xs text-slate-350 mb-3 leading-relaxed">
              Constructing absolute confidence for high-volume content developers:
            </p>
            <div className="grid grid-cols-2 gap-2 text-[11px] text-center font-bold">
              <span className="bg-[#14271f] text-[#4ade80] py-1.5 rounded-lg border border-emerald-900/40">Technical</span>
              <span className="bg-[#14271f] text-[#4ade80] py-1.5 rounded-lg border border-emerald-900/40">Confident</span>
              <span className="bg-[#14271f] text-[#4ade80] py-1.5 rounded-lg border border-emerald-900/40">Automation-First</span>
              <span className="bg-[#14271f] text-[#4ade80] py-1.5 rounded-lg border border-emerald-900/40">Autonomic Code</span>
            </div>
          </div>

          <div className="bg-[#0c1612]/80 p-6 rounded-2xl border border-[#14271f] hover:border-[#22c55e]/40 transition-all">
            <h3 className="text-xs font-black text-emerald-405 tracking-wider uppercase text-[#4ade80] mb-3">UI Architecture Style</h3>
            <p className="text-xs text-slate-350 mb-3 leading-relaxed">
              A high-end dark command desk tailored for technical developers:
            </p>
            <ul className="space-y-2 text-[11px] text-slate-400">
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span>Deep Ink Canvas Background (<code className="text-emerald-300">#050d0a</code>)</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span>Emerald Neon Glow overlays</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span>Translucent glass panels (<code className="text-emerald-300">#0c1612</code>)</span>
              </li>
            </ul>
          </div>
        </div>

        {/* 2. LIVE INTERACTIVE LOGO VARIANTS ENGINE (SVG + COPY SYSTEM) */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-extrabold tracking-tight text-white flex items-center gap-2">
              <span>Vector SVG Core Rendering & Export Variants</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-400/20 px-2 py-0.5 rounded-full">SVG XML output</span>
            </h2>
            <span className="text-xs text-slate-500 font-mono">100% vector scale responsive</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            
            {/* Variant 1: Full Logo */}
            <div className="bg-[#0c1612] p-6 rounded-3xl border border-[#14271f] flex flex-col justify-between h-48 relative overflow-hidden group hover:border-emerald-500 transition-all">
              <span className="absolute top-3 right-3 text-[9px] text-[#4ade80] uppercase tracking-wider font-extrabold bg-[#14271f] px-2 py-0.5 rounded-full">Variant A</span>
              <div className="flex-1 flex items-center justify-center p-4">
                <div dangerouslySetInnerHTML={{ __html: getSvgCode('full') }} />
              </div>
              <div className="pt-3 border-t border-[#14271f] flex justify-between items-center text-xs">
                <span className="font-extrabold text-white text-[11px]">Full Logo Wordmark</span>
                <button 
                  onClick={() => handleCopySvg('full')}
                  className="p-1.5 bg-[#14271f] hover:bg-emerald-600 rounded-lg text-slate-350 hover:text-white transition-all cursor-pointer"
                  title="Copy Raw SVG Code"
                >
                  {copiedSvg === 'full' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>

            {/* Variant 2: Icon Only */}
            <div className="bg-[#0c1612] p-6 rounded-3xl border border-[#14271f] flex flex-col justify-between h-48 relative overflow-hidden group hover:border-emerald-500 transition-all">
              <span className="absolute top-3 right-3 text-[9px] text-[#4ade80] uppercase tracking-wider font-extrabold bg-[#14271f] px-2 py-0.5 rounded-full">Variant B</span>
              <div className="flex-1 flex items-center justify-center p-4">
                <div dangerouslySetInnerHTML={{ __html: getSvgCode('icon') }} className="h-16 w-16" />
              </div>
              <div className="pt-3 border-t border-[#14271f] flex justify-between items-center text-xs">
                <span className="font-extrabold text-white text-[11px]">Symbol Icon Only</span>
                <button 
                  onClick={() => handleCopySvg('icon')}
                  className="p-1.5 bg-[#14271f] hover:bg-emerald-600 rounded-lg text-slate-350 hover:text-white transition-all cursor-pointer"
                  title="Copy Raw SVG Code"
                >
                  {copiedSvg === 'icon' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>

            {/* Variant 3: Monochrome */}
            <div className="bg-[#0c1612] p-6 rounded-3xl border border-[#14271f] flex flex-col justify-between h-48 relative overflow-hidden group hover:border-emerald-500 transition-all">
              <span className="absolute top-3 right-3 text-[9px] text-[#4ade80] uppercase tracking-wider font-extrabold bg-[#14271f] px-2 py-0.5 rounded-full">Variant C</span>
              <div className="flex-1 flex items-center justify-center p-4">
                <div dangerouslySetInnerHTML={{ __html: getSvgCode('monochrome') }} />
              </div>
              <div className="pt-3 border-t border-[#14271f] flex justify-between items-center text-xs">
                <span className="font-extrabold text-white text-[11px]">Monochrome White</span>
                <button 
                  onClick={() => handleCopySvg('monochrome')}
                  className="p-1.5 bg-[#14271f] hover:bg-emerald-600 rounded-lg text-slate-350 hover:text-white transition-all cursor-pointer"
                  title="Copy Raw SVG Code"
                >
                  {copiedSvg === 'monochrome' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>

            {/* Variant 4: Inverted */}
            <div className="bg-[#4ade80] p-6 rounded-3xl border border-[#4ade80] flex flex-col justify-between h-48 relative overflow-hidden group transition-all">
              <span className="absolute top-3 right-3 text-[9px] text-[#050d0a] uppercase tracking-wider font-black bg-[#faf8f9]/50 px-2 py-0.5 rounded-full">Variant D</span>
              <div className="flex-1 flex items-center justify-center p-4">
                <div dangerouslySetInnerHTML={{ __html: getSvgCode('inverted', false) }} />
              </div>
              <div className="pt-3 border-t border-emerald-600 flex justify-between items-center text-xs">
                <span className="font-black text-[#050d0a] text-[11px]">Inverted Dark Theme</span>
                <button 
                  onClick={() => handleCopySvg('inverted')}
                  className="p-1.5 bg-[#050d0a] hover:bg-[#0c1612] rounded-lg text-white transition-all cursor-pointer"
                  title="Copy Inverted SVG Code"
                >
                  {copiedSvg === 'inverted' ? <Check className="h-3.5 w-3.5 text-[#4ade80]" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* 3. HTML5 LIVE PNG/FAVICON RENDERING ENGINE & CUSTOMIZER */}
        <div id="png-generator" className="bg-[#0c1612]/90 border border-[#14271f] rounded-3xl p-6.5 relative overflow-hidden">
          
          <div className="absolute right-0 top-0 h-40 w-40 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            
            <div className="space-y-4 text-left">
              <div className="inline-flex items-center gap-2 bg-[#14271f] text-emerald-400 text-[10px] font-black uppercase px-2 py-1 rounded">
                <Settings className="h-3 w-3" />
                <span>Live Customizer Hub</span>
              </div>
              <h3 className="text-xl font-black text-white tracking-tight">Active Canvas Brand Generator</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Generate high-definition transparent PNG files or square ico assets directly in your web browser. Type your custom text parameters below and hit compilation export!
              </p>

              <div className="space-y-3 pt-2">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-500 font-mono block mb-1">Brand Wordmark</label>
                    <input 
                      type="text" 
                      className="w-full bg-[#050d0a] text-white border border-[#14271f] font-mono text-xs rounded-xl px-3 py-2.5 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                      value={logoText}
                      onChange={(e) => setLogoText(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-500 font-mono block mb-1">Domain Extension</label>
                    <input 
                      type="text" 
                      className="w-full bg-[#050d0a] text-white border border-[#14271f] font-mono text-xs rounded-xl px-3 py-2.5 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                      value={tldText}
                      onChange={(e) => setTldText(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-500 font-mono block mb-1">Asset Generation Scale</label>
                  <div className="flex gap-2">
                    {[
                      { id: 'full', label: 'Full PNG Wordmark (960x512)' },
                      { id: 'icon', label: 'Square Icon / Favicon (512x512)' },
                      { id: 'monochrome', label: 'Monochrome Logo (960x512)' },
                      { id: 'inverted', label: 'Inverted Solid Background' }
                    ].map((v) => (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => setLogoVariant(v.id as any)}
                        className={`flex-1 py-2 text-[10px] font-extrabold rounded-lg border transition-all cursor-pointer ${
                          logoVariant === v.id 
                            ? 'bg-emerald-500/20 border-emerald-500 text-white' 
                            : 'bg-[#050d0a] border-[#14271f] text-slate-400 hover:text-white'
                        }`}
                      >
                        {v.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-4 flex gap-3.5">
                <button
                  onClick={generatePngDownload}
                  className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-650 hover:from-emerald-600 hover:to-teal-800 text-slate-950 font-black text-xs rounded-xl transition-all shadow-md shadow-emerald-500/10 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5 stroke-[2.5]" />
                  <span>Download Transparent PNG Asset</span>
                </button>
                {downloadSuccess && (
                  <span className="text-emerald-400 text-xs font-bold font-mono self-center animate-pulse">
                    ✓ Compiled package downloaded!
                  </span>
                )}
              </div>
            </div>

            {/* Hidden canvas used exclusively for compiling PNG */}
            <canvas ref={canvasRef} className="hidden" />

            {/* Live Visual Canvas Preview box */}
            <div className="bg-[#050d0a] p-8 aspect-video rounded-2xl border border-[#14271f] flex flex-col items-center justify-center text-center relative shadow-inner">
              <span className="absolute bottom-2 right-3 font-mono text-[9px] text-[#4ade80]/60">WYSIWYG Sandbox Web Preview</span>
              <div className="space-y-4">
                <div className={`p-6 py-8 rounded-xl flex items-center justify-center gap-4 border border-[#14271f]/60 ${logoVariant === 'inverted' ? 'bg-[#4ade80] text-[#050d0a]' : 'bg-[#050d0a] text-white'}`}>
                  {/* Ascending bars icon */}
                  <div className="flex items-end gap-1.5 h-12 relative w-12 shrink-0">
                    <span className={`w-2.5 h-5 rounded-sm transition-colors ${logoVariant === 'inverted' ? 'bg-[#050d0a]' : logoVariant === 'monochrome' ? 'bg-white' : 'bg-[#22c55e]'}`} />
                    <span className={`w-2.5 h-8 rounded-sm transition-colors ${logoVariant === 'inverted' ? 'bg-[#050d0a]' : logoVariant === 'monochrome' ? 'bg-white' : 'bg-[#22c55e]'}`} />
                    <span className={`w-2.5 h-12 rounded-sm transition-colors ${logoVariant === 'inverted' ? 'bg-[#050d0a]' : logoVariant === 'monochrome' ? 'bg-white' : 'bg-[#22c55e]'} opacity-90`} />
                    {/* Sync Circular Arrow overlay */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className={`h-8 w-8 rounded-full border-2 border-dashed ${logoVariant === 'inverted' ? 'border-[#050d0a]/60' : logoVariant === 'monochrome' ? 'border-white/65' : 'border-emerald-500/80'} rotate-45`} />
                    </div>
                  </div>

                  {logoVariant !== 'icon' && (
                    <h2 className={`text-2xl font-black tracking-tighter ${logoVariant === 'inverted' ? 'text-slate-950' : 'text-white'}`}>
                      {logoText}
                      <span className={`font-black ${logoVariant === 'inverted' ? 'text-slate-900 opacity-60' : logoVariant === 'monochrome' ? 'text-white/60' : 'text-[#4ade80]'}`}>{tldText}</span>
                    </h2>
                  )}
                </div>
                
                <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                  Scale: {logoVariant === 'icon' ? '512x512 aspect icon layout' : '960x512 layout with embedded transparency'}
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* 4. DESIGN Tokens Color & CSS Integrations */}
        <div id="design-tokens" className="space-y-4">
          <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
            <span>Official UI Design Tokens System</span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Color Palette Cards */}
            <div className="bg-[#0c1612] rounded-3xl border border-[#14271f] p-6 text-left space-y-4">
              <h3 className="text-xs font-black uppercase text-[#4ade80] tracking-wider mb-2">Primary Color Hex Swatches</h3>
              <div className="space-y-3">
                {Object.entries(colors).map(([key, item]) => (
                  <div key={key} className="flex items-center justify-between p-2.5 bg-[#050d0a] rounded-xl border border-[#14271f] group hover:border-[#4ade80]/45 transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="h-8 w-8 rounded-lg border border-[#14271f] shrink-0" style={{ backgroundColor: item.hex }} />
                      <div>
                        <p className="text-xs font-black text-white">{item.label}</p>
                        <p className="text-[10px] text-slate-500">{item.usage}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <code className="text-[11px] font-mono text-[#4ade80] font-bold bg-[#14271f] px-2 py-0.5 rounded">{item.hex}</code>
                      <button
                        onClick={() => copyToClipboard(item.hex, key)}
                        className="p-1 border border-[#14271f] hover:border-emerald-500 hover:bg-[#14271f] rounded text-[#4ade80]"
                      >
                        {copiedToken === key ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tailwind Configuration object Code box */}
            <div className="bg-[#0c1612] rounded-3xl border border-[#14271f] p-6 text-left flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-xs font-black uppercase text-[#4ade80] tracking-wider">Tailwind CSS Variable Integrations</h3>
                  <span className="text-[9px] font-mono text-slate-500">Theme extension</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  Define these tokens inside your <code className="text-[#4ade80]">tailwind.config.js</code> or global CSS theme tag variables to accurately capture the Ink Black and Emerald neon styling values:
                </p>
                <div className="bg-[#050d0a] p-3.5 rounded-xl border border-[#14271f] text-[10px] text-emerald-300 font-mono overflow-x-auto select-all leading-tight">
                  <pre>{`theme: {
  extend: {
    colors: {
      ranksyncer: {
        black: '#050d0a',
        forest: '#0c1612',
        rim: '#14271f',
        emerald: '#22c55e',
        neon: '#4ade80',
        glow: 'rgba(34, 197, 94, 0.15)'
      }
    },
    boxShadow: {
      'glass-emerald': '0 8px 32px 0 rgba(74, 222, 128, 0.05)',
      'rim-glow': '0 0 20px 0 rgba(34, 197, 94, 0.12)'
    }
  }
}`}</pre>
                </div>
              </div>

              <button
                type="button"
                onClick={() => copyToClipboard(`ranksyncer: { black: '#050d0a', forest: '#0c1612', rim: '#14271f', emerald: '#22c55e', neon: '#4ade80' }`, 'tailwind')}
                className="mt-4 w-full py-2.5 bg-[#14271f] hover:bg-emerald-600 border border-emerald-550/20 text-white font-extrabold text-xs rounded-xl transition-colors text-center cursor-pointer"
              >
                Copy Tailwind Configuration Module
              </button>
            </div>

          </div>
        </div>

        {/* 5. BRAND GUIDELINES MANUAL BLOCK */}
        <div id="guidelines" className="bg-[#0c1612] p-6.5 rounded-3xl border border-[#14271f] text-left">
          <h2 className="text-sm font-black text-[#4ade80] uppercase tracking-wider mb-4">Brand Guidelines & Voice</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-xs text-slate-400">
            <div className="space-y-4">
              <div>
                <h4 className="font-extrabold text-white mb-1 tracking-tight">Typography Pairing Guidance</h4>
                <p className="leading-relaxed">
                  Always use the pure Google Font <strong className="text-emerald-400">"Inter"</strong> as the primary typeface. Pairing consists of heavy weights for displays for high structural emphasis:
                </p>
                <div className="space-y-1.5 mt-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] text-slate-500">Headlines</span>
                    <span className="font-serif text-slate-350 font-black">Inter SemiBold / Black, tracking-tight (-0.05em)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] text-slate-500">Body text</span>
                    <span className="font-sans text-slate-350 text-xs">Inter Regular, space-y structure, color slate-400</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] text-slate-500">Technical</span>
                    <span className="font-mono text-slate-350 text-[10px] text-emerald-300">JetBrains Mono / Fira Code (For scores & stats tables)</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-extrabold text-white mb-1 tracking-tight">Minimum Clearspace Requirements</h4>
                <p className="leading-relaxed">
                  The full wordmark and icon MUST always maintain a clearspace equivalent to 50% of the total symbol height. Do not crowd the icon with external graphics, banners, or lines.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="font-extrabold text-white mb-1 tracking-tight">Voice, Character & Tone Checklist</h4>
                <p className="leading-relaxed mb-3">
                  When composing technical texts or simulated email notifications, the system must speak with a high degree of confidence:
                </p>
                <div className="space-y-2 text-[11px] text-slate-350">
                  <div className="flex items-start gap-2">
                    <span className="text-emerald-400 font-extrabold">✓ Confidence:</span>
                    <span>Speak in metrics and absolute authority increments. Focus on rankings, traffic gains, and automated performance.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-emerald-400 font-extrabold">✓ Automation:</span>
                    <span>Always reinforce that our robots are operating on continuous auto-pilot loops while the core site owner sleeps.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-emerald-400 font-extrabold">✓ Understated Pride:</span>
                    <span>Let the charts do the major boasting. Keep copy clean and avoid flowery marketing sentences.</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-extrabold text-white mb-1 tracking-tight">Connected Favicon Setup</h4>
                <p className="leading-relaxed">
                  For your HTML document header injection, insert the compiled high-contrast favicon SVG link into your header tag block:
                </p>
                <code className="block bg-[#050d0a] p-2 rounded border border-[#14271f] text-[9px] text-[#4ade80] font-mono select-all mt-1">
                  {`<link rel="icon" type="image/svg+xml" href="data:image/svg+xml;utf8,...">`}
                </code>
              </div>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
}

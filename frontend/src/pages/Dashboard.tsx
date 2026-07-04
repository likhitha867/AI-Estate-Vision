import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Upload, ChevronRight, Download, LogOut, Image, Sliders } from 'lucide-react';
import ChatPanel from '../chatbot/ChatPanel';
import { API_BASE_URL } from '../config';
import ProceduralHouse from '../3d/ProceduralHouse';

export default function Dashboard() {
  const [houseData, setHouseData] = useState(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [style, setStyle] = useState('modern');
  const [customInstructions, setCustomInstructions] = useState('');
  const [uploading, setUploading] = useState(false);
  const [_uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [upgradeResult, setUpgradeResult] = useState<string | null>(null);

  // Visual AI Upgrader Image States
  const [upgradedImageUrl, setUpgradedImageUrl] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'3d' | 'upgrader'>('3d');

  // Ollama Model State
  const [modelToPull, setModelToPull] = useState('llama3');
  const [pulling, setPulling] = useState(false);
  const [pullProgress, setPullProgress] = useState('');

  const navigate = useNavigate();

  const handleLogout = () => {
    toast.success('Returned to Landing Page');
    navigate('/');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setUploadedImageUrl(null);
      setUpgradedImageUrl(null);
      setUpgradeResult(null);
      setActiveTab('upgrader'); // Switch active tab to upgrader to show preview immediately
    }
  };

  const handleUploadAndGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      return toast.error('Please choose a room image first!');
    }

    setUploading(true);
    const toastId = toast.loading('Uploading room image...');

    try {
      const formData = new FormData();
      formData.append('image', selectedFile);

      // 1. Upload to local API
      const uploadRes = await fetch(`${API_BASE_URL}/api/upload`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) {
        throw new Error(uploadData.message || 'Upload failed');
      }

      setUploadedImageUrl(uploadData.url);
      
      // 1b. Upload to public tmpfiles.org bridge to get a direct URL
      let publicImageUrl = '';
      try {
        const publicFormData = new FormData();
        publicFormData.append('file', selectedFile);
        
        const publicUploadRes = await fetch('https://tmpfiles.org/api/v1/upload', {
          method: 'POST',
          body: publicFormData,
        });
        
        if (publicUploadRes.ok) {
          const publicUploadData = await publicUploadRes.json();
          if (publicUploadData.status === 'success' && publicUploadData.data?.url) {
            publicImageUrl = publicUploadData.data.url.replace('tmpfiles.org/', 'tmpfiles.org/dl/');
            console.log('Public image URL generated:', publicImageUrl);
          }
        }
      } catch (err) {
        console.warn('Failed to upload to public tmpfiles bridge:', err);
      }

      const grokApiKey = localStorage.getItem('grok_api_key') || '';
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (grokApiKey.trim()) {
        headers['x-grok-api-key'] = grokApiKey.trim();
      }

      // 2. VISION ANALYSIS: Analyze the original room image using AI vision
      toast.loading('Analyzing original room with AI Vision...', { id: toastId });
      
      let roomDescription = '';
      if (publicImageUrl) {
        try {
          const describeRes = await fetch(`${API_BASE_URL}/api/ai/describe-room`, {
            method: 'POST',
            headers,
            credentials: 'include',
            body: JSON.stringify({
              imageUrl: publicImageUrl,
              style,
              instructions: customInstructions,
            }),
          });

          if (describeRes.ok) {
            const describeData = await describeRes.json();
            roomDescription = describeData.description || '';
            console.log('Room vision analysis:', roomDescription.substring(0, 200) + '...');
          }
        } catch (err) {
          console.warn('Room vision analysis failed, using generic description:', err);
        }
      }

      // 3. Get AI design recommendations
      toast.loading('Generating upgrade design...', { id: toastId });

      const designRes = await fetch(`${API_BASE_URL}/api/ai/chat`, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({
          prompt: `Upgrade this room into a ${style} design. ${roomDescription ? 'Original room: ' + roomDescription.substring(0, 300) : ''} Instructions: ${customInstructions || 'Make it look premium and beautiful.'}`,
          model: 'llama3',
        }),
      });

      const designData = await designRes.json();
      if (!designRes.ok) {
        throw new Error(designData.error || 'AI generation failed');
      }

      setUpgradeResult(designData.response || 'Upgrade completed successfully!');
      
      // 4. Generate upgraded design image using room description for accuracy
      setImageLoading(true);
      toast.loading('Rendering upgraded room design...', { id: toastId });
      
      // Dynamic details based on style
      const styleDefaults: Record<string, string> = {
        modern: 'sleek minimalist line furniture, neutral color palette with bold accents, large windows, metal and polished wood surfaces, recessed LED lighting, abstract art',
        traditional: 'classic rich dark wood furniture, ornate detailing, warm fabrics, vintage rugs, classic chandelier, warm and cozy fireplace, traditional artwork, elegant molding',
        luxury: 'high-end designer furniture, marble surfaces, gold or brass accents, crystal chandelier, lush velvet and silk textures, grand statement pieces, sophisticated ambient lighting, premium materials',
        contemporary: 'curved lines, state-of-the-art trendy furniture, bold accent walls, mixed materials (metal, glass, and wood), smart home fixtures, current design trends',
        minimalist: 'decluttered layout, very clean open spaces, simple functional low-profile furniture, monochrome or neutral tones, natural wood and stone textures, hidden storage, zero excess decoration',
      };

      const activeStyleUpgrades = customInstructions || styleDefaults[style] || 'premium materials, elegant furniture, warm ambient lighting, beautiful finishes';

      // Build a precise prompt using the actual room description and chosen style
      let imagePrompt = '';
      if (roomDescription) {
        // Use the vision analysis to create a matching upgraded image
        imagePrompt = `A premium photorealistic 8K architectural interior design render of the room. Original room layout: ${roomDescription.substring(0, 500)}. Re-layout, re-decorate and completely transform this room into a ${style.toUpperCase()} aesthetic. Keep the SAME room dimensions, windows, doors, and camera perspective, but change the furniture layout, decorations, colors, and textures to be strictly in ${style.toUpperCase()} style. Specific upgrades to apply: ${activeStyleUpgrades}. The redesigned room must look like a professional, high-end ${style.toUpperCase()} renovation of the same space. Ultra detailed, magazine quality.`;
      } else {
        // Fallback: generic prompt if vision analysis unavailable
        imagePrompt = `A premium, photorealistic, architectural digest style 8K interior design render of a room fully redesigned in a ${style.toUpperCase()} style. Style details: ${activeStyleUpgrades}. Highly detailed interior with beautiful lighting.`;
      }
      
      const generatedUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(imagePrompt)}?width=1024&height=768&nologo=true&enhance=true&seed=${Math.floor(Math.random() * 1000000)}`;
      setUpgradedImageUrl(generatedUrl);
      
      setActiveTab('upgrader');

      toast.success('Success! AI upgraded design generated from your room.', { id: toastId });
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to complete design generation', { id: toastId });
    } finally {
      setUploading(false);
    }
  };

  const handlePullModel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modelToPull.trim()) return toast.error('Enter a valid model name');

    setPulling(true);
    setPullProgress('Starting download stream...');
    const toastId = toast.loading(`Pulling "${modelToPull}" from Ollama...`);

    try {
      const res = await fetch(`${API_BASE_URL}/api/ai/pull`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ model: modelToPull }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || data.message || 'Model download failed');
      }

      setPullProgress('Model pulled successfully!');
      toast.success(`Model "${modelToPull}" is ready!`, { id: toastId });
    } catch (err: any) {
      console.error(err);
      setPullProgress(`Error: ${err.message}`);
      toast.error(err.message || 'Failed to contact local Ollama', { id: toastId });
    } finally {
      setPulling(false);
    }
  };

  const downloadUpgradedImage = async () => {
    if (!upgradedImageUrl) return;
    const toastId = toast.loading('Preparing image for download...');
    try {
      const res = await fetch(upgradedImageUrl);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `archi-ai-redesign-${style}-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success('Design downloaded successfully!', { id: toastId });
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to download design image. Try right-clicking the image to save.', { id: toastId });
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col relative overflow-hidden text-white font-sans">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-accent/10 blur-[120px]"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-purpleGlow/10 blur-[120px]"></div>

      {/* Elegant Header */}
      <header className="w-full px-6 py-4 glass border-b border-white/10 flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-accent to-purpleGlow flex items-center justify-center shadow-[0_0_15px_rgba(0,240,255,0.4)]">
            <span className="font-bold text-black text-xl leading-none">A</span>
          </div>
          <span className="text-2xl font-bold tracking-tighter">
            Archi<span className="text-accent text-glow">AI</span> Dashboard
          </span>
        </div>
        <button 
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 active:scale-[0.98] text-gray-300 font-semibold text-sm transition-all"
        >
          <LogOut className="w-4 h-4 rotate-180" />
          Exit Dashboard
        </button>
      </header>

      {/* Main Multi-Pane Layout */}
      <main className="flex-grow flex flex-col lg:flex-row p-6 gap-6 h-[calc(100vh-80px)] overflow-hidden z-10">
        
        {/* Panel 1: Chat Assistant (Left Sidebar) */}
        <section className="w-full lg:w-1/4 glass-card border-glow flex flex-col overflow-hidden relative">
          <ChatPanel setHouseData={setHouseData} />
        </section>

        {/* Panel 2: Interactive Generator Showcase (Middle Pane) */}
        <section className="flex-grow glass-card flex flex-col relative overflow-hidden p-6">
          {/* Custom Premium Tabs */}
          <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setActiveTab('3d')}
                className={`pb-2 px-1 text-sm font-semibold tracking-wider transition-all relative ${
                  activeTab === '3d'
                    ? 'text-accent text-glow font-bold'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                3D Blueprint
                {activeTab === '3d' && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-accent shadow-[0_0_8px_rgba(0,240,255,0.8)]" />
                )}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('upgrader')}
                className={`pb-2 px-1 text-sm font-semibold tracking-wider transition-all relative ${
                  activeTab === 'upgrader'
                    ? 'text-purpleGlow font-bold'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Visual Room Upgrader
                {activeTab === 'upgrader' && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-purpleGlow shadow-[0_0_8px_rgba(157,78,221,0.8)]" />
                )}
              </button>
            </div>
            <span className="text-[10px] text-gray-500 bg-white/5 border border-white/10 px-3 py-1 rounded-full font-mono uppercase tracking-widest">
              {activeTab === '3d' ? 'Three.js Canvas' : 'AI Render Showroom'}
            </span>
          </div>

          <div className="flex-grow w-full flex flex-col overflow-y-auto min-h-0" style={{ scrollbarWidth: 'thin' }}>
            {activeTab === '3d' ? (
              <div className="flex-grow w-full items-center justify-center flex bg-black/40 rounded-2xl overflow-hidden relative border border-white/5">
                <ProceduralHouse houseData={houseData} />
              </div>
            ) : (
              <div className="flex flex-col gap-6 h-full">
                {/* Visual side-by-side comparison */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-grow min-h-[350px]">
                  {/* Left Column: Original Image */}
                  <div className="flex flex-col bg-black/40 border border-white/5 rounded-2xl p-4 overflow-hidden relative group">
                    <span className="absolute top-6 left-6 z-10 text-[10px] font-bold uppercase tracking-widest text-white bg-black/70 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
                      Original Space
                    </span>
                    <div className="flex-grow w-full flex items-center justify-center min-h-[280px]">
                      {previewUrl ? (
                        <img
                          src={previewUrl}
                          alt="Original Room Space"
                          className="w-full h-full object-cover rounded-xl shadow-lg border border-white/10"
                        />
                      ) : (
                        <div className="flex flex-col items-center gap-3 text-gray-500 py-12">
                          <Upload className="w-12 h-12 text-gray-600 animate-bounce" />
                          <p className="text-xs">Upload a room image on the right sidebar to begin</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Upgraded Image */}
                  <div className="flex flex-col bg-black/40 border border-white/5 rounded-2xl p-4 overflow-hidden relative group">
                    <span className="absolute top-6 left-6 z-10 text-[10px] font-bold uppercase tracking-widest text-accent bg-black/70 backdrop-blur-md px-3 py-1 rounded-full border border-accent/20">
                      Upgraded Design
                    </span>
                    <div className="flex-grow w-full flex items-center justify-center min-h-[280px] relative">
                      {imageLoading ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#070707]/90 rounded-xl border border-accent/20">
                          {/* Glowing circular loading animation */}
                          <div className="relative w-20 h-20 mb-4">
                            <div className="absolute inset-0 rounded-full border-4 border-accent/10"></div>
                            <div className="absolute inset-0 rounded-full border-4 border-t-accent border-r-purpleGlow animate-spin"></div>
                            <div className="absolute inset-2 bg-black rounded-full flex items-center justify-center">
                              <Sliders className="w-6 h-6 text-accent animate-pulse" />
                            </div>
                          </div>
                          <span className="text-xs font-semibold text-accent animate-pulse tracking-wider">
                            Re-designing Space...
                          </span>
                          <span className="text-[10px] text-gray-500 mt-2 font-mono">
                            Polishing rendering aesthetics
                          </span>
                        </div>
                      ) : null}

                      {upgradedImageUrl ? (
                        <img
                          src={upgradedImageUrl}
                          alt="AI Upgraded Room design"
                          onLoad={() => setImageLoading(false)}
                          onError={() => {
                            setImageLoading(false);
                            toast.error("Failed to render the upgraded room design from the AI service. Please try again.");
                          }}
                          className="w-full h-full object-cover rounded-xl shadow-lg border border-white/10"
                        />
                      ) : !imageLoading ? (
                        <div className="flex flex-col items-center gap-3 text-gray-500 py-12">
                          <Image className="w-12 h-12 text-gray-600" />
                          <p className="text-xs">Upgraded concept render will appear here</p>
                        </div>
                      ) : null}
                    </div>

                    {/* Quick Download Overlay when available */}
                    {upgradedImageUrl && !imageLoading && (
                      <div className="mt-4 flex items-center justify-between">
                        <span className="text-[10px] text-gray-400 italic">Render generated by Pollinations AI</span>
                        <button
                          onClick={downloadUpgradedImage}
                          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent text-black font-extrabold text-xs hover:brightness-110 active:scale-[0.98] transition-all shadow-[0_0_15px_rgba(0,240,255,0.4)]"
                        >
                          <Download className="w-4 h-4" />
                          Download HD Render
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* AI Upgrade Detailed Analysis */}
                {upgradeResult && (
                  <div className="bg-gradient-to-r from-accent/5 to-purpleGlow/5 border border-white/10 rounded-2xl p-6 shadow-xl relative overflow-hidden">
                    <div className="absolute -top-[50px] -right-[50px] w-24 h-24 bg-purpleGlow/20 rounded-full blur-xl"></div>
                    <h4 className="font-extrabold text-sm tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-accent to-purpleGlow uppercase mb-3 flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-accent" /> Professional AI Redesign Recommendations
                    </h4>
                    <p className="text-xs leading-relaxed text-gray-300 whitespace-pre-line bg-black/40 p-4 rounded-xl border border-white/5">
                      {upgradeResult}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Panel 3: Room Style Upgrader & Ollama Manager (Right Sidebar) */}
        <section className="w-full lg:w-1/4 flex flex-col gap-6 overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin' }}>
          
          {/* Section 3.1: Image Upload & Room Style Upgrader */}
          <div className="glass-card p-5 border border-white/10 flex flex-col gap-4">
            <div className="flex items-center gap-2 border-b border-white/10 pb-3">
              <Image className="w-5 h-5 text-accent" />
              <h3 className="font-bold text-sm uppercase tracking-wider text-gray-300">Room AI Upgrader</h3>
            </div>

            <form onSubmit={handleUploadAndGenerate} className="space-y-4">
              {/* File Dropzone */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-400">Upload Room Image</label>
                <div className="relative border border-dashed border-white/20 hover:border-accent/40 rounded-xl p-4 text-center cursor-pointer bg-white/5 transition-all">
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  {previewUrl ? (
                    <div className="flex flex-col items-center gap-2">
                      <img src={previewUrl} alt="Preview" className="w-24 h-24 object-cover rounded-lg border border-white/10" />
                      <span className="text-xs text-accent">Click to replace file</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <Upload className="w-8 h-8 text-gray-500" />
                      <span className="text-xs text-gray-400">Drag & drop or browse</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Style Presets */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-400">Design Aesthetic Style</label>
                <div className="grid grid-cols-2 gap-2">
                  {['modern', 'traditional', 'luxury', 'contemporary', 'minimalist'].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setStyle(s)}
                      className={`py-2 px-3 rounded-lg text-xs capitalize font-semibold border transition-all ${
                        style === s 
                          ? 'bg-accent/15 border-accent text-accent shadow-[0_0_10px_rgba(0,240,255,0.2)]'
                          : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom prompt instructions */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-400">Custom Directives</label>
                <textarea
                  value={customInstructions}
                  onChange={(e) => setCustomInstructions(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-lg p-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-accent"
                  rows={2}
                  placeholder="e.g. Add premium brass lighting, warm wooden floors..."
                />
              </div>

              {/* Upgrade Trigger */}
              <button
                type="submit"
                disabled={uploading || !selectedFile}
                className="w-full py-2.5 bg-gradient-to-r from-accent to-purpleGlow text-black font-extrabold rounded-lg text-xs hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? 'Analyzing and Re-designing...' : 'Upgrade Room Design'}
              </button>
            </form>

            {/* Display AI Results */}
            {upgradeResult && (
              <div className="mt-2 bg-accent/5 border border-accent/20 rounded-xl p-3 text-xs leading-relaxed text-gray-300">
                <h4 className="font-bold text-accent mb-1 flex items-center gap-1">
                  <Sliders className="w-3.5 h-3.5" /> Design Recommendation
                </h4>
                {upgradeResult}
              </div>
            )}
          </div>

          {/* Section 3.2: Ollama Local Model Downloader */}
          <div className="glass-card p-5 border border-white/10 flex flex-col gap-4">
            <div className="flex items-center gap-2 border-b border-white/10 pb-3">
              <Download className="w-5 h-5 text-purpleGlow" />
              <h3 className="font-bold text-sm uppercase tracking-wider text-gray-300">Ollama Downloader</h3>
            </div>

            <form onSubmit={handlePullModel} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-400">Ollama Model Name</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={modelToPull}
                    onChange={(e) => setModelToPull(e.target.value)}
                    className="flex-grow bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-purpleGlow"
                    placeholder="e.g., llama3.1, mistral, gemma"
                    required
                  />
                  <button
                    type="submit"
                    disabled={pulling}
                    className="px-4 bg-purpleGlow text-white font-bold rounded-lg text-xs hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                  >
                    Pull
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {pullProgress && (
                <div className="bg-white/5 border border-white/10 rounded-lg p-3 text-[10px] font-mono text-gray-400 break-words leading-normal max-h-24 overflow-y-auto">
                  {pullProgress}
                </div>
              )}
            </form>
          </div>

        </section>

      </main>
    </div>
  );
}

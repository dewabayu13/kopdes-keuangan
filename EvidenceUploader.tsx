import React, { useState, useRef } from 'react';
import { ExpenseItem, ExpenseCategory } from '../types';
import { PhotoIcon, ArrowUpTrayIcon, SparklesIcon, CameraIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { parseReceiptImage } from '../services/geminiService';

interface Props {
  onImagesLoaded: (items: Partial<ExpenseItem>[]) => void;
  category?: ExpenseCategory;
  label?: string;
  subLabel?: string;
  colorTheme?: 'purple' | 'orange';
}

export const EvidenceUploader: React.FC<Props> = ({ 
    onImagesLoaded, 
    category = ExpenseCategory.MATERIAL, 
    label = "Upload / Scan Bukti Nota",
    subLabel = "Pilih metode scan atau upload nota sesuai kebutuhan.",
    colorTheme = 'purple'
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [mode, setMode] = useState<'manual' | 'ai' | 'camera'>('manual');
  const [statusText, setStatusText] = useState("");
  const [showCamera, setShowCamera] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Theme configuration
  const themes = {
      purple: {
          bg: 'bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-100',
          iconBg: 'bg-white',
          iconColor: 'text-purple-600',
          title: 'text-purple-900',
          sub: 'text-purple-700',
          aiBtn: 'bg-indigo-600 hover:bg-indigo-700',
          aiProcessing: 'bg-indigo-400',
          manualBtn: 'bg-slate-600 hover:bg-slate-700',
      },
      orange: {
          bg: 'bg-gradient-to-r from-orange-50 to-amber-50 border-orange-100',
          iconBg: 'bg-white',
          iconColor: 'text-orange-600',
          title: 'text-orange-900',
          sub: 'text-orange-700',
          aiBtn: 'bg-orange-600 hover:bg-orange-700',
          aiProcessing: 'bg-orange-400',
          manualBtn: 'bg-stone-600 hover:bg-stone-700',
      }
  };
  const theme = themes[colorTheme];

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' }, 
        audio: false 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setShowCamera(true);
      setMode('camera');
    } catch (err) {
      console.error("Error accessing camera:", err);
      alert("Tidak dapat mengakses kamera. Pastikan izin kamera telah diberikan.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setShowCamera(false);
  };

  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const base64 = canvas.toDataURL('image/jpeg');
    
    stopCamera();
    processCapturedImage(base64);
  };

  const processCapturedImage = async (base64: string) => {
    setIsProcessing(true);
    setMode('ai');
    setStatusText("Menganalisa hasil tangkapan kamera...");

    try {
      const aiResult = await parseReceiptImage(base64);
      if (aiResult && aiResult.items && Array.isArray(aiResult.items)) {
        const date = aiResult.date || new Date().toISOString().split('T')[0];
        const mapped = aiResult.items.map((item: any) => ({
          date: date,
          category: category,
          description: item.description || "Scan Kamera",
          volume: Number(item.volume) || 1,
          unit: item.unit || "ls",
          pricePerUnit: Number(item.pricePerUnit) || 0,
          totalPrice: Number(item.totalPrice) || 0,
          phase: 1,
          evidenceImage: base64
        }));
        onImagesLoaded(mapped);
      }
    } catch (error) {
      console.error("AI Camera scan failed:", error);
      // Fallback
      onImagesLoaded([{
        date: new Date().toISOString().split('T')[0],
        category: category,
        description: "Nota (Hasil Foto)",
        volume: 1,
        unit: "ls",
        pricePerUnit: 0,
        totalPrice: 0,
        phase: 1,
        evidenceImage: base64
      }]);
    } finally {
      setIsProcessing(false);
      setStatusText("");
    }
  };

  const handleManualUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsProcessing(true);
    setMode('manual');
    setStatusText("Memproses gambar...");
    
    const fileReaders: Promise<Partial<ExpenseItem>>[] = [];

    (Array.from(files) as File[]).forEach((file) => {
        const readerPromise = new Promise<Partial<ExpenseItem>>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64 = reader.result as string;
                resolve({
                    date: new Date().toISOString().split('T')[0],
                    category: category,
                    description: "Item Baru (Edit Rincian)",
                    volume: 1,
                    unit: "ls",
                    pricePerUnit: 0,
                    totalPrice: 0,
                    phase: 1,
                    evidenceImage: base64
                });
            };
            reader.readAsDataURL(file);
        });
        fileReaders.push(readerPromise);
    });

    Promise.all(fileReaders).then((items) => {
        onImagesLoaded(items);
        setIsProcessing(false);
        setStatusText("");
        if (e.target) e.target.value = '';
    });
  };

  const handleAiUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsProcessing(true);
    setMode('ai');
    setStatusText(`Menganalisa ${files.length} nota sekaligus...`);
    
    const fileArray = Array.from(files) as File[];

    const promises = fileArray.map(async (file) => {
        try {
            const base64 = await new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.readAsDataURL(file);
            });

            const aiResult = await parseReceiptImage(base64);

            if (aiResult && aiResult.items && Array.isArray(aiResult.items) && aiResult.items.length > 0) {
                const date = aiResult.date || new Date().toISOString().split('T')[0];
                return aiResult.items.map((item: any) => ({
                    date: date,
                    category: category,
                    description: item.description || "Item Terdeteksi",
                    volume: Number(item.volume) || 1,
                    unit: item.unit || "ls",
                    pricePerUnit: Number(item.pricePerUnit) || Number(item.totalPrice) || 0,
                    totalPrice: Number(item.totalPrice) || ((Number(item.volume) || 1) * (Number(item.pricePerUnit) || 0)),
                    phase: 1,
                    evidenceImage: base64
                }));
            } else {
                throw new Error("No items detected");
            }
        } catch (error) {
            const fallbackBase64 = await new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.readAsDataURL(file);
            });
            return [{
                date: new Date().toISOString().split('T')[0],
                category: category,
                description: `Nota Gagal Scan (${file.name})`,
                volume: 1,
                unit: "ls",
                pricePerUnit: 0,
                totalPrice: 0,
                phase: 1,
                evidenceImage: fallbackBase64
            }];
        }
    });

    try {
        const results = await Promise.all(promises);
        const flattenedItems = results.flat();
        onImagesLoaded(flattenedItems);
    } catch (err) {
        console.error("Batch processing error", err);
    } finally {
        setIsProcessing(false);
        setStatusText("");
        if (e.target) e.target.value = '';
    }
  };

  const elementIdSuffix = Math.random().toString(36).substring(7);

  return (
    <>
      <div className={`${theme.bg} border rounded-lg p-4 mb-0 flex flex-col justify-center h-full`}>
        <div className="flex items-center gap-4">
          <div className={`p-2 rounded-full shadow-sm ${theme.iconBg} shrink-0`}>
             {isProcessing && (mode === 'ai' || mode === 'camera') ? (
                  <SparklesIcon className={`w-6 h-6 animate-spin ${theme.iconColor}`} />
             ) : (
                  <PhotoIcon className={`w-6 h-6 ${theme.iconColor}`} />
             )}
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className={`font-bold truncate ${theme.title}`}>
               {isProcessing ? statusText : label}
            </h3>
            <p className={`text-xs truncate ${theme.sub}`}>
               {subLabel}
            </p>
          </div>
        </div>

        <div className="flex gap-2 mt-4 justify-between">
             <button 
                onClick={startCamera}
                disabled={isProcessing}
                className={`flex-1 py-2 rounded-md font-medium text-white text-xs transition-colors flex items-center justify-center shadow-sm ${isProcessing ? 'bg-emerald-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700'}`}
             >
                <CameraIcon className="w-4 h-4 mr-1.5" />
                Kamera
             </button>

             <input
              type="file"
              id={`manual-${elementIdSuffix}`}
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleManualUpload}
              disabled={isProcessing}
             />
             <label 
              htmlFor={`manual-${elementIdSuffix}`}
              className={`flex-1 cursor-pointer py-2 rounded-md font-medium text-white text-xs transition-colors flex items-center justify-center shadow-sm ${isProcessing ? 'bg-gray-400 cursor-not-allowed' : theme.manualBtn}`}
             >
              <ArrowUpTrayIcon className="w-4 h-4 mr-1.5" />
              Manual
             </label>

             <input
              type="file"
              id={`ai-${elementIdSuffix}`}
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleAiUpload}
              disabled={isProcessing}
             />
             <label 
              htmlFor={`ai-${elementIdSuffix}`} 
              className={`flex-1 cursor-pointer py-2 rounded-md font-medium text-white text-xs transition-colors flex items-center justify-center shadow-sm ${isProcessing ? theme.aiProcessing + ' cursor-not-allowed' : theme.aiBtn}`}
             >
              <SparklesIcon className="w-4 h-4 mr-1.5" />
              AI
             </label>
        </div>
      </div>

      {/* Camera Modal */}
      {showCamera && (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center">
            <div className="relative w-full max-w-2xl bg-black overflow-hidden h-full sm:h-auto sm:aspect-video flex items-center justify-center">
                <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    className="w-full h-full object-cover sm:rounded-lg"
                />
                
                {/* Camera UI Overlay */}
                <div className="absolute top-4 right-4">
                    <button onClick={stopCamera} className="p-2 bg-white/20 hover:bg-white/40 rounded-full text-white backdrop-blur-md">
                        <XMarkIcon className="w-8 h-8" />
                    </button>
                </div>

                <div className="absolute bottom-8 left-0 right-0 flex justify-center items-center gap-8">
                    <button 
                        onClick={capturePhoto}
                        className="w-16 h-16 bg-white rounded-full border-4 border-gray-300 shadow-xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all"
                    >
                        <div className="w-12 h-12 rounded-full border-2 border-slate-900"></div>
                    </button>
                </div>
                
                {/* Guide Overlay */}
                <div className="absolute inset-0 pointer-events-none border-[30px] sm:border-[50px] border-black/30">
                    <div className="w-full h-full border-2 border-dashed border-white/50 rounded-lg flex items-center justify-center">
                         <p className="text-white/70 text-sm font-bold bg-black/40 px-3 py-1 rounded">POSISIKAN NOTA DI TENGAH</p>
                    </div>
                </div>
            </div>
            <canvas ref={canvasRef} className="hidden" />
        </div>
      )}
    </>
  );
};


import React, { useRef, useState, useEffect } from 'react';

interface CaptureInterfaceProps {
  batchSize: number;
  onUploadBatch: (images: string[]) => void;
}

const CaptureInterface: React.FC<CaptureInterfaceProps> = ({ batchSize, onUploadBatch }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  const [isReviewing, setIsReviewing] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } }, 
        audio: false 
      });
      setStream(mediaStream);
      if (videoRef.current) videoRef.current.srcObject = mediaStream;
      setCameraError(null);
    } catch (err) {
      setCameraError("Caméra non détectée ou permission refusée.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        const newImages = [...capturedImages, dataUrl];
        setCapturedImages(newImages);
        if (newImages.length >= batchSize) {
          setIsReviewing(true);
          stopCamera();
        }
      }
    }
  };

  const submitBatch = () => {
    onUploadBatch(capturedImages);
    setCapturedImages([]);
    setIsReviewing(false);
    startCamera();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 relative">
      
      {/* FLOATING HELP BUTTON */}
      <button 
        onClick={() => setShowGuide(!showGuide)}
        className="absolute top-4 right-4 z-50 w-10 h-10 bg-blue-600 text-white rounded-full shadow-xl flex items-center justify-center animate-bounce hover:animate-none transition-all"
        title="Besoin d'aide ?"
      >
        <i className="fas fa-circle-exclamation text-lg"></i>
      </button>

      {showGuide && (
        <div className="absolute inset-0 z-[60] bg-slate-900/95 backdrop-blur-md rounded-[5px] p-8 text-white flex flex-col items-center justify-center text-center animate-in fade-in duration-300">
           <i className="fas fa-camera-retro text-4xl mb-6 text-blue-400"></i>
           <h3 className="text-lg font-black uppercase tracking-widest mb-4">Guide de Capture IA</h3>
           <div className="space-y-4 max-w-sm text-[11px] font-bold uppercase tracking-tight text-slate-300">
              <div className="flex items-center gap-4 bg-white/5 p-3 rounded-lg border border-white/10">
                 <i className="fas fa-sun text-amber-400 w-5"></i>
                 <span>Utilisez un éclairage direct sans ombre portée sur le papier.</span>
              </div>
              <div className="flex items-center gap-4 bg-white/5 p-3 rounded-lg border border-white/10">
                 <i className="fas fa-compress-arrows-alt text-green-400 w-5"></i>
                 <span>Cadrez au plus près des bords de la facture.</span>
              </div>
              <div className="flex items-center gap-4 bg-white/5 p-3 rounded-lg border border-white/10">
                 <i className="fas fa-align-center text-blue-400 w-5"></i>
                 <span>Maintenez le document bien à plat, sans plis majeurs.</span>
              </div>
           </div>
           <button 
             onClick={() => setShowGuide(false)}
             className="mt-10 px-8 py-3 bg-blue-600 rounded-full font-black uppercase tracking-[0.2em] text-[10px]"
           >
             C'est compris !
           </button>
        </div>
      )}

      {!isReviewing ? (
        <div className="relative bg-slate-900 rounded-[5px] overflow-hidden shadow-2xl aspect-[3/4] max-h-[70vh] border-4 border-slate-900">
          <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
          <canvas ref={canvasRef} className="hidden" />
          
          <div className="absolute top-6 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/60 backdrop-blur-sm rounded-[5px] border border-white/20 text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-3">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
            LOT : {capturedImages.length} / {batchSize}
          </div>

          <div className="absolute bottom-10 left-0 right-0 flex justify-center items-center gap-12">
            <button 
              onClick={() => capturedImages.length > 0 && setIsReviewing(true)}
              className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-[5px] border border-white/20 text-white flex items-center justify-center transition-all"
            >
              <i className="fas fa-layer-group text-sm"></i>
            </button>
            <button 
              onClick={takePhoto}
              className="w-16 h-16 bg-white rounded-full border-4 border-blue-600/30 flex items-center justify-center active:scale-90 transition-transform"
            >
              <div className="w-12 h-12 bg-blue-600 rounded-full"></div>
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-[5px] border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[calc(100vh-200px)]">
          <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
            <h2 className="text-xs font-black text-slate-900 uppercase tracking-widest">Révision avant envoi</h2>
            <button onClick={() => { setIsReviewing(false); startCamera(); }} className="text-[10px] font-black text-blue-600 uppercase">
              <i className="fas fa-plus mr-1"></i> Ajouter
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 sm:grid-cols-3 gap-4 custom-scrollbar">
            {capturedImages.map((img, idx) => (
              <div key={idx} className="relative rounded-[5px] overflow-hidden border border-slate-200 aspect-[3/4] group">
                <img src={img} className="w-full h-full object-cover" alt="" />
                <button 
                  onClick={() => setCapturedImages(prev => prev.filter((_, i) => i !== idx))}
                  className="absolute top-2 right-2 w-6 h-6 bg-red-600 text-white rounded-[3px] flex items-center justify-center text-[10px]"
                >
                  <i className="fas fa-trash"></i>
                </button>
              </div>
            ))}
          </div>
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex gap-3">
            <button onClick={() => { setCapturedImages([]); setIsReviewing(false); startCamera(); }} className="px-4 py-2 border border-slate-200 rounded-[5px] text-[10px] font-black uppercase text-slate-500">Annuler</button>
            <button onClick={submitBatch} className="flex-1 px-4 py-2 bg-blue-600 text-white text-[10px] font-black uppercase rounded-[5px] shadow-md hover:bg-blue-700 transition-all">
              Démarrer le pool d'agents ({capturedImages.length})
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CaptureInterface;

import React, { useState, useEffect, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import { Store, getStores, saveStores } from "./store";
import { generatePPTX } from "./pptxGenerator";
import { Plus, Camera, Trash2, Download, Image as ImageIcon, CheckCircle, Store as StoreIcon, Clock, MapPin, ChevronRight, X } from "lucide-react";

export default function App() {
  const [showCoverPage, setShowCoverPage] = useState(true);
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<string>("");
  const [newStoreName, setNewStoreName] = useState("");
  const [newStoreLocation, setNewStoreLocation] = useState("");
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [previewStoreId, setPreviewStoreId] = useState<string | null>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getStores().then(setStores);
  }, []);

  const handleSaveStores = async (newStores: Store[]) => {
    setStores(newStores);
    try {
      await saveStores(newStores);
    } catch (error) {
      console.error("Failed to save stores:", error);
      alert("Storage limit reached! Please delete some photos or export your current audit.");
    }
  };

  const handleAddStore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStoreName.trim() || !newStoreLocation.trim()) return;

    const newStore: Store = {
      id: uuidv4(),
      name: newStoreName.trim(),
      location: newStoreLocation.trim(),
      photos: [],
      visitedAt: new Date().toISOString(),
    };

    const newStores = [...stores, newStore];
    await handleSaveStores(newStores);
    setSelectedStoreId(newStore.id);
    setNewStoreName("");
    setNewStoreLocation("");
  };

  const handleDeleteStore = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this store and all its photos?")) {
      await handleSaveStores(stores.filter((s) => s.id !== id));
      if (selectedStoreId === id) {
        setSelectedStoreId("");
      }
    }
  };

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1024;
          const MAX_HEIGHT = 1024;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          // Compress to JPEG with 0.7 quality
          const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
          resolve(dataUrl);
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !selectedStoreId) return;

    const fileArray = Array.from(files);
    
    const newPhotos: string[] = await Promise.all(
      fileArray.map((file) => compressImage(file))
    );

    const updatedStores = stores.map((s) =>
      s.id === selectedStoreId
        ? { ...s, photos: [...s.photos, ...newPhotos], visitedAt: new Date().toISOString() }
        : s
    );
    
    await handleSaveStores(updatedStores);

    if (cameraInputRef.current) {
      cameraInputRef.current.value = "";
    }
    if (galleryInputRef.current) {
      galleryInputRef.current.value = "";
    }
  };

  const handleDeletePhoto = async (storeId: string, photoIndex: number) => {
    if (!storeId) return;
    if (window.confirm("Delete this photo?")) {
      const updatedStores = stores.map((s) => {
        if (s.id === storeId) {
          const newPhotos = [...s.photos];
          newPhotos.splice(photoIndex, 1);
          return { ...s, photos: newPhotos };
        }
        return s;
      });
      await handleSaveStores(updatedStores);
    }
  };

  const handleDownloadPPTX = async () => {
    try {
      const pptx = await generatePPTX(stores);
      await pptx.writeFile({ fileName: "Retail_Store_Audit.pptx" });
    } catch (error) {
      console.error("Error generating PPTX:", error);
      alert("Failed to generate PowerPoint file.");
    }
  };

  const selectedStore = stores.find(s => s.id === selectedStoreId);

  if (showCoverPage) {
    return (
      <div className="dark">
        <div className="min-h-screen bg-black text-gray-100 font-sans flex justify-center items-center">
          <div className="w-full max-w-md bg-gray-950 min-h-screen shadow-2xl relative flex flex-col justify-center items-center p-8 border-x border-gray-900 text-center">
            
            <div className="flex-1 flex flex-col justify-center items-center space-y-8 w-full">
              <div className="bg-white p-4 rounded-2xl shadow-lg">
                <img 
                  src="https://www.tekmedia.com.sg/wp-content/uploads/2024/03/Mask-Group-1.jpg" 
                  alt="TEKMEDIA Logo" 
                  className="w-48 h-auto object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
              
              <div className="space-y-2">
                <h1 className="text-3xl font-bold text-white tracking-tight">TEKMEDIA</h1>
                <h2 className="text-xl font-medium text-blue-400">VM Solution</h2>
              </div>
            </div>

            <div className="w-full pb-12 space-y-8">
              <button 
                onClick={() => setShowCoverPage(false)}
                className="w-full max-w-[200px] mx-auto flex justify-center items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-full transition-all shadow-lg hover:shadow-blue-500/25 active:scale-95"
              >
                Enter
                <ChevronRight className="w-5 h-5 ml-1" />
              </button>
              
              <div className="pt-8 border-t border-gray-800 w-full">
                <p className="text-xs text-gray-500 uppercase tracking-wider">Powered by</p>
                <p className="text-sm font-semibold text-gray-300 mt-1">Allan Sia</p>
              </div>
            </div>
            
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dark">
      <div className="min-h-screen bg-black text-gray-100 font-sans flex justify-center">
        {/* Mobile App Container */}
        <div className="w-full max-w-md bg-gray-950 min-h-screen shadow-2xl relative flex flex-col overflow-x-hidden border-x border-gray-900">
          
          {/* Header */}
          <header className="sticky top-0 z-10 bg-gray-900/90 backdrop-blur-md border-b border-gray-800 px-4 py-4 flex justify-between items-center">
            <h1 className="text-xl font-bold text-white tracking-wide">TEKMEDIA VM</h1>
            <button 
              onClick={() => setShowCoverPage(true)}
              className="text-xs text-gray-400 hover:text-white transition-colors"
            >
              Exit
            </button>
          </header>

          {/* Main Content */}
          <main className="flex-1 p-4 overflow-y-auto pb-24 space-y-8">
            
            {/* 1. Add Store */}
            <section className="space-y-3">
              <h2 className="text-lg font-semibold flex items-center text-white">
                <StoreIcon className="w-5 h-5 mr-2 text-blue-500"/> 1. Add Store
              </h2>
              <form onSubmit={handleAddStore} className="bg-gray-900 p-4 rounded-xl border border-gray-800 space-y-3 shadow-sm">
                <div>
                  <input
                    type="text"
                    value={newStoreName}
                    onChange={(e) => setNewStoreName(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm bg-gray-950 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-white placeholder-gray-500"
                    placeholder="Store Name (e.g. Downtown Branch)"
                    required
                  />
                </div>
                <div>
                  <input
                    type="text"
                    value={newStoreLocation}
                    onChange={(e) => setNewStoreLocation(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm bg-gray-950 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-white placeholder-gray-500"
                    placeholder="Location / Mall (e.g. Westfield)"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg font-medium transition-colors flex justify-center items-center"
                >
                  <Plus className="w-4 h-4 mr-1" /> Add Store
                </button>
              </form>
            </section>

            {/* 2. Capture Photos */}
            <section className="space-y-3">
              <h2 className="text-lg font-semibold flex items-center text-white">
                <Camera className="w-5 h-5 mr-2 text-green-500"/> 2. Capture Photos
              </h2>
              <div className="bg-gray-900 p-4 rounded-xl border border-gray-800 space-y-4 shadow-sm">
                <select
                  value={selectedStoreId}
                  onChange={(e) => setSelectedStoreId(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-700 text-white rounded-lg p-3 outline-none focus:ring-2 focus:ring-green-500 appearance-none"
                  style={{ backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1em' }}
                >
                  <option value="">-- Select a store --</option>
                  {stores.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.location})</option>
                  ))}
                </select>

                {selectedStore && (
                  <div className="space-y-4 pt-3 border-t border-gray-800">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-300">
                        {selectedStore.photos.length} {selectedStore.photos.length === 1 ? 'Photo' : 'Photos'}
                      </span>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => cameraInputRef.current?.click()}
                          className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm font-medium flex items-center transition-colors shadow-sm"
                        >
                          <Camera className="w-4 h-4 mr-1.5"/> Camera
                        </button>
                        <button
                          onClick={() => galleryInputRef.current?.click()}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-medium flex items-center transition-colors shadow-sm"
                        >
                          <ImageIcon className="w-4 h-4 mr-1.5"/> Upload
                        </button>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        ref={cameraInputRef}
                        onChange={handlePhotoUpload}
                      />
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        ref={galleryInputRef}
                        onChange={handlePhotoUpload}
                      />
                    </div>

                    {selectedStore.photos.length === 0 ? (
                      <div className="bg-gray-950 rounded-xl border-2 border-dashed border-gray-800 p-8 text-center">
                        <ImageIcon className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                        <p className="text-gray-500 text-sm">No photos added yet.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-3">
                        {selectedStore.photos.map((photo, index) => (
                          <div key={index} className="relative group rounded-lg overflow-hidden shadow-sm border border-gray-800 bg-gray-950 aspect-square">
                            <img src={photo} alt={`Store photo ${index + 1}`} className="w-full h-full object-cover" />
                            <button
                              onClick={() => handleDeletePhoto(selectedStoreId, index)}
                              className="absolute top-1 right-1 p-1.5 bg-red-500/90 text-white rounded-full hover:bg-red-600 shadow-md"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </section>

            {/* 3. Summary & Export */}
            <section className="space-y-3">
              <h2 className="text-lg font-semibold flex items-center text-white">
                <CheckCircle className="w-5 h-5 mr-2 text-purple-500"/> 3. Summary & Export
              </h2>
              <div className="bg-gray-900 p-4 rounded-xl border border-gray-800 space-y-4 shadow-sm">
                
                {stores.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">No stores added yet.</p>
                ) : (
                  <div className="space-y-3">
                    {stores.map(store => (
                      <div 
                        key={store.id} 
                        onClick={() => setPreviewStoreId(store.id)}
                        className="bg-gray-950 p-3 rounded-lg border border-gray-800 flex justify-between items-center cursor-pointer hover:bg-gray-900 transition-colors"
                      >
                        <div className="overflow-hidden pr-2">
                          <div className="font-semibold text-sm text-white truncate">{store.name}</div>
                          <div className="text-xs text-gray-400 flex items-center mt-1 truncate">
                            <MapPin className="w-3 h-3 mr-1 shrink-0"/>{store.location}
                          </div>
                          {store.visitedAt && (
                            <div className="text-xs text-gray-400 flex items-center mt-0.5">
                              <Clock className="w-3 h-3 mr-1 shrink-0"/>
                              {new Date(store.visitedAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                            </div>
                          )}
                        </div>
                        <div className="text-right shrink-0 flex flex-col items-end">
                          <div className="text-blue-400 font-bold text-sm bg-blue-900/30 px-2 py-1 rounded-md">
                            {store.photos.length} <ImageIcon className="w-3 h-3 inline ml-0.5"/>
                          </div>
                          <button 
                            onClick={(e) => handleDeleteStore(store.id, e)} 
                            className="text-red-400 hover:text-red-300 mt-2 text-xs flex items-center p-1"
                          >
                            <Trash2 className="w-3 h-3 mr-1"/> Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {stores.length > 0 && (
                  <div className="pt-4 border-t border-gray-800 space-y-4">
                    <label className="flex items-start space-x-3 cursor-pointer p-2 bg-gray-950 rounded-lg border border-gray-800">
                      <input 
                        type="checkbox" 
                        checked={isConfirmed} 
                        onChange={(e) => setIsConfirmed(e.target.checked)} 
                        className="mt-0.5 w-4 h-4 rounded border-gray-700 text-blue-600 focus:ring-blue-500 bg-gray-900" 
                      />
                      <span className="text-sm text-gray-300">I confirm that the summary of visited stores and photos is correct.</span>
                    </label>

                    <button
                      onClick={handleDownloadPPTX}
                      disabled={!isConfirmed || stores.length === 0}
                      className="w-full flex justify-center items-center px-4 py-3 bg-purple-600 text-white font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-purple-700 transition-colors shadow-sm"
                    >
                      <Download className="w-5 h-5 mr-2" />
                      Generate & Download PPTX
                    </button>
                  </div>
                )}
              </div>
            </section>

          </main>

          {/* Preview Modal */}
          {previewStoreId && (
            <div className="absolute inset-0 z-50 bg-black/95 flex flex-col">
              <div className="flex justify-between items-center p-4 border-b border-gray-800 bg-gray-900/50">
                <h3 className="text-white font-semibold truncate pr-4">
                  {stores.find(s => s.id === previewStoreId)?.name} Photos
                </h3>
                <button 
                  onClick={() => setPreviewStoreId(null)}
                  className="p-2 bg-gray-800 rounded-full text-gray-300 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                {stores.find(s => s.id === previewStoreId)?.photos.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500">
                    <ImageIcon className="w-12 h-12 mb-2 opacity-20" />
                    <p>No photos captured yet.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-4 gap-2">
                    {stores.find(s => s.id === previewStoreId)?.photos.map((photo, idx) => (
                      <div key={idx} className="relative group aspect-square rounded-lg overflow-hidden bg-gray-900 border border-gray-800">
                        <img src={photo} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" />
                        <button
                          onClick={() => handleDeletePhoto(previewStoreId, idx)}
                          className="absolute top-1 right-1 p-1.5 bg-red-500/90 text-white rounded-full hover:bg-red-600 shadow-md"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

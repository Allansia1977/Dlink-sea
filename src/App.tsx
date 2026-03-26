import React, { useState, useEffect, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import { Store, getStores, saveStores } from "./store";
import { generatePPTX } from "./pptxGenerator";
import { Plus, Camera, Trash2, Download, Image as ImageIcon, CheckCircle, Store as StoreIcon, Clock, MapPin, ChevronRight, X, FileText, ChevronUp, ChevronDown } from "lucide-react";

export default function App() {
  const [showCoverPage, setShowCoverPage] = useState(true);
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<string>("");
  const [newStoreName, setNewStoreName] = useState("");
  const [newStoreLocation, setNewStoreLocation] = useState("");
  const [newTopic, setNewTopic] = useState("");
  const [newRemark, setNewRemark] = useState("");
  const [selectedCustomId, setSelectedCustomId] = useState<string>("");
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [previewStoreId, setPreviewStoreId] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{isOpen: boolean, message: string, onConfirm: () => void}>({ isOpen: false, message: "", onConfirm: () => {} });
  const [alertDialog, setAlertDialog] = useState<{isOpen: boolean, message: string}>({ isOpen: false, message: "" });
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraCustomInputRef = useRef<HTMLInputElement>(null);
  const galleryCustomInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getStores().then(setStores);
  }, []);

  const handleSaveStores = async (newStores: Store[]) => {
    setStores(newStores);
    try {
      await saveStores(newStores);
    } catch (error) {
      console.error("Failed to save stores:", error);
      setAlertDialog({
        isOpen: true,
        message: "Storage limit reached! Please delete some photos or export your current audit."
      });
    }
  };

  const handleAddStore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStoreName.trim() || !newStoreLocation.trim()) return;

    const newStore: Store = {
      id: uuidv4(),
      name: newStoreName.trim(),
      location: newStoreLocation.trim(),
      type: 'store',
      photos: [],
      visitedAt: new Date().toISOString(),
    };

    const newStores = [...stores, newStore];
    await handleSaveStores(newStores);
    setSelectedStoreId(newStore.id);
    setNewStoreName("");
    setNewStoreLocation("");
  };

  const handleAddCustomEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopic.trim()) return;

    const newEntry: Store = {
      id: uuidv4(),
      name: "Custom Data",
      location: "",
      topic: newTopic.trim(),
      remark: newRemark.trim(),
      type: 'custom',
      photos: [],
      visitedAt: new Date().toISOString(),
    };

    const newStores = [...stores, newEntry];
    await handleSaveStores(newStores);
    setSelectedCustomId(newEntry.id);
    setNewTopic("");
    setNewRemark("");
  };

  const handleDeleteStore = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmDialog({
      isOpen: true,
      message: "Are you sure you want to delete this store and all its photos?",
      onConfirm: async () => {
        await handleSaveStores(stores.filter((s) => s.id !== id));
        if (selectedStoreId === id) {
          setSelectedStoreId("");
        }
      }
    });
  };

  const handleClearAll = async () => {
    setConfirmDialog({
      isOpen: true,
      message: "All store photo and info will be clear, proceed?",
      onConfirm: async () => {
        await handleSaveStores([]);
        setSelectedStoreId("");
        setNewStoreName("");
        setNewStoreLocation("");
        setNewTopic("");
        setNewRemark("");
        setSelectedCustomId("");
        setIsConfirmed(false);
        setPreviewStoreId(null);
      }
    });
  };

  const handleUpdateStoreData = async (storeId: string, field: 'topic' | 'remark' | 'name' | 'location', value: string) => {
    const updatedStores = stores.map((s) =>
      s.id === storeId ? { ...s, [field]: value } : s
    );
    await handleSaveStores(updatedStores);
  };

  const moveStore = async (index: number, direction: 'up' | 'down', e: React.MouseEvent) => {
    e.stopPropagation();
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === stores.length - 1) return;

    const newStores = [...stores];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    [newStores[index], newStores[targetIndex]] = [newStores[targetIndex], newStores[index]];
    
    await handleSaveStores(newStores);
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

  const handleCustomPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !selectedCustomId) return;

    const fileArray = Array.from(files);

    const newPhotos: string[] = await Promise.all(
      fileArray.map((file) => compressImage(file))
    );

    const updatedStores = stores.map((s) =>
      s.id === selectedCustomId
        ? { ...s, photos: [...s.photos, ...newPhotos], visitedAt: new Date().toISOString() }
        : s
    );
    
    await handleSaveStores(updatedStores);

    if (cameraCustomInputRef.current) {
      cameraCustomInputRef.current.value = "";
    }
    if (galleryCustomInputRef.current) {
      galleryCustomInputRef.current.value = "";
    }
  };

  const handleDeletePhoto = async (storeId: string, photoIndex: number) => {
    if (!storeId) return;
    setConfirmDialog({
      isOpen: true,
      message: "Delete this photo?",
      onConfirm: async () => {
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
    });
  };

  const handleDownloadPPTX = async () => {
    try {
      const pptx = await generatePPTX(stores);
      await pptx.writeFile({ fileName: "Retail_Store_Audit.pptx" });
    } catch (error) {
      console.error("Error generating PPTX:", error);
      setAlertDialog({
        isOpen: true,
        message: "Failed to generate PowerPoint file."
      });
    }
  };

  const selectedStore = stores.find(s => s.id === selectedStoreId);

  if (showCoverPage) {
    return (
      <div className="dark">
        <div className="min-h-screen bg-black text-gray-100 font-sans flex justify-center items-center">
          <div className="w-full max-w-md bg-gradient-to-br from-gray-900 via-slate-900 to-black min-h-screen shadow-2xl relative flex flex-col justify-center items-center p-8 border-x border-gray-800 text-center overflow-hidden">
            
            {/* Decorative background gradients */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute -top-[20%] -left-[10%] w-[70%] h-[50%] rounded-full bg-blue-900/20 blur-[100px]"></div>
              <div className="absolute bottom-[10%] -right-[20%] w-[60%] h-[60%] rounded-full bg-indigo-900/20 blur-[120px]"></div>
            </div>

            <div className="flex-1 flex flex-col justify-center items-center space-y-10 w-full z-10">
              <div className="bg-white/5 backdrop-blur-xl p-6 rounded-[2rem] shadow-2xl border border-white/10">
                <div className="bg-white p-5 rounded-2xl shadow-inner">
                  <img 
                    src="https://www.tekmedia.com.sg/wp-content/uploads/2024/03/Mask-Group-1.jpg" 
                    alt="TEKMEDIA Logo" 
                    className="w-48 h-auto object-contain"
                    referrerPolicy="no-referrer"
                  />
                </div>
              </div>
              
              <div className="space-y-3">
                <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 tracking-tight">TEKMEDIA</h1>
                <h2 className="text-xl font-medium text-blue-400 tracking-wide">VM Solution</h2>
                <p className="text-sm text-gray-400 font-light italic px-4">Empowering your sales force, enhancing your brand</p>
              </div>
            </div>

            <div className="w-full pb-12 space-y-10 z-10">
              <button 
                onClick={() => setShowCoverPage(false)}
                className="group relative overflow-hidden w-full max-w-[220px] mx-auto flex justify-center items-center px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-full transition-all duration-300 shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_40px_rgba(59,130,246,0.6)] hover:scale-105 active:scale-95"
              >
                {/* Flashy shine effect */}
                <div className="absolute inset-0 -translate-x-[150%] skew-x-12 bg-gradient-to-r from-transparent via-white/50 to-transparent group-hover:translate-x-[150%] transition-transform duration-700 ease-in-out"></div>
                
                <span className="relative z-10 flex items-center">
                  Enter App
                  <ChevronRight className="w-5 h-5 ml-1 group-hover:translate-x-1 transition-transform" />
                </span>
              </button>
              
              <div className="pt-8 border-t border-white/10 w-full">
                <p className="text-xs text-gray-500 uppercase tracking-widest">Powered by</p>
                <p className="text-sm font-semibold text-gray-300 mt-1 tracking-wide">Allan & Jesclyn</p>
                <p className="text-xs text-gray-600 mt-2">Copyright 2026</p>
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

            {/* 2. Store Capture Photos */}
            <section className="space-y-3">
              <h2 className="text-lg font-semibold flex items-center text-white">
                <Camera className="w-5 h-5 mr-2 text-green-500"/> 2. Store Capture Photos
              </h2>
              <div className="bg-gray-900 p-4 rounded-xl border border-gray-800 space-y-4 shadow-sm">
                <select
                  value={selectedStoreId}
                  onChange={(e) => setSelectedStoreId(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-700 text-white rounded-lg p-3 outline-none focus:ring-2 focus:ring-green-500 appearance-none"
                  style={{ backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1em' }}
                >
                  <option value="">-- Select a store --</option>
                  {stores.filter(s => s.type !== 'custom').map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.location})</option>
                  ))}
                </select>

                {selectedStore && selectedStore.type !== 'custom' && (
                  <div className="space-y-4 pt-3 border-t border-gray-800">
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Store Name</label>
                        <input
                          type="text"
                          value={selectedStore.name || ""}
                          onChange={(e) => handleUpdateStoreData(selectedStoreId, 'name', e.target.value)}
                          className="w-full px-3 py-2.5 text-sm bg-gray-950 border border-gray-700 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-white placeholder-gray-500"
                          placeholder="Enter store name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Location</label>
                        <input
                          type="text"
                          value={selectedStore.location || ""}
                          onChange={(e) => handleUpdateStoreData(selectedStoreId, 'location', e.target.value)}
                          className="w-full px-3 py-2.5 text-sm bg-gray-950 border border-gray-700 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-white placeholder-gray-500"
                          placeholder="Enter location"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Remark</label>
                        <textarea
                          value={selectedStore.remark || ""}
                          onChange={(e) => handleUpdateStoreData(selectedStoreId, 'remark', e.target.value)}
                          className="w-full px-3 py-2.5 text-sm bg-gray-950 border border-gray-700 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-white placeholder-gray-500 min-h-[80px]"
                          placeholder="Enter remark"
                        />
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t border-gray-800">
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

            {/* 3. Custom Data Entry */}
            <section className="space-y-3">
              <h2 className="text-lg font-semibold flex items-center text-white">
                <FileText className="w-5 h-5 mr-2 text-yellow-500"/> 3. Custom Data Entry
              </h2>
              <div className="bg-gray-900 p-4 rounded-xl border border-gray-800 space-y-4 shadow-sm">
                <form onSubmit={handleAddCustomEntry} className="flex items-start space-x-2">
                  <div className="flex-1 grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={newTopic}
                      onChange={(e) => setNewTopic(e.target.value)}
                      className="w-full px-3 py-2.5 text-sm bg-gray-950 border border-gray-700 rounded-lg focus:ring-2 focus:ring-yellow-500 outline-none text-white placeholder-gray-500"
                      placeholder="Topic"
                      required
                    />
                    <input
                      type="text"
                      value={newRemark}
                      onChange={(e) => setNewRemark(e.target.value)}
                      className="w-full px-3 py-2.5 text-sm bg-gray-950 border border-gray-700 rounded-lg focus:ring-2 focus:ring-yellow-500 outline-none text-white placeholder-gray-500"
                      placeholder="Remark"
                    />
                  </div>
                  <button
                    type="submit"
                    className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2.5 rounded-lg font-medium transition-colors flex justify-center items-center"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </form>

                {stores.filter(s => s.type === 'custom').length > 0 && (
                  <div className="pt-4 border-t border-gray-800 space-y-4">
                    <select
                      value={selectedCustomId}
                      onChange={(e) => setSelectedCustomId(e.target.value)}
                      className="w-full bg-gray-950 border border-gray-700 text-white rounded-lg p-3 outline-none focus:ring-2 focus:ring-yellow-500 appearance-none"
                      style={{ backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1em' }}
                    >
                      <option value="">-- Select a custom entry --</option>
                      {stores.filter(s => s.type === 'custom').map(s => (
                        <option key={s.id} value={s.id}>{s.topic}</option>
                      ))}
                    </select>

                    {selectedCustomId && stores.find(s => s.id === selectedCustomId) && (
                      <div className="space-y-4 pt-3 border-t border-gray-800">
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Topic</label>
                            <input
                              type="text"
                              value={stores.find(s => s.id === selectedCustomId)?.topic || ""}
                              onChange={(e) => handleUpdateStoreData(selectedCustomId, 'topic', e.target.value)}
                              className="w-full px-3 py-2.5 text-sm bg-gray-950 border border-gray-700 rounded-lg focus:ring-2 focus:ring-yellow-500 outline-none text-white placeholder-gray-500"
                              placeholder="Enter topic"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Remark</label>
                            <textarea
                              value={stores.find(s => s.id === selectedCustomId)?.remark || ""}
                              onChange={(e) => handleUpdateStoreData(selectedCustomId, 'remark', e.target.value)}
                              className="w-full px-3 py-2.5 text-sm bg-gray-950 border border-gray-700 rounded-lg focus:ring-2 focus:ring-yellow-500 outline-none text-white placeholder-gray-500 min-h-[80px]"
                              placeholder="Enter remark"
                            />
                          </div>
                        </div>

                        <div className="flex justify-between items-center pt-2 border-t border-gray-800">
                          <span className="text-sm font-medium text-gray-300">
                            {stores.find(s => s.id === selectedCustomId)?.photos.length} Photos
                          </span>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => cameraCustomInputRef.current?.click()}
                              className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm font-medium flex items-center transition-colors shadow-sm"
                            >
                              <Camera className="w-4 h-4 mr-1.5"/> Camera
                            </button>
                            <button
                              onClick={() => galleryCustomInputRef.current?.click()}
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
                            ref={cameraCustomInputRef}
                            onChange={handleCustomPhotoUpload}
                          />
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            className="hidden"
                            ref={galleryCustomInputRef}
                            onChange={handleCustomPhotoUpload}
                          />
                        </div>

                        {stores.find(s => s.id === selectedCustomId)?.photos.length === 0 ? (
                          <div className="bg-gray-950 rounded-xl border-2 border-dashed border-gray-800 p-8 text-center">
                            <ImageIcon className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                            <p className="text-gray-500 text-sm">No photos added yet.</p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 gap-3">
                            {stores.find(s => s.id === selectedCustomId)?.photos.map((photo, index) => (
                              <div key={index} className="relative group rounded-lg overflow-hidden shadow-sm border border-gray-800 bg-gray-950 aspect-square">
                                <img src={photo} alt={`Custom photo ${index + 1}`} className="w-full h-full object-cover" />
                                <button
                                  onClick={() => handleDeletePhoto(selectedCustomId, index)}
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
                )}
              </div>
            </section>

            {/* 4. Summary & Export */}
            <section className="space-y-3">
              <h2 className="text-lg font-semibold flex items-center text-white">
                <CheckCircle className="w-5 h-5 mr-2 text-purple-500"/> 4. Summary & Export
              </h2>
              <div className="bg-gray-900 p-4 rounded-xl border border-gray-800 space-y-4 shadow-sm">
                
                {stores.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">No stores added yet.</p>
                ) : (
                  <div className="space-y-3">
                    {stores.map((store, index) => (
                      <div 
                        key={store.id} 
                        onClick={() => setPreviewStoreId(store.id)}
                        className="bg-gray-950 p-3 rounded-lg border border-gray-800 flex items-center cursor-pointer hover:bg-gray-900 transition-colors"
                      >
                        <div className="flex flex-col items-center mr-3 space-y-1">
                          <button 
                            onClick={(e) => moveStore(index, 'up', e)}
                            disabled={index === 0}
                            className={`p-1 rounded ${index === 0 ? 'text-gray-800 cursor-not-allowed' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}
                          >
                            <ChevronUp className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={(e) => moveStore(index, 'down', e)}
                            disabled={index === stores.length - 1}
                            className={`p-1 rounded ${index === stores.length - 1 ? 'text-gray-800 cursor-not-allowed' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}
                          >
                            <ChevronDown className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="flex-1 overflow-hidden pr-2">
                          {store.type === 'custom' ? (
                            <>
                              <div className="font-semibold text-sm text-yellow-500 truncate">Custom: {store.topic}</div>
                              {store.remark && (
                                <div className="text-xs text-gray-400 flex items-center mt-1 truncate">
                                  <FileText className="w-3 h-3 mr-1 shrink-0"/>{store.remark}
                                </div>
                              )}
                            </>
                          ) : (
                            <>
                              <div className="font-semibold text-sm text-white truncate">{store.name}</div>
                              <div className="text-xs text-gray-400 flex items-center mt-1 truncate">
                                <MapPin className="w-3 h-3 mr-1 shrink-0"/>{store.location}
                              </div>
                              {store.remark && (
                                <div className="text-xs text-gray-400 flex items-center mt-1 truncate">
                                  <FileText className="w-3 h-3 mr-1 shrink-0"/>{store.remark}
                                </div>
                              )}
                            </>
                          )}
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
                    
                    <button
                      onClick={handleClearAll}
                      className="w-full flex justify-center items-center px-4 py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors shadow-sm mt-3"
                    >
                      <Trash2 className="w-5 h-5 mr-2" />
                      Clear All Data
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

          {/* Confirm Dialog */}
          {confirmDialog.isOpen && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 max-w-sm w-full shadow-2xl">
                <h3 className="text-lg font-semibold text-white mb-2">Confirm Action</h3>
                <p className="text-gray-300 mb-6">{confirmDialog.message}</p>
                <div className="flex space-x-3">
                  <button 
                    onClick={() => setConfirmDialog({ ...confirmDialog, isOpen: false })} 
                    className="flex-1 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={() => {
                      confirmDialog.onConfirm();
                      setConfirmDialog({ ...confirmDialog, isOpen: false });
                    }} 
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Proceed
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Alert Dialog */}
          {alertDialog.isOpen && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 max-w-sm w-full shadow-2xl">
                <h3 className="text-lg font-semibold text-white mb-2">Notice</h3>
                <p className="text-gray-300 mb-6">{alertDialog.message}</p>
                <button 
                  onClick={() => setAlertDialog({ ...alertDialog, isOpen: false })} 
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  OK
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

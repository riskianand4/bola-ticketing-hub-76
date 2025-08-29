import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Image, Video, Calendar, Eye, Play, Camera } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { EmptyStateCard } from "@/components/EmptyStateCard";
import { format } from "date-fns";
import { id } from "date-fns/locale";

interface GalleryItem {
  id: string;
  title: string;
  description: string | null;
  image_url: string;
  video_url: string | null;
  thumbnail_url: string | null;
  media_type: string;
  category: string | null;
  event_date: string | null;
  duration: string | null;
  created_at: string;
}

export default function GalleryPage() {
  const [selectedCategory, setSelectedCategory] = useState("photos");
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);

  useEffect(() => {
    fetchGalleryItems();
  }, []);

  const fetchGalleryItems = async () => {
    try {
      const { data, error } = await supabase
        .from('gallery')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGalleryItems(data || []);
    } catch (error) {
      console.error('Error fetching gallery items:', error);
    } finally {
      setLoading(false);
    }
  };

  const photos = galleryItems.filter(item => item.media_type === 'photo');
  const videos = galleryItems.filter(item => item.media_type === 'video');

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    try {
      return format(new Date(dateString), 'dd MMMM yyyy', { locale: id });
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background pt-16 sm:pt-20 md:pt-20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Memuat galeri...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-16 sm:pt-20 md:pt-20">
      <div className="container mx-auto px-3 md:px-4">
        {/* Header */}
        <div className="text-center mb-6 md:mb-12">
          <h1 className="text-2xl md:text-4xl font-bold text-foreground mb-2 mobile-title">Galeri Persiraja</h1>
          <p className="text-sm md:text-lg text-muted-foreground mobile-compact max-w-2xl mx-auto">
            Koleksi foto dan video terbaik dari perjalanan Persiraja
          </p>
        </div>

        {/* Tabs */}
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6 md:mb-8 max-w-md mx-auto">
            <TabsTrigger value="photos" className="text-xs md:text-sm">
              <Image className="w-3 md:w-4 h-3 md:h-4 mr-1 md:mr-2" />
              Foto
            </TabsTrigger>
            <TabsTrigger value="videos" className="text-xs md:text-sm">
              <Video className="w-3 md:w-4 h-3 md:h-4 mr-1 md:mr-2" />
              Video
            </TabsTrigger>
          </TabsList>

          {/* Photos Tab */}
          <TabsContent value="photos">
            {photos.length === 0 ? (
              <EmptyStateCard
                icon={Camera}
                title="Belum ada foto tersedia"
                description="Admin sedang mengupload foto-foto menarik. Silakan cek lagi nanti!"
              />
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
                {photos.map((photo) => (
                  <Dialog key={photo.id}>
                    <DialogTrigger asChild>
                      <Card className="group cursor-pointer hover:shadow-lg transition-all duration-300 overflow-hidden">
                        <CardContent className="p-0">
                          <div className="relative">
                            <img 
                              src={photo.image_url} 
                              alt={photo.title}
                              className="w-full aspect-square object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                              <Eye className="w-6 md:w-8 h-6 md:h-8 text-white" />
                            </div>
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2 md:p-3">
                              <h3 className="text-white font-medium text-xs md:text-sm mb-1 mobile-compact">
                                {photo.title}
                              </h3>
                              <p className="text-white/80 text-xs flex items-center">
                                <Calendar className="w-3 h-3 mr-1" />
                                {formatDate(photo.event_date || photo.created_at)}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </DialogTrigger>
                    
                    <DialogContent className="max-w-4xl w-[95vw] p-0">
                      <div className="relative">
                        <img 
                          src={photo.image_url} 
                          alt={photo.title}
                          className="w-full max-h-[70vh] object-contain"
                        />
                        <div className="p-4 md:p-6">
                          <h3 className="text-lg md:text-xl font-bold text-foreground mb-2">{photo.title}</h3>
                          <p className="text-sm md:text-base text-muted-foreground mb-3">{photo.description}</p>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center text-sm text-muted-foreground">
                              <Calendar className="w-4 h-4 mr-2" />
                              {formatDate(photo.event_date || photo.created_at)}
                            </div>
                            {photo.category && (
                              <span className="px-2 py-1 bg-secondary text-secondary-foreground text-xs rounded">
                                {photo.category}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Videos Tab */}
          <TabsContent value="videos">
            {videos.length === 0 ? (
              <EmptyStateCard
                icon={Video}
                title="Belum ada video tersedia"
                description="Admin sedang mengupload video-video menarik. Silakan cek lagi nanti!"
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {videos.map((video) => (
                  <Dialog key={video.id}>
                    <DialogTrigger asChild>
                      <Card className="group cursor-pointer hover:shadow-lg transition-all duration-300 overflow-hidden">
                        <CardContent className="p-0">
                          <div className="relative">
                            <img 
                              src={video.thumbnail_url || video.image_url} 
                              alt={video.title}
                              className="w-full aspect-video object-cover"
                            />
                            <div className="absolute inset-0 bg-black/30 group-hover:bg-black/50 transition-colors flex items-center justify-center">
                              <div className="bg-white/20 backdrop-blur-sm rounded-full p-3 md:p-4 group-hover:scale-110 transition-transform">
                                <Play className="w-6 md:w-8 h-6 md:h-8 text-white" />
                              </div>
                            </div>
                            {video.duration && (
                              <div className="absolute top-2 right-2">
                                <span className="bg-black/70 text-white text-xs px-2 py-1 rounded">
                                  {video.duration}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="p-3 md:p-4">
                            <h3 className="font-bold text-sm md:text-base text-foreground mb-2 mobile-compact">
                              {video.title}
                            </h3>
                            <p className="text-xs md:text-sm text-muted-foreground mb-3 line-clamp-2">
                              {video.description}
                            </p>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center text-xs text-muted-foreground">
                                <Calendar className="w-3 h-3 mr-1" />
                                {formatDate(video.event_date || video.created_at)}
                              </div>
                              {video.category && (
                                <span className="px-2 py-1 bg-secondary text-secondary-foreground text-xs rounded">
                                  {video.category}
                                </span>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </DialogTrigger>

                    <DialogContent className="max-w-4xl w-[95vw] p-0">
                      <div className="relative">
                        {video.video_url ? (
                          <video 
                            controls 
                            controlsList="nodownload"
                            className="w-full max-h-[70vh] bg-black"
                            poster={video.thumbnail_url || video.image_url}
                            preload="metadata"
                            onError={(e) => {
                              console.error('Video load error:', e);
                              e.currentTarget.style.display = 'none';
                              const errorDiv = document.createElement('div');
                              errorDiv.className = 'w-full h-64 bg-muted flex items-center justify-center';
                              errorDiv.innerHTML = '<p class="text-muted-foreground">Video tidak dapat dimuat</p>';
                              e.currentTarget.parentNode?.appendChild(errorDiv);
                            }}
                          >
                            <source src={video.video_url} type="video/mp4" />
                            <source src={video.video_url} type="video/webm" />
                            <source src={video.video_url} type="video/ogg" />
                            Browser Anda tidak mendukung video HTML5.
                          </video>
                        ) : (
                          <div className="w-full h-64 bg-muted flex items-center justify-center">
                            <p className="text-muted-foreground">Video tidak tersedia</p>
                          </div>
                        )}
                        <div className="p-4 md:p-6">
                          <h3 className="text-lg md:text-xl font-bold text-foreground mb-2">{video.title}</h3>
                          <p className="text-sm md:text-base text-muted-foreground mb-3">{video.description}</p>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center text-sm text-muted-foreground">
                              <Calendar className="w-4 h-4 mr-2" />
                              {formatDate(video.event_date || video.created_at)}
                            </div>
                            {video.category && (
                              <span className="px-2 py-1 bg-secondary text-secondary-foreground text-xs rounded">
                                {video.category}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
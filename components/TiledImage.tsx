'use client';

import { useEffect, useRef, useState } from 'react';

// グローバルな右クリック禁止のフック
function useProtectedImageHandlers() {
  useEffect(() => {
    // 画像表示時の右クリック禁止
    const handleContextMenu = (e: Event) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'IMG' || target.closest('[data-protected-image]')) {
        e.preventDefault();
        return false;
      }
    };
    
    // 画像のドラッグ禁止
    const handleDragStart = (e: Event) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'IMG' || target.closest('[data-protected-image]')) {
        e.preventDefault();
        return false;
      }
    };
    
    // 選択禁止
    const handleSelectStart = (e: Event) => {
      const target = e.target as HTMLElement;
      if (target.closest('[data-protected-image]')) {
        e.preventDefault();
        return false;
      }
    };
    
    // イベントリスナーを追加
    window.addEventListener('contextmenu', handleContextMenu, true);
    window.addEventListener('dragstart', handleDragStart, true);
    window.addEventListener('selectstart', handleSelectStart, true);
    
    // クリーンアップ
    return () => {
      window.removeEventListener('contextmenu', handleContextMenu, true);
      window.removeEventListener('dragstart', handleDragStart, true);
      window.removeEventListener('selectstart', handleSelectStart, true);
    };
  }, []);
}

interface TiledImageProps {
  imageUrl: string;
  alt: string;
  tileSize?: number;
}

export default function TiledImage({ imageUrl, alt, tileSize = 200 }: TiledImageProps) {
  useProtectedImageHandlers(); // グローバルな保護ハンドラーを有効化
  
  const containerRef = useRef<HTMLDivElement>(null);
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);
  const [tiles, setTiles] = useState<Array<{ x: number; y: number; url: string }>>([]);

  useEffect(() => {
    // 画像のサイズを取得
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      setImageDimensions({ width: img.width, height: img.height });
      
      // 画像をタイルに分割
      const cols = Math.ceil(img.width / tileSize);
      const rows = Math.ceil(img.height / tileSize);
      const tileArray: Array<{ x: number; y: number; url: string }> = [];
      
      // 各タイルのCanvasを作成
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          if (!ctx) continue;
          
          canvas.width = Math.min(tileSize, img.width - col * tileSize);
          canvas.height = Math.min(tileSize, img.height - row * tileSize);
          
          // タイル部分を描画
          ctx.drawImage(
            img,
            col * tileSize,
            row * tileSize,
            canvas.width,
            canvas.height,
            0,
            0,
            canvas.width,
            canvas.height
          );
          
          // CanvasをDataURLに変換
          const tileUrl = canvas.toDataURL('image/jpeg', 0.95);
          tileArray.push({
            x: col,
            y: row,
            url: tileUrl,
          });
        }
      }
      
      setTiles(tileArray);
    };
    
    img.src = imageUrl;
  }, [imageUrl, tileSize]);

  // 右クリック禁止
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    return false;
  };

  // ドラッグ禁止
  const handleDragStart = (e: React.DragEvent) => {
    e.preventDefault();
    return false;
  };

  // 選択禁止はCSSで対応

  if (!imageDimensions || tiles.length === 0) {
    return (
      <div className="w-full aspect-square bg-gray-900 flex items-center justify-center">
        <div className="text-gray-500">読み込み中...</div>
      </div>
    );
  }

  // コンテナの幅に合わせてスケーリング
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  // 表示幅に合わせてスケーリング（アスペクト比を維持）
  const displayWidth = containerWidth > 0 ? containerWidth : imageDimensions.width;
  const scale = displayWidth / imageDimensions.width;
  const displayHeight = imageDimensions.height * scale;

  return (
    <div
      ref={containerRef}
      className="relative w-full bg-gray-900 overflow-hidden flex items-center justify-center"
      data-protected-image="true"
      style={{ 
        minHeight: '400px',
        aspectRatio: `${imageDimensions.width} / ${imageDimensions.height}`,
        userSelect: 'none',
        WebkitUserSelect: 'none',
        MozUserSelect: 'none',
        msUserSelect: 'none',
      }}
      onContextMenu={handleContextMenu}
      onDragStart={handleDragStart}
    >
      <div
        className="relative"
        style={{
          width: `${displayWidth}px`,
          height: `${displayHeight}px`,
          maxWidth: '100%',
        }}
      >
        {tiles.map((tile, index) => {
          const tileDisplayWidth = Math.min(tileSize, imageDimensions.width - tile.x * tileSize) * scale;
          const tileDisplayHeight = Math.min(tileSize, imageDimensions.height - tile.y * tileSize) * scale;
          
          return (
            <div
              key={index}
              className="absolute"
              style={{
                left: `${tile.x * tileSize * scale}px`,
                top: `${tile.y * tileSize * scale}px`,
                width: `${tileDisplayWidth}px`,
                height: `${tileDisplayHeight}px`,
              }}
            >
              <img
                src={tile.url}
                alt={`${alt} - タイル ${tile.x}, ${tile.y}`}
                className="w-full h-full object-cover select-none pointer-events-none"
                draggable={false}
                onContextMenu={(e) => e.preventDefault()}
                style={{
                  userSelect: 'none',
                  WebkitUserSelect: 'none',
                  MozUserSelect: 'none',
                  msUserSelect: 'none',
                  WebkitTouchCallout: 'none',
                }}
              />
            </div>
          );
        })}
      </div>
      {/* 透明なオーバーレイで右クリックとドラッグを完全にブロック */}
      <div
        className="absolute inset-0 z-10 pointer-events-auto"
        onContextMenu={handleContextMenu}
        onDragStart={handleDragStart}
        style={{ 
          cursor: 'default',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          MozUserSelect: 'none',
          msUserSelect: 'none',
        }}
      />
    </div>
  );
}

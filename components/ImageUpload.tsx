'use client';

import { useState, useRef } from 'react';

interface ImageUploadProps {
  onImageProcessed: (processedImageUrl: string) => void;
}

export default function ImageUpload({ onImageProcessed }: ImageUploadProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processImage = async (file: File) => {
    setIsProcessing(true);
    
    return new Promise<string>((resolve, reject) => {
      const img = new Image();
      const reader = new FileReader();

      reader.onload = (e) => {
        img.onload = () => {
          // Canvasを作成
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            reject(new Error('Canvas context not available'));
            return;
          }

          // 画像サイズに合わせてCanvasを設定
          canvas.width = img.width;
          canvas.height = img.height;

          // 画像を描画
          ctx.drawImage(img, 0, 0);

          // 微細なノイズを追加
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;

          // ランダムノイズを追加（非常に微細）
          for (let i = 0; i < data.length; i += 4) {
            // RGBチャンネルに微細なノイズを追加
            const noise = (Math.random() - 0.5) * 2; // -1 から 1 の範囲
            data[i] = Math.max(0, Math.min(255, data[i] + noise));     // R
            data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise)); // G
            data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise)); // B
          }

          ctx.putImageData(imageData, 0, 0);

          // 透かしテキストを描画
          ctx.save();
          
          // 透かしのスタイル設定
          const fontSize = Math.max(canvas.width, canvas.height) * 0.08;
          ctx.font = `bold ${fontSize}px Arial, sans-serif`;
          ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
          ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
          ctx.lineWidth = 2;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';

          // 中心に透かしを描画
          const centerX = canvas.width / 2;
          const centerY = canvas.height / 2;
          
          // テキストを2行で描画
          const text1 = 'AI学習禁止';
          const text2 = 'Soleil et Lune Protection';
          const lineHeight = fontSize * 1.2;

          // 背景の影を描画（可読性向上）
          ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
          ctx.shadowBlur = 10;
          ctx.shadowOffsetX = 2;
          ctx.shadowOffsetY = 2;

          // 1行目
          ctx.strokeText(text1, centerX, centerY - lineHeight / 2);
          ctx.fillText(text1, centerX, centerY - lineHeight / 2);

          // 2行目
          ctx.strokeText(text2, centerX, centerY + lineHeight / 2);
          ctx.fillText(text2, centerX, centerY + lineHeight / 2);

          ctx.restore();

          // CanvasをBlobに変換
          canvas.toBlob((blob) => {
            if (blob) {
              const url = URL.createObjectURL(blob);
              resolve(url);
            } else {
              reject(new Error('Failed to create blob'));
            }
          }, 'image/jpeg', 0.95);
        };

        img.src = e.target?.result as string;
      };

      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('画像ファイルを選択してください');
      return;
    }

    try {
      const processedUrl = await processImage(file);
      onImageProcessed(processedUrl);
    } catch (error) {
      console.error('画像処理エラー:', error);
      alert('画像の処理に失敗しました');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="w-full">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
        disabled={isProcessing}
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={isProcessing}
        className="w-full px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
      >
        {isProcessing ? '処理中...' : '画像をアップロード（AI防御処理）'}
      </button>
    </div>
  );
}

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

          // Glaze風の処理: ピクセルごとにランダムな色情報のオフセットを追加
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;
          const width = canvas.width;
          const height = canvas.height;

          // パラメータ: Glaze風の強度調整
          const intensity = 0.03; // オフセット強度（3%）
          const styleProtectionFactor = 0.05; // スタイル保護ファクター

          // ピクセルごとに処理
          for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
              const idx = (y * width + x) * 4;
              
              // 現在のピクセル位置から微細なランダムオフセットを生成
              // 近傍ピクセルの影響を受けたオフセット（スタイル抽出を困難にする）
              const offsetX = (Math.random() - 0.5) * styleProtectionFactor;
              const offsetY = (Math.random() - 0.5) * styleProtectionFactor;
              
              // 周囲のピクセルから色情報をサンプリング（微細なズレ）
              const sampleX = Math.max(0, Math.min(width - 1, x + Math.floor(offsetX * 5)));
              const sampleY = Math.max(0, Math.min(height - 1, y + Math.floor(offsetY * 5)));
              const sampleIdx = (sampleY * width + sampleX) * 4;
              
              // RGBチャンネルごとに異なるオフセットを適用
              // 各チャンネルに数学的に複雑な変換を適用
              const rOffset = (Math.random() - 0.5) * intensity * 255;
              const gOffset = (Math.random() - 0.5) * intensity * 255;
              const bOffset = (Math.random() - 0.5) * intensity * 255;
              
              // 元のピクセル値とサンプル値の混合（スタイル保護）
              const blendFactor = 0.7; // 元の値を70%保持
              const r = data[idx] * blendFactor + data[sampleIdx] * (1 - blendFactor);
              const g = data[idx + 1] * blendFactor + data[sampleIdx + 1] * (1 - blendFactor);
              const b = data[idx + 2] * blendFactor + data[sampleIdx + 2] * (1 - blendFactor);
              
              // オフセットを適用
              data[idx] = Math.max(0, Math.min(255, r + rOffset));     // R
              data[idx + 1] = Math.max(0, Math.min(255, g + gOffset)); // G
              data[idx + 2] = Math.max(0, Math.min(255, b + bOffset)); // B
              
              // 追加の非線形変換（AIの特徴抽出をさらに困難にする）
              // 微細な非線形マッピング
              const nonlinear = (val: number) => {
                const normalized = val / 255;
                const transformed = normalized + (Math.random() - 0.5) * intensity * 0.1;
                return Math.max(0, Math.min(255, transformed * 255));
              };
              
              data[idx] = nonlinear(data[idx]);
              data[idx + 1] = nonlinear(data[idx + 1]);
              data[idx + 2] = nonlinear(data[idx + 2]);
            }
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

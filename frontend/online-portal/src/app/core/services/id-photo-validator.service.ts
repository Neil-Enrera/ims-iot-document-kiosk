import { Injectable } from '@angular/core';

export interface FaceBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PhotoValidationResult {
  isValid: boolean;
  error?: string;
  details?: {
    width?: number;
    height?: number;
    aspectRatio?: number;
    faceCount?: number;
    faceBox?: FaceBox;
    brightness?: number;
    isBlurry?: boolean;
    isLightBackground?: boolean;
    laplacianVariance?: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class IdPhotoValidatorService {

  /**
   * Validates a 2x2 ID photo file against all official requirements:
   * 1. Accepted file formats: JPG, JPEG, PNG only
   * 2. Aspect ratio: 1:1 square
   * 3. Resolution: Minimum 300x300 px
   * 4. Human face detection: Exactly 1 face
   * 5. Face position: Centered, reasonable scale, not severely cropped
   * 6. Usability: Not blurry, not too dark, not overexposed, sufficient contrast
   * 7. Background: White or light-colored background
   */
  async validateIdPhoto(file: File): Promise<PhotoValidationResult> {
    // 1. File type and extension check
    const formatCheck = this.checkFileFormat(file);
    if (!formatCheck.isValid) {
      return formatCheck;
    }

    // 2. Minimum file size sanity check
    if (file.size < 15 * 1024) {
      return {
        isValid: false,
        error: 'Image file is too small or corrupted (less than 15KB). Please upload a clear photo.'
      };
    }

    // 3. Load image to examine dimensions and canvas pixels
    let img: HTMLImageElement;
    try {
      img = await this.loadImage(file);
    } catch {
      return {
        isValid: false,
        error: 'Unable to process image file. The file may be damaged or not a valid image.'
      };
    }

    const width = img.naturalWidth;
    const height = img.naturalHeight;

    // 4. Aspect ratio validation (1:1 square, ±5% tolerance)
    const ratio = width / height;
    if (ratio < 0.95 || ratio > 1.05) {
      return {
        isValid: false,
        error: `Invalid photo aspect ratio (${width}×${height} px). A 2×2 ID photo must be square (1:1 aspect ratio). Please crop your photo into a square.`
      };
    }

    // 5. Minimum resolution validation (300x300 px)
    if (width < 300 || height < 300) {
      return {
        isValid: false,
        error: `Photo resolution is too low (${width}×${height} px). 2×2 ID photos must be at least 300×300 px for official identification printing.`
      };
    }

    // 6. Draw to canvas for Computer Vision analysis
    const canvas = document.createElement('canvas');
    // Normalized sample size for consistent CV statistics
    const sampleSize = 320;
    canvas.width = sampleSize;
    canvas.height = sampleSize;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    if (!ctx) {
      // Fallback if canvas context cannot be created
      return { isValid: true };
    }

    ctx.drawImage(img, 0, 0, sampleSize, sampleSize);
    const imageData = ctx.getImageData(0, 0, sampleSize, sampleSize);
    const pixels = imageData.data;

    // 7. Brightness, darkness, overexposure, and contrast checks
    const lightingCheck = this.checkLightingAndContrast(pixels, sampleSize, sampleSize);
    if (!lightingCheck.isValid) {
      return lightingCheck;
    }

    // 8. Sharpness / Blur detection using Laplacian variance
    const blurCheck = this.checkBlurriness(pixels, sampleSize, sampleSize);
    if (!blurCheck.isValid) {
      return blurCheck;
    }

    // 9. Face detection (Native FaceDetector API or Computer Vision fallback)
    const faceResult = await this.detectFaces(img, pixels, sampleSize, sampleSize);
    if (!faceResult.isValid) {
      return faceResult;
    }

    const faces = faceResult.faces || [];
    if (faces.length === 0) {
      return {
        isValid: false,
        error: 'No human face detected in the uploaded photo. Please ensure your face is clearly visible, uncovered, and facing the camera directly.'
      };
    }

    if (faces.length > 1) {
      return {
        isValid: false,
        error: `Multiple faces detected (${faces.length} faces found). The 2×2 ID photo must contain only one individual.`
      };
    }

    // 10. Check face centering, scale, and cropping
    const singleFace = faces[0];
    const framingCheck = this.checkFaceFraming(singleFace, sampleSize, sampleSize);
    if (!framingCheck.isValid) {
      return framingCheck;
    }

    // 11. Check background color (Plain white or light-colored)
    const bgCheck = this.checkBackground(pixels, sampleSize, sampleSize, singleFace);
    if (!bgCheck.isValid) {
      return bgCheck;
    }

    return {
      isValid: true,
      details: {
        width,
        height,
        aspectRatio: ratio,
        faceCount: 1,
        faceBox: singleFace,
        brightness: lightingCheck.meanLuminance,
        isBlurry: false,
        isLightBackground: true,
        laplacianVariance: blurCheck.variance
      }
    };
  }

  /**
   * Enforces JPG, JPEG, and PNG only.
   */
  private checkFileFormat(file: File): PhotoValidationResult {
    const fileName = file.name.toLowerCase();
    const hasValidExtension = fileName.endsWith('.jpg') || fileName.endsWith('.jpeg') || fileName.endsWith('.png');
    const validMimes = ['image/jpeg', 'image/png', 'image/jpg', 'image/pjpeg', 'image/x-png'];
    const hasValidMime = validMimes.includes(file.type.toLowerCase());

    if (!hasValidExtension || !hasValidMime) {
      return {
        isValid: false,
        error: 'Invalid file format. Only JPG, JPEG, and PNG image files are accepted for 2×2 ID photos.'
      };
    }

    return { isValid: true };
  }

  /**
   * Helper to load file into HTMLImageElement.
   */
  private loadImage(file: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('Image decode error'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('File read error'));
      reader.readAsDataURL(file);
    });
  }

  /**
   * Analyzes pixel luminance to detect extremely dark, overexposed, or uniform/blank images.
   */
  private checkLightingAndContrast(pixels: Uint8ClampedArray, width: number, height: number): PhotoValidationResult & { meanLuminance?: number } {
    let sumLuminance = 0;
    let darkCount = 0;
    let brightCount = 0;
    const totalPixels = width * height;
    const luminances = new Float32Array(totalPixels);

    for (let i = 0; i < totalPixels; i++) {
      const r = pixels[i * 4];
      const g = pixels[i * 4 + 1];
      const b = pixels[i * 4 + 2];
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      luminances[i] = lum;
      sumLuminance += lum;

      if (lum < 35) darkCount++;
      if (lum > 245) brightCount++;
    }

    const meanLuminance = sumLuminance / totalPixels;

    // Standard deviation for contrast check
    let varianceSum = 0;
    for (let i = 0; i < totalPixels; i++) {
      const diff = luminances[i] - meanLuminance;
      varianceSum += diff * diff;
    }
    const stdDev = Math.sqrt(varianceSum / totalPixels);

    // Too dark / underexposed check
    if (meanLuminance < 45 || darkCount / totalPixels > 0.82) {
      return {
        isValid: false,
        error: 'Photo is too dark or underexposed. Please upload a well-lit ID photo taken in good lighting.'
      };
    }

    // Overexposed / washed out check
    if (meanLuminance > 245 || brightCount / totalPixels > 0.85) {
      return {
        isValid: false,
        error: 'Photo is overexposed or washed out. Please upload a clear photo with balanced lighting.'
      };
    }

    // Lack of contrast / solid color check
    if (stdDev < 12) {
      return {
        isValid: false,
        error: 'Image lacks photographic detail or contrast. Please upload a clear, high-quality portrait photo.'
      };
    }

    return { isValid: true, meanLuminance };
  }

  /**
   * Evaluates image sharpness using a discrete Laplacian variance filter.
   */
  private checkBlurriness(pixels: Uint8ClampedArray, width: number, height: number): PhotoValidationResult & { variance?: number } {
    const gray = new Float32Array(width * height);
    for (let i = 0; i < width * height; i++) {
      gray[i] = 0.299 * pixels[i * 4] + 0.587 * pixels[i * 4 + 1] + 0.114 * pixels[i * 4 + 2];
    }

    let laplacianSum = 0;
    let laplacianSqSum = 0;
    let count = 0;

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = y * width + x;
        // Standard 3x3 discrete Laplacian kernel
        const lap = 4 * gray[idx] - gray[idx - 1] - gray[idx + 1] - gray[idx - width] - gray[idx + width];
        laplacianSum += lap;
        laplacianSqSum += lap * lap;
        count++;
      }
    }

    const meanLap = laplacianSum / count;
    const variance = (laplacianSqSum / count) - (meanLap * meanLap);

    // Extremely blurry threshold on normalized 320x320
    if (variance < 32) {
      return {
        isValid: false,
        error: 'Photo appears too blurry or out of focus. Please upload a crisp, sharp 2×2 ID photo.',
        variance
      };
    }

    return { isValid: true, variance };
  }

  /**
   * Detects faces using Shape Detection API if supported, or Computer Vision fallback.
   */
  private async detectFaces(
    img: HTMLImageElement,
    pixels: Uint8ClampedArray,
    sampleW: number,
    sampleH: number
  ): Promise<PhotoValidationResult & { faces?: FaceBox[] }> {
    // Method 1: Try native Browser FaceDetector if supported
    if (typeof window !== 'undefined' && 'FaceDetector' in window) {
      try {
        const detector = new (window as any).FaceDetector({ fastMode: false, maxDetectedFaces: 5 });
        const detected = await detector.detect(img);
        if (Array.isArray(detected)) {
          const faces: FaceBox[] = detected.map((f: any) => {
            const b = f.boundingBox;
            const scaleX = sampleW / img.naturalWidth;
            const scaleY = sampleH / img.naturalHeight;
            return {
              x: b.x * scaleX,
              y: b.y * scaleY,
              width: b.width * scaleX,
              height: b.height * scaleY
            };
          });
          return { isValid: true, faces };
        }
      } catch {
        // Fallback to pure CV method
      }
    }

    // Method 2: Comprehensive Computer Vision Skin & Facial Structure Analyzer
    const faces = this.cvFaceDetector(pixels, sampleW, sampleH);
    return { isValid: true, faces };
  }

  /**
   * Computer vision facial feature and skin geometry detector.
   */
  private cvFaceDetector(pixels: Uint8ClampedArray, width: number, height: number): FaceBox[] {
    const skinMask = new Uint8Array(width * height);
    let totalSkinPixels = 0;

    // 1. Skin Chrominance Segmentation (YCbCr + RGB heuristics)
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        const r = pixels[idx];
        const g = pixels[idx + 1];
        const b = pixels[idx + 2];

        // Convert to YCbCr
        const cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
        const cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;

        const isSkin = (
          cb >= 77 && cb <= 135 &&
          cr >= 133 && cr <= 178 &&
          r > 70 && g > 40 && b > 20 &&
          r > g && r > b && (r - g) >= 12
        );

        if (isSkin) {
          skinMask[y * width + x] = 1;
          totalSkinPixels++;
        }
      }
    }

    // If practically no skin pixels detected, no face exists
    if (totalSkinPixels < (width * height * 0.035)) {
      return [];
    }

    // 2. Morphological grouping: compute skin density grid (16x16 blocks)
    const blockSize = 16;
    const gridW = Math.floor(width / blockSize);
    const gridH = Math.floor(height / blockSize);
    const densityGrid = new Float32Array(gridW * gridH);

    for (let gy = 0; gy < gridH; gy++) {
      for (let gx = 0; gx < gridW; gx++) {
        let blockSkin = 0;
        for (let py = 0; py < blockSize; py++) {
          for (let px = 0; px < blockSize; px++) {
            const y = gy * blockSize + py;
            const x = gx * blockSize + px;
            if (skinMask[y * width + x] === 1) {
              blockSkin++;
            }
          }
        }
        densityGrid[gy * gridW + gx] = blockSkin / (blockSize * blockSize);
      }
    }

    // 3. Find connected high-density skin components
    const visited = new Uint8Array(gridW * gridH);
    const candidateComponents: Array<{ minGx: number; maxGx: number; minGy: number; maxGy: number; count: number }> = [];

    for (let gy = 0; gy < gridH; gy++) {
      for (let gx = 0; gx < gridW; gx++) {
        const gIdx = gy * gridW + gx;
        if (visited[gIdx] || densityGrid[gIdx] < 0.25) continue;

        // BFS Flood fill component
        let minGx = gx, maxGx = gx, minGy = gy, maxGy = gy, count = 0;
        const queue: [number, number][] = [[gx, gy]];
        visited[gIdx] = 1;

        while (queue.length > 0) {
          const [cx, cy] = queue.shift()!;
          count++;
          if (cx < minGx) minGx = cx;
          if (cx > maxGx) maxGx = cx;
          if (cy < minGy) minGy = cy;
          if (cy > maxGy) maxGy = cy;

          const neighbors = [
            [cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]
          ];
          for (const [nx, ny] of neighbors) {
            if (nx >= 0 && nx < gridW && ny >= 0 && ny < gridH) {
              const nIdx = ny * gridW + nx;
              if (!visited[nIdx] && densityGrid[nIdx] >= 0.22) {
                visited[nIdx] = 1;
                queue.push([nx, ny]);
              }
            }
          }
        }

        if (count >= 4) {
          candidateComponents.push({ minGx, maxGx, minGy, maxGy, count });
        }
      }
    }

    // 4. Verify facial geometry & eye/mouth contrast within each candidate
    const detectedFaces: FaceBox[] = [];

    for (const comp of candidateComponents) {
      const boxX = comp.minGx * blockSize;
      const boxY = comp.minGy * blockSize;
      const boxW = (comp.maxGx - comp.minGx + 1) * blockSize;
      const boxH = (comp.maxGy - comp.minGy + 1) * blockSize;

      // Facial aspect ratio check (typically 0.85 to 2.1)
      const compRatio = boxH / boxW;
      if (compRatio < 0.80 || compRatio > 2.2) continue;

      // Minimum size check (must occupy at least 15% of width/height)
      if (boxW < width * 0.18 || boxH < height * 0.18) continue;

      // Facial feature check: Eye socket region is darker than forehead and cheekbones
      const eyeRegionY = Math.floor(boxY + boxH * 0.25);
      const eyeRegionH = Math.floor(boxH * 0.30);
      const cheekRegionY = Math.floor(boxY + boxH * 0.55);
      const cheekRegionH = Math.floor(boxH * 0.25);

      let eyeLumSum = 0, eyeCount = 0;
      let cheekLumSum = 0, cheekCount = 0;

      for (let y = eyeRegionY; y < eyeRegionY + eyeRegionH && y < height; y++) {
        for (let x = boxX; x < boxX + boxW && x < width; x++) {
          const idx = (y * width + x) * 4;
          const lum = 0.299 * pixels[idx] + 0.587 * pixels[idx + 1] + 0.114 * pixels[idx + 2];
          eyeLumSum += lum;
          eyeCount++;
        }
      }

      for (let y = cheekRegionY; y < cheekRegionY + cheekRegionH && y < height; y++) {
        for (let x = boxX; x < boxX + boxW && x < width; x++) {
          const idx = (y * width + x) * 4;
          const lum = 0.299 * pixels[idx] + 0.587 * pixels[idx + 1] + 0.114 * pixels[idx + 2];
          cheekLumSum += lum;
          cheekCount++;
        }
      }

      const avgEyeLum = eyeCount > 0 ? eyeLumSum / eyeCount : 128;
      const avgCheekLum = cheekCount > 0 ? cheekLumSum / cheekCount : 128;

      // In real human face portraits, eye/eyebrow sockets are darker than cheeks or forehead
      if (avgEyeLum <= avgCheekLum * 1.08) {
        detectedFaces.push({
          x: boxX,
          y: boxY,
          width: boxW,
          height: boxH
        });
      }
    }

    // Merge overlapping boxes (Non-maximum suppression)
    return this.mergeOverlappingBoxes(detectedFaces);
  }

  /**
   * Merges overlapping face boxes.
   */
  private mergeOverlappingBoxes(boxes: FaceBox[]): FaceBox[] {
    if (boxes.length <= 1) return boxes;

    const merged: FaceBox[] = [];
    const used = new Uint8Array(boxes.length);

    for (let i = 0; i < boxes.length; i++) {
      if (used[i]) continue;
      let cur = { ...boxes[i] };
      used[i] = 1;

      for (let j = i + 1; j < boxes.length; j++) {
        if (used[j]) continue;
        const b = boxes[j];

        // Check intersection over union (IoU)
        const x1 = Math.max(cur.x, b.x);
        const y1 = Math.max(cur.y, b.y);
        const x2 = Math.min(cur.x + cur.width, b.x + b.width);
        const y2 = Math.min(cur.y + cur.height, b.y + b.height);

        if (x1 < x2 && y1 < y2) {
          const interArea = (x2 - x1) * (y2 - y1);
          const curArea = cur.width * cur.height;
          const bArea = b.width * b.height;
          const iou = interArea / (curArea + bArea - interArea);

          if (iou > 0.20) {
            const minX = Math.min(cur.x, b.x);
            const minY = Math.min(cur.y, b.y);
            const maxX = Math.max(cur.x + cur.width, b.x + b.width);
            const maxY = Math.max(cur.y + cur.height, b.y + b.height);
            cur = { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
            used[j] = 1;
          }
        }
      }
      merged.push(cur);
    }

    return merged;
  }

  /**
   * Verifies that the face is centered, properly scaled, and not severely cropped.
   */
  private checkFaceFraming(face: FaceBox, imageW: number, imageH: number): PhotoValidationResult {
    const faceW = face.width;
    const faceH = face.height;
    const faceCenterX = face.x + faceW / 2;
    const faceCenterY = face.y + faceH / 2;

    // 1. Scale / Distance check
    const widthRatio = faceW / imageW;
    const heightRatio = faceH / imageH;

    if (widthRatio < 0.20 || heightRatio < 0.22) {
      return {
        isValid: false,
        error: 'The face in the photo is too small or too far away. Your head and shoulders should fill the 2×2 frame.'
      };
    }

    if (widthRatio > 0.88 || heightRatio > 0.88) {
      return {
        isValid: false,
        error: 'The face is too close to the camera. Please upload a standard portrait showing your head, neck, and upper shoulders.'
      };
    }

    // 2. Horizontal centering check (center offset within 18% of image width)
    const horizOffset = Math.abs(faceCenterX - imageW / 2) / imageW;
    if (horizOffset > 0.18) {
      return {
        isValid: false,
        error: 'The face is not centered horizontally. Please center your face within the frame.'
      };
    }

    // 3. Vertical position check (face center between 20% and 72% of image height)
    const vertRatio = faceCenterY / imageH;
    if (vertRatio < 0.20 || vertRatio > 0.72) {
      return {
        isValid: false,
        error: 'The face is positioned too high or too low in the photo. Please center your head within the frame.'
      };
    }

    // 4. Severe cropping check (face touching image borders)
    const leftMargin = face.x / imageW;
    const rightMargin = (imageW - (face.x + faceW)) / imageW;
    const topMargin = face.y / imageH;

    if (leftMargin < 0.03 || rightMargin < 0.03 || topMargin < 0.02) {
      return {
        isValid: false,
        error: 'The face appears cropped or cut off at the edge of the image. Please ensure your full face and hair are visible.'
      };
    }

    return { isValid: true };
  }

  /**
   * Checks whether the background area (corners and top strip) is white or light-colored.
   */
  private checkBackground(
    pixels: Uint8ClampedArray,
    imageW: number,
    imageH: number,
    face: FaceBox
  ): PhotoValidationResult {
    let bgLuminanceSum = 0;
    let bgPixelCount = 0;
    let darkBgCount = 0;
    let saturatedBgCount = 0;

    // Define background sample zones: top-left corner, top-right corner, and top margin
    const zones = [
      // Top-left corner
      { x1: 0, y1: 0, x2: Math.floor(imageW * 0.22), y2: Math.floor(imageH * 0.30) },
      // Top-right corner
      { x1: Math.floor(imageW * 0.78), y1: 0, x2: imageW, y2: Math.floor(imageH * 0.30) },
      // Top strip above head
      { x1: Math.floor(imageW * 0.30), y1: 0, x2: Math.floor(imageW * 0.70), y2: Math.min(Math.floor(imageH * 0.12), Math.max(0, face.y - 2)) }
    ];

    for (const zone of zones) {
      for (let y = zone.y1; y < zone.y2; y++) {
        for (let x = zone.x1; x < zone.x2; x++) {
          // Skip if point lies inside face bounding box
          if (x >= face.x && x <= face.x + face.width && y >= face.y && y <= face.y + face.height) {
            continue;
          }

          const idx = (y * imageW + x) * 4;
          const r = pixels[idx];
          const g = pixels[idx + 1];
          const b = pixels[idx + 2];

          const lum = 0.299 * r + 0.587 * g + 0.114 * b;
          const saturation = Math.max(r, g, b) - Math.min(r, g, b);

          bgLuminanceSum += lum;
          bgPixelCount++;

          if (lum < 140) darkBgCount++;
          if (saturation > 65) saturatedBgCount++;
        }
      }
    }

    if (bgPixelCount === 0) {
      return { isValid: true };
    }

    const meanBgLuminance = bgLuminanceSum / bgPixelCount;
    const darkRatio = darkBgCount / bgPixelCount;
    const saturatedRatio = saturatedBgCount / bgPixelCount;

    // 2x2 photo requires a plain white or light-colored background
    if (meanBgLuminance < 155 || darkRatio > 0.35 || (meanBgLuminance < 175 && saturatedRatio > 0.40)) {
      return {
        isValid: false,
        error: 'The photo background must be plain white or light-colored. Detected a dark, colorful, or patterned background.'
      };
    }

    return { isValid: true };
  }
}

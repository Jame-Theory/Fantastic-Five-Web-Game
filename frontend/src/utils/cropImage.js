// frontend/src/utils/cropImage.js
export default async function getCroppedImg(imageSrc, pixelCrop) {
  // 1. load the image in JS
  const image = await new Promise((res, rej) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload  = () => res(img);
    img.onerror = err => rej(err);
    img.src     = imageSrc;
  });

  // 2. draw the cropped area into a canvas
    const SIZE = 256;
  const canvas = document.createElement('canvas');
  canvas.width  = SIZE; // pixelCrop.width;
  canvas.height = SIZE; // pixelCrop.height;
  const ctx = canvas.getContext('2d');

  // 3. figure out the scaling from natural→displayed coords
  const scaleX = image.naturalWidth  / image.width;
  const scaleY = image.naturalHeight / image.height;

    // 4. draw the cropped region into that 256×256 box
  ctx.drawImage(
    image,
    pixelCrop.x * scaleX,
      pixelCrop.y * scaleY,
    pixelCrop.width * scaleX,
      pixelCrop.height * scaleY,
    0, 0,
    SIZE, SIZE
    //pixelCrop.width, pixelCrop.height
  );

  // 5) export as JPEG @ 80% quality → this will almost always be < 1 MB
  // turn that into a Blob
  return await new Promise(resolve => {
    canvas.toBlob(
        blob => resolve(blob),
        'image/png');
  });
}

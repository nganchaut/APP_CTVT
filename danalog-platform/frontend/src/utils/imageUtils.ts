/**
 * Compresses an image file to a base64 string with reduced size.
 * Max width: 1024px, Quality: 0.7 JPEG
 */
export const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                // Max width/height to 1024 while maintaining aspect ratio
                const MAX_dimension = 1024;
                if (width > height) {
                    if (width > MAX_dimension) {
                        height *= MAX_dimension / width;
                        width = MAX_dimension;
                    }
                } else {
                    if (height > MAX_dimension) {
                        width *= MAX_dimension / height;
                        height = MAX_dimension;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject(new Error('Canvas context not available'));
                    return;
                }
                ctx.drawImage(img, 0, 0, width, height);

                // Compress to JPEG 0.7
                const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
                resolve(dataUrl);
            };
            img.onerror = (error) => reject(error);
        };
        reader.onerror = (error) => reject(error);
    });
};

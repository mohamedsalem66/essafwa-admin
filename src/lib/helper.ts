export const getBase64ImageSrc = (base64String: string) => {
    if (!base64String) return '';

    if (base64String.startsWith('data:image')) {
        return base64String;
    }

    let mimeType = 'image/jpeg';
    if (base64String.charAt(0) === '/') {
        mimeType = 'image/jpeg';
    } else if (base64String.charAt(0) === 'i') {
        mimeType = 'image/png';
    } else if (base64String.charAt(0) === 'R') {
        mimeType = 'image/gif';
    } else if (base64String.charAt(0) === 'U') {
        mimeType = 'image/webp';
    }

    return `data:${mimeType};base64,${base64String}`;
};


export const compressImage = async (file: File): Promise<File> => {
    return new Promise((resolve) => {
        const image = new Image();
        const reader = new FileReader();

        reader.onload = (event) => {
            image.src = event.target?.result as string;
            image.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                // Set max dimensions
                const MAX_WIDTH = 1024;
                const MAX_HEIGHT = 1024;
                let width = image.width;
                let height = image.height;

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
                ctx?.drawImage(image, 0, 0, width, height);

                canvas.toBlob((blob) => {
                    resolve(new File([blob!], file.name, {
                        type: 'image/jpeg',
                        lastModified: Date.now()
                    }));
                }, 'image/jpeg', 0.7);
            };
        };

        reader.readAsDataURL(file);
    });
};

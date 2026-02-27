export const PLAN_LIMITS = {
    basic: {
        name: "Basic",
        imageCount: 5,
        videoCount: 5,
        deepSearchCount: 20,
        audioConvertCount: 10,
        documentConvertCount: 15,
        codeWriterCount: 50,
        chatCount: 100
    },
    pro: {
        name: "Pro",
        imageCount: 200,
        videoCount: 20,
        deepSearchCount: 200,
        audioConvertCount: 100,
        documentConvertCount: 200,
        codeWriterCount: Infinity,
        chatCount: 3000
    },
    king: {
        name: "King",
        imageCount: Infinity,
        videoCount: 200,
        deepSearchCount: Infinity,
        audioConvertCount: Infinity,
        documentConvertCount: Infinity,
        codeWriterCount: Infinity,
        chatCount: Infinity
    }
};

export const getUsageKey = (feature) => {
    const map = {
        'image': 'imageCount',
        'video': 'videoCount',
        'deepSearch': 'deepSearchCount',
        'audio': 'audioConvertCount',
        'document': 'documentConvertCount',
        'codeWriter': 'codeWriterCount',
        'chat': 'chatCount'
    };
    return map[feature] || feature;
};

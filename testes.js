async function translateText(originalLanguage, targetLanguage, textToTranslate) {
    const params = new URLSearchParams({
        client: "gtx",
        dt: "t",
        ie: "UTF-8",
        oe: "UTF-8",
        sl: originalLanguage,
        tl: targetLanguage,
        q: textToTranslate
    });

    const response = await fetch(`https://translate.googleapis.com/translate_a/single?${params}`, {
        method: "GET",
        headers: {
            "User-Agent": "Mozilla/5.0",
            "Accept": "application/json"
        }
    });

    const data = await response.json();
    const translatedText = data[0][0][0];
    const fromLanguage = data[2] || originalLanguage;
    const toLanguage = data[3] || targetLanguage;
    const confidencePercentage = Math.round(data[6] * 100) || 100;
    console.log(data);
    console.log(translatedText, fromLanguage, toLanguage, confidencePercentage);
    return { translatedText, fromLanguage, toLanguage, confidencePercentage };
}

translateText('auto', 'pt', 'Hello World');
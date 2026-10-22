const OpenAI = require("openai");

const getNvidiaConfig = (feature) => {
    const apiKey = process.env.NVIDIA_API_KEY?.trim();
    const model = process.env.NVIDIA_MODEL?.trim();

    if (!apiKey) {
        throw new Error(`NVIDIA_API_KEY is required for ${feature}`);
    }

    if (!model) {
        throw new Error(
            `NVIDIA_MODEL is required for ${feature}. Configure an active NVIDIA model in backend/.env.`
        );
    }

    return { apiKey, model };
};

const getNvidiaClient = (feature) => {
    const { apiKey } = getNvidiaConfig(feature);

    return new OpenAI({
        apiKey,
        baseURL: "https://integrate.api.nvidia.com/v1",
    });
};

const getNvidiaModel = (feature) => getNvidiaConfig(feature).model;

module.exports = {
    getNvidiaClient,
    getNvidiaModel,
};

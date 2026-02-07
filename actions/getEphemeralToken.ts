"use server";

export const getEphemeralToken = async (): Promise<string> => {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        throw new Error("OPENAI_API_KEY is not set");
    }

    const response = await fetch("https://api.openai.com/v1/realtime/client_secrets", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            session: {
                type: "realtime",
                model: "gpt-realtime",
            },
        }),
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to get ephemeral token: ${response.status} ${error}`);
    }

    const data = (await response.json()) as { value: string };
    return data.value;
};
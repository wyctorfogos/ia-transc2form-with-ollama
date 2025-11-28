const fileInput = document.getElementById("fileInput");
const fileContentBox = document.getElementById("fileContent");
const sendBtn = document.getElementById("sendBtn");
const resultBox = document.getElementById("result");

let loadedText = null;

fileInput.addEventListener("change", async () => {
    const file = fileInput.files[0];
    if (!file) return;

    const text = await file.text();
    loadedText = text;

    fileContentBox.textContent = text;
});

sendBtn.addEventListener("click", async () => {
    if (!loadedText) {
        alert("Envie um arquivo antes!");
        return;
    }

    resultBox.textContent = "Processando...";

    try {
        const response = await fetch("http://localhost:3000/api/ollama", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                model: "gemma3:1b",
                prompt: `Faça uma análise zero-shot do seguinte texto:\n\n${loadedText}`
            })
        });

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        let fullOutput = "";

        while (true) {
            const { value, done } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split("\n");

            for (const line of lines) {
                if (!line.trim()) continue;

                try {
                    const json = JSON.parse(line);
                    if (json.response) {
                        fullOutput += json.response;
                        resultBox.textContent = fullOutput;
                    }
                } catch {
                    // ignorar linhas inválidas
                }
            }
        }
    } catch (err) {
        console.error(err);
        resultBox.textContent = "Erro ao conectar ao proxy.";
    }
});

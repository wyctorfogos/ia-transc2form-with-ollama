const fileInput = document.getElementById("fileInput");
const modelSelect = document.getElementById("modelSelect");
const fileContentBox = document.getElementById("fileContent");
const resultBox = document.getElementById("result");
const sendBtn = document.getElementById("sendBtn");

let loadedText = null;


async function loadModels() {
    try {
        const res = await fetch("http://localhost:3000/api/models");
        const models = await res.json();

        const select = document.getElementById("modelSelect");
        select.innerHTML = "";

        models.forEach(model => {
            const option = document.createElement("option");
            option.value = model;
            option.textContent = model;
            select.appendChild(option);
        });

    } catch (error) {
        console.error("Falha ao carregar modelos:", error);
        document.getElementById("modelSelect").innerHTML =
            "<option>Erro ao carregar modelos</option>";
    }
}

// Chama a função ao abrir a página
loadModels();


// Ler arquivo
fileInput.addEventListener("change", async () => {
    const file = fileInput.files[0];
    if (!file) return;

    const text = await file.text();
    loadedText = text;

    fileContentBox.textContent = text;
});

// Enviar ao backend → proxy → Ollama
sendBtn.addEventListener("click", async () => {
    if (!loadedText) {
        alert("Envie um arquivo antes!");
        return;
    }

    resultBox.textContent = "Processando...";

    const selectedModel = modelSelect.value;

    try {
        const response = await fetch("http://localhost:3000/api/ollama", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                model: selectedModel,
                prompt: `Analise juridicamente o seguinte documento:\n\n${loadedText}`
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
                    console.error(e);
                }
            }
        }
    } catch (err) {
        console.error(err);
        resultBox.textContent = "Erro ao conectar ao servidor.";
    }
});

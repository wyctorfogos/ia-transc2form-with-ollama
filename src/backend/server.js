import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json({ limit: "50mb" }));

// Usa a variável de ambiente
const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434";

// Proxy para o Ollama
app.post("/api/ollama", async (req, res) => {
    try {
        const response = await fetch(`${OLLAMA_URL}/api/generate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(req.body)
        });

        res.setHeader("Content-Type", "text/plain; charset=utf-8");

        response.body.on("data", chunk => res.write(chunk));
        response.body.on("end", () => res.end());
    } catch (err) {
        console.error("Erro no proxy:", err);
        res.status(500).json({ error: "Falha ao conectar ao Ollama" });
    }
});

// Rota para listar modelos do Ollama
app.get("/api/models", async (req, res) => {
    try {
        const response = await fetch(`${OLLAMA_URL}/api/tags`);
        const data = await response.json();
        res.json(data.models.map(m => m.name));
    } catch (err) {
        console.error("Erro ao listar modelos:", err);
        res.status(500).json({ error: "Erro ao obter modelos do Ollama" });
    }
});


// Iniciar servidor
app.listen(3000, () => {
    console.log("🚀 Servidor rodando na porta 3000");
});

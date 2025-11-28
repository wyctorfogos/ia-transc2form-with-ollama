const fileInput = document.getElementById("fileInput");
const modelSelect = document.getElementById("modelSelect");
const fileContentBox = document.getElementById("fileContent");
const resultBox = document.getElementById("result");
const sendBtn = document.getElementById("sendBtn");

let loadedText = null;
const OLLAMA_SERVICE_HOSTNAME = "172.26.252.21"; // os.getenv('OLLAMA_SERVICE_HOSTNAME');
const OLLAMA_SERVICE_PORT = "8010";

async function loadModels() {
    try {
        const res = await fetch(`http://${OLLAMA_SERVICE_HOSTNAME}:${OLLAMA_SERVICE_PORT}/api/models`);
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


// Leitura garantida em UTF-8 (remove BOM se presente) e substitui o listener padrão
async function readFileAsUtf8(file) {
    try {
        const buffer = await file.arrayBuffer();
        const decoder = new TextDecoder("utf-8");
        let text = decoder.decode(buffer);
        // Remover BOM se existir
        if (text.charCodeAt(0) === 0xFEFF) {
            text = text.slice(1);
        }
        return text;
    } catch (err) {
        console.error("Erro ao ler arquivo como UTF-8:", err);
        // fallback para File.text() caso algo falhe
        try {
            const fallback = await file.text();
            return fallback;
        } catch (e) {
            console.error("Fallback também falhou:", e);
            return null;
        }
    }
}

// Substitui qualquer outro listener de "change" chamando stopImmediatePropagation
fileInput.addEventListener("change", async (event) => {
    // Impede que outros listeners (incluindo o existente no final do arquivo) sejam executados
    event.stopImmediatePropagation();

    const file = fileInput.files[0];
    if (!file) return;

    const text = await readFileAsUtf8(file);
    if (text === null) {
        alert("Não foi possível ler o arquivo em UTF-8.");
        return;
    }

    loadedText = text;
    fileContentBox.textContent = text;
});


let gerarPrompt = (texto) => {
    return `Você é um Assistente Jurídico Especialista em Processamento de Linguagem Natural.  
        Sua função é analisar depoimentos brutos e extrair informações para o "Formulário Nacional de Avaliação de Risco" do CNJ.

        A saída deve ser **EXCLUSIVAMENTE um objeto JSON válido**, SEM texto antes ou depois, SEM explicações, SEM markdown, SEM comentários.

        Se algo não for mencionado no texto, use:
        - null  
        - ou "Não informado" quando indicado.

        # FORMATO EXATO DE SAÍDA:
        {
        "bloco_1_historico_violencia": {
            "q1_ameaca": "...",
            "q2_agressoes_graves": [],
            "q3_outras_agressoes": [],
            "q4_violencia_sexual": null,
            "q5_comportamentos": {
            "disse algo parecido com a frase: “se não for minha, não será de mais ninguém”": false,
            "perturbou, perseguiu ou vigiou você nos locais em que frequenta": false,
            "proibiu você de visitar familiares ou amigos": false,
            "proibiu você de trabalhar ou estudar": false,
            "fez telefonemas, enviou mensagens pelo celular ou e-mails de forma insistente": false,
            "impediu você de ter acesso a dinheiro, conta bancária ou outros bens": false,
            "teve outros comportamentos de ciúme excessivo e de controle sobre você": false
            },
            "q6_registro_anterior": null,
            "q7_agravamento_recente": null
        },
        "bloco_2_agressor": {
            "q8_uso_abusivo": "...",
            "q9_doenca_mental": "...",
            "q10_descumprimento_medida": null,
            "q11_risco_suicidio": null,
            "q12_desemprego_financeiro": null,
            "q13_acesso_arma": null,
            "q14_agressao_terceiros": {
            "ocorreu": null,
            "vitimas": []
            }
        },
        "bloco_3_vitima": {
            "q15_separacao_recente": null,
            "q16_filhos": {
            "tem_filhos": null,
            "com_agressor_qtd": null,
            "outro_relacionamento_qtd": null,
            "faixa_etaria": [],
            "filho_deficiente": null
            },
            "q17_conflito_guarda_pensao": null,
            "q18_filhos_presenciaram": null,
            "q19_violencia_gravidez_pos_parto": null,
            "q20_novo_relacionamento_risco": null,
            "q21_deficiencia_vitima": "Não informado",
            "q22_raca_cor": "Não informado"
        },
        "bloco_4_outras_infos": {
            "q23_local_risco": null,
            "q24_dependencia_financeira": null,
            "q25_aceita_abrigamento": null
        },
        "justificativa_analise": "",
        "analise_risco": "Não avaliado"
        }

        # REGRAS IMPORTANTES:
        1. A resposta **deve ser JSON válido**, sem texto fora do objeto.  
        2. Não usar markdown (\`\`\`).  
        3. Não adicionar explicações, só o JSON.  
        4. Preencher usando APENAS informações do texto.  
        5. Se não houver evidência no texto, use null ou "Não informado".  
        6. "justificativa_analise" deve ter no máximo 2 linhas.

        # TEXTO PARA ANÁLISE:
        ${texto}`;
        };

// Enviar ao backend → proxy → Ollama
sendBtn.addEventListener("click", async () => {
    if (!loadedText) {
        alert("Envie um arquivo antes!");
        return;
    }

    resultBox.textContent = "Processando...";

    const selectedModel = modelSelect.value;

    try {
        const response = await fetch(`http://${OLLAMA_SERVICE_HOSTNAME}:${OLLAMA_SERVICE_PORT}/api/form_response`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                model: selectedModel,
                prompt: gerarPrompt(loadedText)
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
                } catch (e){
                    console.error(e);
                }
            }
        }
    } catch (err) {
        console.error(err);
        resultBox.textContent = "Erro ao conectar ao servidor.";
    }
});



application
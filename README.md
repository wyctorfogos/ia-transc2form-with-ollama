Para habilitar a comunhicação com o ollama local:

1️ Criar o override do serviço do Ollama

Execute:

sudo systemctl edit ollama

Vai abrir o editor.
Cole exatamente isto:

[Service]
Environment="OLLAMA_HOST=0.0.0.0"


Salve e feche:

Nano → CTRL+O, ENTER, CTRL+X

Vim → :wq

2️ Reiniciar o sistema do Ollama
sudo systemctl daemon-reload
sudo systemctl restart ollama

3
Reestartar o serviço:

sudo systemctl daemon-reload
sudo systemctl restart ollama

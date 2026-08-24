# IFMove — Campus em Movimento
**Discente:** Letícia Renelly · **Docente:** Roselle · **Disciplina:** Educação Física - EDF · **Semestre:** 4º


Proposta de jogo digital para combater o sedentarismo na comunidade acadêmica. Em vez de QR Codes espalhados pelo campus, o **IFMove** usa a câmera do próprio celular e visão computacional para reconhecer os exercícios do jogador em tempo real, contar repetições e dar pontos — tudo direto no navegador, sem instalar nada.

---

## Roteiro do jogo

| Item | Descrição |
|---|---|
| **Tema** | Sedentarismo e atividade física da comunidade acadêmica |
| **Objetivo** | Completar exercícios reconhecidos pela câmera para acumular pontos e subir de nível |
| **Público-alvo** | Toda a comunidade acadêmica — estudantes, professores e servidores |
| **Movimento no jogo** | Agachamento, polichinelo e flexão, validados automaticamente pela pose do corpo |
| **Tecnologia** | Visão computacional (TensorFlow.js + MoveNet) rodando no navegador |
| **Aprendizagem** | Reconhecer a própria rotina sedentária e inserir pausas ativas no dia a dia |

## Como funciona

1. O jogador abre o link em qualquer navegador com câmera (celular ou computador).
2. Ativa a câmera e escolhe a missão: **Agachamento**, **Polichinelo** ou **Flexão**.
3. O modelo de IA [MoveNet](https://www.tensorflow.org/hub/tutorials/movenet) identifica os pontos-chave do corpo (ombros, quadris, joelhos, tornozelos etc.) a cada frame.
4. O app calcula ângulos e distâncias entre esses pontos para validar cada repetição.
5. Repetições válidas somam pontos, que fazem o jogador subir de nível: `Sedentário → Em Movimento → Ativo → Atleta Campus → Lenda do Campus`.
6. Missões manuais (caminhada, alongamento, escada, dupla) complementam a experiência para atividades que ainda não têm detecção automática.

**Privacidade:** todo o processamento acontece localmente no navegador do jogador. O vídeo da câmera nunca é gravado, salvo ou enviado a um servidor.

## Estrutura do projeto

```
ifmove/
├── index.html      → estrutura da página
├── style.css        → estilos visuais
├── script.js        → lógica do jogo e da visão computacional
└── README.md         → esta documentação
```

## Como rodar localmente

A câmera do navegador só funciona em `HTTPS` ou em `localhost` — não abra o `index.html` direto clicando duas vezes (URL `file://`), pois o navegador vai bloquear o acesso à câmera.

Rode um servidor local simples a partir da pasta do projeto:

```bash
# com Python instalado
python3 -m http.server 8000

# ou, com Node.js instalado
npx serve .
```

Depois acesse `http://localhost:8000` no navegador.

## Como publicar para todos usarem

### Opção 1 — GitHub Pages (recomendado)
1. Suba os arquivos para um repositório no GitHub.
2. Vá em **Settings → Pages**.
3. Em **Source**, selecione a branch `main` e a pasta `/root`.
4. Salve. O link ficará algo como `https://seu-usuario.github.io/IFmove`.

### Opção 2 — Netlify Drop
1. Acesse [app.netlify.com/drop](https://app.netlify.com/drop).
2. Arraste a pasta do projeto.
3. Um link `https://` é gerado automaticamente.

## Tecnologias usadas

- HTML, CSS e JavaScript puro (sem frameworks, sem build step)
- [TensorFlow.js](https://www.tensorflow.org/js) — inferência de IA no navegador
- [MoveNet](https://github.com/tensorflow/tfjs-models/tree/master/pose-detection) — modelo de estimativa de pose (via CDN jsDelivr)

## Possíveis próximos passos

- Adicionar mais exercícios (prancha, alongamento, caminhada no lugar)
- Ranking coletivo entre turmas ou departamentos (exigiria um backend simples para guardar pontuações)
- Avatares personalizáveis que evoluem visualmente com os pontos
- Modo "dupla" com duas câmeras/dispositivos sincronizados

## Créditos

Projeto acadêmico — Proposta de Jogo Digital, tema Sedentarismo e Atividade Física.
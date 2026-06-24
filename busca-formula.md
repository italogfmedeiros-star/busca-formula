Projeto: Plataforma Inteligente de Acompanhamento da Produção de Fórmulas Manipuladas

Vamos iniciar um novo projeto do zero seguindo as instruções gerais previamente definidas para este ambiente.

Contexto do Problema

Atualmente utilizamos um ERP que possui acesso a todas as informações relacionadas à produção de fórmulas manipuladas em nosso laboratório.

Por meio de filtros específicos, o ERP gera relatórios em formato XLS contendo dados extraídos diretamente do banco de dados.

Embora os dados sejam completos, a forma como são apresentados dificulta significativamente a interpretação operacional do processo produtivo, exigindo conhecimento técnico e análise manual para identificar informações realmente importantes.

Nosso objetivo é criar uma plataforma complementar que funcione como uma camada inteligente de visualização e interpretação desses dados.

A proposta não é substituir o ERP, mas transformar relatórios complexos em informações claras, objetivas e acionáveis.

Objetivo Principal

Desenvolver uma plataforma web capaz de:

Receber relatórios exportados pelo ERP.
Interpretar automaticamente os dados.
Identificar o estágio atual de produção de cada fórmula manipulada.
Destacar gargalos operacionais.
Apresentar indicadores relevantes.
Exibir informações de forma simples e intuitiva.
Funcionar como uma "esteira visual de produção".

O usuário deve conseguir compreender rapidamente o status da produção sem precisar interpretar planilhas complexas.

Fontes de Informação

Durante o projeto serão fornecidos:

Planilhas XLS

Contendo os dados exportados pelo ERP.

Arquivos TXT

Contendo descrições, observações e explicações dos campos.

Capturas de Tela

Mostrando relatórios, telas do ERP e fluxos operacionais.

Você deverá analisar todos os materiais enviados e construir gradualmente o entendimento do processo produtivo.

Processo de Descoberta

Antes de criar qualquer regra de negócio:

Analise todos os arquivos fornecidos.
Identifique padrões nos dados.
Liste todos os campos encontrados.
Tente inferir o significado de cada campo.
Documente suas hipóteses.
Sempre que algum campo não puder ser compreendido com segurança, interrompa a inferência e solicite esclarecimento.

Não assuma significados críticos sem validação.

Caso exista qualquer dúvida sobre nomenclaturas, siglas ou processos internos, pergunte antes de prosseguir.

Objetivo do MVP

Neste primeiro momento NÃO iremos desenvolver toda a plataforma.

Vamos focar apenas em:

Importação dos Relatórios

Criar uma interface contendo:

Área de upload de arquivos XLS.
Histórico de arquivos enviados.
Status de processamento.
Validação de formato.
Interpretação dos Dados

Após o upload:

Ler os dados da planilha.
Identificar automaticamente colunas e campos.
Exibir uma prévia estruturada.
Gerar um mapeamento dos dados encontrados.
Descoberta das Informações Relevantes

A plataforma deverá apresentar:

Campos encontrados

Exemplo:

Campo ERP	Significado Identificado
Código	Número da fórmula
Status	Etapa atual
Data	Data do processo
Campos desconhecidos

Criar uma área específica para registrar dúvidas e solicitar validação.

Construção Colaborativa

O sistema será construído de forma iterativa.

A cada nova análise:

Sugira interpretações.
Sugira agrupamentos.
Sugira indicadores.
Sugira visualizações.

Eu validarei as regras de negócio antes da implementação.

Entregáveis da Primeira Etapa

Antes de gerar código:

1. Análise do Problema

Compreensão do cenário operacional.

2. Proposta de Arquitetura

Frontend recomendado.

Método de leitura dos arquivos XLS.

Estratégia de processamento.

Estratégia de armazenamento.

Estimativa de custos.

3. Fluxo do Usuário

Desde o upload da planilha até a visualização dos dados.

4. Wireframe Conceitual

Descreva:

Tela inicial.
Área de upload.
Área de prévia dos dados.
Área de mapeamento dos campos.
Área de indicadores futuros.
5. Roadmap

Separar em:

MVP

Upload e interpretação dos relatórios.

V1

Dashboard operacional.

V2

Indicadores de produção.

V3

Alertas automáticos.

V4

Integração direta com ERP.

Diretrizes Técnicas
Priorizar simplicidade.
Priorizar baixo custo.
Priorizar rapidez de implementação.
Utilizar tecnologias modernas.
Pensar em escalabilidade futura.
Construir inicialmente como aplicação web responsiva.
Evitar complexidade desnecessária até que as regras de negócio estejam totalmente compreendidas.
Regra Mais Importante

Você não conhece o processo produtivo do laboratório.

Portanto, sua principal responsabilidade inicial é aprender o processo através dos documentos enviados, construir um modelo de entendimento e validar comigo todas as interpretações antes de transformá-las em funcionalidades do sistema.

O sucesso do projeto depende mais da correta compreensão dos dados do que da implementação técnica.
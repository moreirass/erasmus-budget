# Estado da revisão — 3 de novembro de 2026

| Ponto                | Estado                        | Implementação / limite                                                                                                                                                                                         |
| -------------------- | ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. Ícone maskable    | Feito                         | Ícone separado de 512 px, com margem de cerca de 20%, e entrada `purpose: maskable`.                                                                                                                           |
| 2. Manifest          | Feito                         | `id: /`, `lang: en` explícito e screenshots narrow/wide com dimensões reais. Os ecrãs de instalação são ilustrativos.                                                                                          |
| 3. Regra `/auth`     | Feito                         | Removida a denylist; o magic link continua a regressar à origem da app.                                                                                                                                        |
| 4. Câmbio offline    | Documentado                   | Cache em localStorage; sem rede usam-se taxas guardadas ou introduzidas manualmente. Não há cache runtime da Frankfurter no service worker.                                                                    |
| 5. Headers           | Feito                         | CSP, frame-ancestors, X-Frame-Options e Permissions-Policy. Scripts da própria origem, ligações limitadas a Supabase/Frankfurter e à própria origem. Google Fonts autorizado explicitamente.                   |
| 6. Dependências      | Atualizado; avisos permanecem | PWA plugin 2.0.0 e Workbox 7.4.1. Auditoria completa: 2 low + 8 moderate; produção: zero. Ver VERIFICATION.md.                                                                                                 |
| 7. Backups           | Feito                         | Aviso visível no painel de dados: JSON/CSV em texto simples, sem encriptação.                                                                                                                                  |
| 8. Formatação        | Feito                         | Prettier, scripts format/format:check e imports organizados.                                                                                                                                                   |
| 9. Componentes       | Feito                         | Overview e Transactions em src/views; editor, formulários de orçamento/definições, painéis e modal em src/components. App coordena navegação e estado.                                                         |
| 10. Datas            | Feito                         | Novos espaços começam no mês atual; período e primeiro dia configuráveis. Rateio genérico, incluindo fevereiro bissexto. Dados antigos mantêm o seu período; a exceção de outubro só assegura compatibilidade. |
| 11. Bundle           | Feito                         | Supabase separado com manualChunks. Principal ~313 KB + Supabase ~227 KB; sem aviso de chunk acima de 500 KB. Não é carregamento dinâmico completo.                                                            |
| 12. Idiomas          | Parcial                       | Inglês identificado como idioma principal. Pesquisa PT mantida. Tradução integral PT/EN e seletor de idioma ainda não implementados.                                                                           |
| 13. Picker acessível | Feito                         | Setas, Enter, Escape, combobox/listbox, aria-activedescendant, indicação da opção ativa e reposição de foco. Modal associado ao título.                                                                        |
| 14. Apagar/anular    | Feito                         | Diálogo próprio para apagar movimentos e ação Anular. Validação do histórico do cartão mantida; ações pendentes limpas ao mudar de conta. Confirmação de saída com alterações por sincronizar continua nativa. |
| 15. Safe areas       | Feito                         | Insets de topo, fundo e laterais em cabeçalho, conteúdo, navegação e diálogo móvel. Requer confirmação visual num dispositivo com notch.                                                                       |

## Aplicação no Vercel

Publicar o código atualizado através do repositório ligado ao Vercel. Os headers em vercel.json aplicam-se no alojamento; não são automaticamente enviados pelo servidor de desenvolvimento. Caso uses um domínio Supabase personalizado, acrescenta-o ao connect-src da CSP. Para maior restrição, substitui os wildcards Supabase pelo hostname exato do projeto.

Após publicar, aceitar a atualização no PC e no telemóvel. Exportar uma cópia dos dados antes de limpar caches ou dados do site. Não é necessário alterar o SQL do Supabase para estas melhorias.

## Validação

27 testes automáticos, build de produção e verificação de formatação aprovados. Testes Chrome com CSP e resoluções 320–1440 px aprovados, incluindo picker com teclado e apagar/anular. Limites e auditoria detalhados em VERIFICATION.md.

## Funcionalidades — 9 de novembro de 2026

- Recorrências mensais/semanais, confirmação/edição/ignorar, recuperação de atrasos e geração com IDs determinísticos. O dia 31 adapta-se ao mês. Lançamentos automáticos oferecem Anular; sem câmbio ficam pendentes. Regras opcionais em JSON mantêm os backups antigos compatíveis.
- Alertas mensais de 80%/100%, indicadores acessíveis e aviso após guardar despesas. Histórico de avisos por dispositivo, espaço, mês, categoria e limiar; opção para desativar.
- Última moeda de despesas/apoios novos guardada por dispositivo, categoria/grupo de despesas memorizados, favoritos com moeda própria e Anular, atalho PWA para abrir o editor. Edições e lançamentos gerados não alteram a última moeda.
- Lembrete de exportação configurável (7 dias por omissão), último export e estado/hora de sincronização. Conflitos já eram protegidos por revisões e pela função SQL save_budget; comportamento documentado e testado com alterações diferentes em PC/telemóvel. Exportação conjunta das versões e fecho sem escolher silenciosamente a versão local. Sem alteração ao schema Supabase.

Validação desta atualização: 48 testes automáticos, build e format:check. Percurso Chrome com dados isolados e taxas simuladas: atalho, moeda/categoria memorizadas, regra automática, favorito com Anular, alerta e lembrete, sem erros de página ou overflow a 320/390/768/1440 px. Verificação do servidor SQL por inspeção do contrato e testes da decisão de sincronização; não equivale a um ensaio com dois dispositivos ligados ao Supabase real.

Limites: recorrências só são processadas com a app aberta/retomada; taxas em cache podem ser antigas e não são taxas históricas. Anular lançamentos que sustentam lavagens posteriores pode falhar a validação do cartão. Favoritos sem taxa exigem atualização das taxas ou taxa manual nas definições. JSON completo inclui regras/favoritos, CSV inclui apenas movimentos. Exportações são texto simples; o registo indica o pedido de download, não confirma a conservação do ficheiro. Lembretes, preferências e avisos são locais ao dispositivo. A sincronização é manual e substitui documentos completos após escolha em caso de conflito, sem combinação automática. Atualizar ambos os dispositivos antes de sincronizar.

## Reestruturação — 9 de novembro de 2026

- Estado e ações do App separados por responsabilidade em hooks: preferências, período, movimentos, notificações, importação/exportação, seleções das definições e estado da plataforma.
- Definições extraídas para src/views/Settings.tsx. Navegação e estrutura visual, controlos do período e diálogos em componentes próprios.
- Mês e âmbito do plano continuam montados ao navegar; ações pendentes continuam a ser limpas ao mudar de conta. Recorrências mantêm o processamento mesmo fora da Visão geral.
- Mantidos o comportamento, o aspeto, as chaves de armazenamento, os formatos JSON/CSV, as regras de contabilidade e o protocolo Supabase. Sem classes ou bibliotecas adicionais.

Validação da reestruturação: 48 testes, build e format:check; percursos Chrome com dados isolados para adicionar/editar/apagar/anular, pesquisa, navegação de períodos, persistência do mês/âmbito do plano, conteúdo das exportações e confirmação/cancelamento das importações, preferências após recarregar e funcionalidades recentes. Sem ensaio Supabase real nem confirmação de conclusão dos downloads em disco.

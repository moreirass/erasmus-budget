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

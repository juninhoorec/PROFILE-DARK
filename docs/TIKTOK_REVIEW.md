# TikTok Review Checklist — PROFILE DARK

Use este roteiro para gravar o vídeo de demonstração solicitado durante a revisão do Login Kit e da Content Posting API.

## Antes de gravar

- Use uma conta TikTok de teste autorizada para o aplicativo.
- Confirme que o vídeo escolhido é um MP4 válido e pertence ao usuário.
- Não mostre Client Secret, access token, refresh token, arquivos `.env` ou dados internos.
- Grave a tela completa e mantenha visíveis as ações do usuário.

## Demonstração

1. Abrir o PROFILE DARK.
2. Acessar **Redes Sociais** e clicar em **Entrar com TikTok**.
3. Mostrar a página oficial de autorização do TikTok com os escopos solicitados.
4. Autorizar e mostrar o retorno automático ao PROFILE DARK.
5. Mostrar avatar, nome da conta e status **Conectado**.
6. Abrir **Publicar vídeo** e selecionar um MP4 da biblioteca.
7. Mostrar as configurações retornadas pelo Creator Info: conta, privacidade disponível, comentários, Dueto, Costura e limite de duração.
8. Revisar o conteúdo e clicar em **Publicar agora**.
9. Mostrar a progressão real: **Autorizado**, **Enviando vídeo**, **Processando** e, após a confirmação da API, **Publicado**. Se o TikTok recusar, mostrar o erro real retornado.

## Texto recomendado para o campo de análise do TikTok

Profile Dark uses Login Kit to allow users to securely connect and authorize their own TikTok account. The user.info.basic scope is used only to identify the authorized account and display basic profile information such as the display name and avatar.

The Content Posting API is used to let users publish videos created or selected inside Profile Dark to their own TikTok account. The video.publish scope is used only after the user has authorized TikTok access, selected the content and reviewed the publishing options. Profile Dark transfers the selected video to TikTok using the official Content Posting API. Users remain in control of their account and the content they choose to publish.
